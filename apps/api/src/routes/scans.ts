import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  analyzeScanRequestSchema,
  confirmScanRequestSchema,
  type ConfirmScanRequestContract,
} from "@logmyplate/contracts";
import { decideScanQuota, sumTotals } from "@logmyplate/domain";
import type { AppRepository } from "../repositories/app-repository.js";
import { currentRequestIdentity } from "../request-context.js";
import { AiProviderError, type AiProvider } from "../services/ai-provider.js";
import { resolveFoodPhotoPromptKey } from "../services/food-photo-prompt-routing.js";
import { MockAiProvider } from "../services/mock-ai-provider.js";
import type { MealImageStorage, StoredMealImage } from "../services/meal-image-storage.js";
import { toApiMeal } from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";

const isStoredImageMimeType = (value: string | undefined): value is StoredMealImage["mimeType"] =>
  value === "image/jpeg" || value === "image/png" || value === "image/webp";

const noFoodScanWindowMs = 24 * 60 * 60 * 1_000;
const defaultNoFoodScanLimit = 5;
const scanImageHashAlgorithm = "sha256:v1" as const;

const sha256Hex = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

const analysisForScan = (analysis: unknown, scanId: string) => ({
  ...(analysis as Record<string, unknown>),
  scanId,
  status: "ready_for_review",
});

const reviewedAnalysisForScan = (
  scan: NonNullable<Awaited<ReturnType<AppRepository["getScan"]>>>,
  confirmation: ConfirmScanRequestContract,
) => ({
  scanId: scan.id,
  status: "ready_for_review",
  mealType: confirmation.mealType,
  mealName: confirmation.title,
  detectedLanguage:
    typeof (scan.analyzedResponse as { detectedLanguage?: unknown } | undefined)
      ?.detectedLanguage === "string"
      ? (scan.analyzedResponse as { detectedLanguage: string }).detectedLanguage
      : "en",
  items: confirmation.items.map((item, index) => ({
    id: `reviewed_${index + 1}`,
    name: item.name,
    aliases: [],
    quantity: item.quantity,
    unit: item.unit,
    estimatedGrams: item.estimatedGrams,
    preparation: "unknown",
    confidence: 1,
    nutrition: item.nutrition,
  })),
  totals: sumTotals(confirmation.items.map((item) => item.nutrition)),
});

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

const isNoFoodAnalysis = (analysis: unknown) => {
  const candidate = analysis as { items?: unknown } | undefined;
  return Array.isArray(candidate?.items) && candidate.items.length === 0;
};

const noFoodDetectedResponse = () => ({
  error: "no_food_detected",
  message:
    "We could not detect food clearly. Try a clear, well-lit top-down photo of the full plate.",
  retryable: false,
});

const noFoodLimitResponse = () => ({
  error: "no_food_scan_limit_exceeded",
  message: "Too many non-food scans were detected today. Try again later with a clear meal photo.",
  retryable: false,
});

const noFoodScanLimit = () => {
  const configured = Number(process.env.NO_FOOD_SCAN_DAILY_LIMIT ?? defaultNoFoodScanLimit);
  return Number.isFinite(configured) ? Math.max(0, Math.floor(configured)) : defaultNoFoodScanLimit;
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
      if (isNoFoodAnalysis(scan.analyzedResponse)) {
        return reply.status(422).send(noFoodDetectedResponse());
      }

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

    const userHint = parsed.data.hint?.trim() || undefined;
    const imageHash = imageBytes ? sha256Hex(imageBytes) : undefined;
    if (imageHash) {
      try {
        const cachedAnalysis = await timer.measure("scanAnalysisCacheLookup", () =>
          repository.findScanAnalysisCache({
            profileId: scan.profileId,
            imageHash,
            hashAlgorithm: scanImageHashAlgorithm,
          }),
        );

        if (cachedAnalysis && !isNoFoodAnalysis(cachedAnalysis.analyzedResponse)) {
          const response = analysisForScan(cachedAnalysis.analyzedResponse, scan.id);
          await timer.measure("scanMarkCachedReady", () =>
            repository.updateScan({
              ...scan,
              status: "ready_for_review",
              userHint,
              imageMimeType: image?.mimeType,
              imageByteSize: image?.byteSize,
              imageHash,
              imageHashAlgorithm: scanImageHashAlgorithm,
              analyzedResponse: response,
            }),
          );

          request.log.info(
            {
              route: "/v1/scans/:id/analyze",
              scanId: scan.id,
              hasImage: true,
              cached: true,
              timings: timer.snapshot(),
            },
            "scan analyze timings",
          );

          return {
            ...response,
            imageStored: false,
          };
        }
      } catch (error) {
        request.log.error({ err: error, scanId: scan.id }, "scan analysis cache lookup failed");
      }
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

    const noFoodLimit = noFoodScanLimit();
    if (noFoodLimit > 0) {
      const noFoodAttempts = await timer.measure("noFoodAttempts", () =>
        repository.countNoFoodScanAttemptsSince(
          new Date(Date.now() - noFoodScanWindowMs).toISOString(),
        ),
      );
      if (noFoodAttempts >= noFoodLimit) {
        return reply.status(429).send(noFoodLimitResponse());
      }
    }

    const identity = currentRequestIdentity();
    const promptKey = resolveFoodPhotoPromptKey({
      region: identity.region,
      locale: identity.locale,
    });

    const scanWithRequestContext = {
      ...scan,
      status: "analyzing" as const,
      userHint,
      imageMimeType: image?.mimeType,
      imageByteSize: image?.byteSize,
      imageHash,
      imageHashAlgorithm: imageHash ? scanImageHashAlgorithm : undefined,
    };
    await timer.measure("scanMarkAnalyzing", () => repository.updateScan(scanWithRequestContext));

    let analyzedResult;
    try {
      analyzedResult = await timer.measure("aiAnalyze", () =>
        aiProvider.analyzeMealImage({
          scanId: scan.id,
          userHint,
          promptKey,
          locale: identity.locale,
          region: identity.region,
          timezone: identity.timezone,
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

      request.log.error(
        {
          err: error,
          route: "/v1/scans/:id/analyze",
          scanId: scan.id,
          timings: timer.snapshot(),
          aiProviderError:
            error instanceof AiProviderError
              ? {
                  code: error.code,
                  statusCode: error.statusCode,
                  retryable: error.retryable,
                  details: error.details,
                }
              : undefined,
        },
        "scan analyze failed",
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

    const hasFoodItems = analyzedResult.analysis.items.length > 0;
    if (hasFoodItems) {
      await timer.measure("consumeCredit", () => repository.consumeCredit(decision.reason));
    }

    let storedScanImage: StoredMealImage | undefined;
    if (hasFoodItems && image && imageBytes && mealImageStorage.enabled) {
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
        status: hasFoodItems ? "ready_for_review" : "failed",
        creditReason: hasFoodItems ? decision.reason : undefined,
        analyzedResponse: analyzedResult.analysis,
        aiProviderRun: analyzedResult.providerRun,
        imageBucket: storedScanImage?.bucket,
        imageObjectKey: storedScanImage?.objectKey,
      }),
    );

    if (hasFoodItems && imageHash) {
      try {
        await timer.measure("scanAnalysisCacheStore", () =>
          repository.upsertScanAnalysisCache({
            profileId: scan.profileId,
            imageHash,
            hashAlgorithm: scanImageHashAlgorithm,
            imageMimeType: image?.mimeType,
            imageByteSize: image?.byteSize,
            analyzedResponse: analyzedResult.analysis,
          }),
        );
      } catch (error) {
        request.log.error({ err: error, scanId: scan.id }, "scan analysis cache store failed");
      }
    }

    const response = {
      ...analyzedResult.analysis,
      imageStored: Boolean(storedScanImage),
    };

    if (!hasFoodItems) {
      request.log.info(
        {
          route: "/v1/scans/:id/analyze",
          scanId: scan.id,
          hasImage: Boolean(image),
          noFoodDetected: true,
          timings: timer.snapshot(),
        },
        "scan analyze no food detected",
      );
      return reply.status(422).send(noFoodDetectedResponse());
    }

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

    const confirmedImageHash = scan.imageHash;
    if (confirmedImageHash && scan.imageHashAlgorithm === scanImageHashAlgorithm) {
      try {
        await timer.measure("scanAnalysisCacheStoreReviewed", () =>
          repository.upsertScanAnalysisCache({
            profileId: scan.profileId,
            imageHash: confirmedImageHash,
            hashAlgorithm: scanImageHashAlgorithm,
            imageMimeType: scan.imageMimeType ?? image?.mimeType,
            imageByteSize: scan.imageByteSize ?? image?.byteSize,
            analyzedResponse: reviewedAnalysisForScan(scan, parsed.data),
          }),
        );
      } catch (error) {
        request.log.error(
          { err: error, mealId: meal.mealId, scanId: scan.id },
          "scan analysis cache reviewed store failed",
        );
      }
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
