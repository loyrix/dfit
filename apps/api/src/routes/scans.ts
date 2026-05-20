import type { FastifyInstance } from "fastify";
import { analyzeScanRequestSchema, confirmScanRequestSchema } from "@logmyplate/contracts";
import { decideScanQuota } from "@logmyplate/domain";
import type { AppRepository } from "../repositories/app-repository.js";
import { AiProviderError, type AiProvider } from "../services/ai-provider.js";
import { MockAiProvider } from "../services/mock-ai-provider.js";
import type { MealImageStorage, StoredMealImage } from "../services/meal-image-storage.js";
import { toApiMeal } from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";

const isStoredImageMimeType = (value: string | undefined): value is StoredMealImage["mimeType"] =>
  value === "image/jpeg" || value === "image/png" || value === "image/webp";

const imageFromScan = (
  scan: Awaited<ReturnType<AppRepository["getScan"]>>,
): StoredMealImage | undefined => {
  if (
    !scan?.imageBucket ||
    !scan.imageObjectKey ||
    !isStoredImageMimeType(scan.imageMimeType) ||
    !scan.imageByteSize
  ) {
    return undefined;
  }

  return {
    bucket: scan.imageBucket,
    objectKey: scan.imageObjectKey,
    mimeType: scan.imageMimeType,
    byteSize: scan.imageByteSize,
  };
};

export const registerScanRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
  aiProvider: AiProvider = new MockAiProvider(),
): Promise<void> => {
  app.get("/v1/quota", async () => repository.getQuota());

  app.post("/v1/scans/prepare", async (_request, reply) => {
    const scan = await repository.prepareScan();
    return reply.status(201).send({
      scanId: scan.id,
      status: "prepared",
      quota: await repository.getQuota(),
    });
  });

  app.post("/v1/scans/:id/analyze", async (request, reply) => {
    const timer = createRouteTimer();
    const params = request.params as { id: string };
    const scan = await timer.measure("getScan", () => repository.getScan(params.id));
    if (!scan) return reply.status(404).send({ error: "scan_not_found" });
    if (scan.analyzedResponse) {
      request.log.info(
        {
          route: "/v1/scans/:id/analyze",
          scanId: scan.id,
          timings: timer.snapshot(),
          cached: true,
        },
        "scan analyze timings",
      );
      return {
        ...(scan.analyzedResponse as Record<string, unknown>),
        imageStored: Boolean(imageFromScan(scan)),
      };
    }

    const parsed = analyzeScanRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_scan_image",
        issues: parsed.error.issues,
      });
    }

    const image = parsed.data.image;
    const imageBytes = image
      ? await timer.measure("decodeImage", async () => Buffer.from(image.base64, "base64"))
      : undefined;
    if (image && imageBytes?.byteLength !== image.byteSize) {
      return reply.status(400).send({ error: "scan_image_size_mismatch" });
    }

    const quota = await timer.measure("quota", () => repository.getQuota());
    const decision = decideScanQuota(quota);
    if (!decision.allowed) {
      return reply.status(402).send({
        error: "scan_credit_required",
        reason: decision.reason,
        quota,
      });
    }

    const userHint = parsed.data.hint?.trim() || undefined;
    const scanWithRequestContext = {
      ...scan,
      status: "analyzing" as const,
      userHint,
      imageMimeType: image?.mimeType,
      imageByteSize: image?.byteSize,
    };
    await timer.measure("scanMarkAnalyzing", () => repository.updateScan(scanWithRequestContext));

    let analyzedResult;
    try {
      analyzedResult = await timer.measure("aiAnalyze", () =>
        aiProvider.analyzeMealImage({
          scanId: scan.id,
          userHint,
          image,
        }),
      );
    } catch (error) {
      await timer.measure("scanMarkFailed", () =>
        repository.updateScan({
          ...scanWithRequestContext,
          status: "failed",
        }),
      );

      if (error instanceof AiProviderError) {
        return reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
          retryable: error.retryable,
        });
      }

      return reply.status(502).send({
        error: "ai_provider_failed",
        message: "Food analysis failed.",
        retryable: true,
      });
    }

    await timer.measure("consumeCredit", () => repository.consumeCredit(decision.reason));

    let storedScanImage: StoredMealImage | undefined;
    if (image && imageBytes && mealImageStorage.enabled) {
      try {
        storedScanImage = await timer.measure("scanImageUpload", () =>
          mealImageStorage.uploadScanImage({
            profileId: scan.profileId,
            scanId: scan.id,
            bytes: imageBytes,
            mimeType: image.mimeType,
          }),
        );
      } catch (error) {
        request.log.error({ err: error, scanId: scan.id }, "scan image upload failed");
      }
    }

    await timer.measure("scanMarkReady", () =>
      repository.updateScan({
        ...scanWithRequestContext,
        status: "ready_for_review",
        creditReason: decision.reason,
        analyzedResponse: analyzedResult.analysis,
        aiProviderRun: analyzedResult.providerRun,
        imageBucket: storedScanImage?.bucket,
        imageObjectKey: storedScanImage?.objectKey,
      }),
    );

    const response = {
      ...analyzedResult.analysis,
      imageStored: Boolean(storedScanImage),
    };

    request.log.info(
      {
        route: "/v1/scans/:id/analyze",
        scanId: scan.id,
        hasImage: Boolean(image),
        storedImage: Boolean(storedScanImage),
        timings: timer.snapshot(),
      },
      "scan analyze timings",
    );

    return response;
  });

  app.post("/v1/scans/:id/confirm", async (request, reply) => {
    const timer = createRouteTimer();
    const params = request.params as { id: string };
    const scan = await timer.measure("getScan", () => repository.getScan(params.id));
    if (!scan) return reply.status(404).send({ error: "scan_not_found" });

    const parsed = confirmScanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_confirmation",
        issues: parsed.error.issues,
      });
    }

    const image = parsed.data.image;
    const storedScanImage = imageFromScan(scan);

    let meal = await timer.measure("dbCreateMeal", () =>
      repository.createMeal({
        profileId: scan.profileId,
        mealType: parsed.data.mealType,
        title: parsed.data.title,
        source: "ai_scan",
        scanSessionId: scan.id,
        items: parsed.data.items.map((item) => ({
          displayName: item.name,
          portion: {
            quantity: item.quantity,
            unit: item.unit,
            grams: item.estimatedGrams,
          },
          nutrition: item.nutrition,
        })),
      }),
    );

    let imageToAttach = storedScanImage;
    if (!imageToAttach && image && mealImageStorage.enabled) {
      const imageBytes = await timer.measure("decodeImage", async () =>
        Buffer.from(image.base64, "base64"),
      );
      if (imageBytes.byteLength !== image.byteSize) {
        return reply.status(400).send({ error: "scan_image_size_mismatch" });
      }
      try {
        imageToAttach = await timer.measure("imageUpload", () =>
          mealImageStorage.uploadMealImage({
            profileId: scan.profileId,
            mealId: meal.mealId,
            bytes: imageBytes,
            mimeType: image.mimeType,
          }),
        );
      } catch (error) {
        request.log.error(
          { err: error, mealId: meal.mealId, scanId: scan.id },
          "meal image upload failed",
        );
      }
    }

    if (imageToAttach) {
      meal =
        (await timer.measure("imageAttach", () =>
          repository.attachMealImage(meal.mealId, imageToAttach),
        )) ?? meal;
    }

    await timer.measure("scanMarkConfirmed", () =>
      repository.updateScan({ ...scan, status: "confirmed" }),
    );

    const responseMeal = await timer.measure("hydrateMeal", () =>
      toApiMeal(scan.profileId, meal, mealImageStorage),
    );

    request.log.info(
      {
        route: "/v1/scans/:id/confirm",
        scanId: scan.id,
        mealId: meal.mealId,
        attachedStoredScanImage: Boolean(storedScanImage),
        attachedImage: Boolean(imageToAttach),
        timings: timer.snapshot(),
      },
      "scan confirm timings",
    );

    return reply.status(201).send({
      mealId: meal.mealId,
      totals: meal.totals,
      meal: responseMeal,
    });
  });
};
