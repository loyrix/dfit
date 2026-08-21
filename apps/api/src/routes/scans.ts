import { createHash } from "node:crypto";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import {
  analyzeScanRequestSchema,
  confirmScanRequestSchema,
  type AnalyzeScanResponseContract,
  type ConfirmScanRequestContract,
} from "@logmyplate/contracts";
import {
  calculatePlateScore,
  confidenceAfterSignals,
  decideScanQuota,
  detectPlateWarnings,
  detectPortionSignals,
  diffScanConfirmation,
  isAccuracyDefect,
  mergeAnalysisMicronutrients,
  recoverCookingMethods,
  sumTotals,
  type CookingMethodValue,
  type ScanConfirmationDiff,
  type ScanItemSnapshot,
} from "@logmyplate/domain";
import type { AppRepository, ScanCorrectionRecord } from "../repositories/app-repository.js";
import { currentRequestIdentity } from "../request-context.js";
import { AiProviderError, type AiProvider } from "../services/ai-provider.js";
import { resolveFoodPhotoPromptKey } from "../services/food-photo-prompt-routing.js";
import { MockAiProvider } from "../services/mock-ai-provider.js";
import type { MealImageStorage, StoredMealImage } from "../services/meal-image-storage.js";
import type { ConfirmedScanFoodLearningItem } from "../repositories/app-repository.js";
import { toApiMeal, toPlateScoreProfile, toRatingContext } from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";
import { loadPlateScorePolicy } from "../services/plate-score-policy.js";
import { loadMealScorePolicy } from "../services/meal-score-policy.js";
import type { SqlClient } from "../db/client.js";

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

const learningItemsFromAnalysis = (analysis: unknown): ConfirmedScanFoodLearningItem[] => {
  const items = (analysis as { items?: unknown } | undefined)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => item as Partial<ConfirmedScanFoodLearningItem>)
    .filter((item) => typeof item.name === "string")
    .map((item) => ({
      name: item.name as string,
      aliases: Array.isArray(item.aliases)
        ? item.aliases.filter((alias): alias is string => typeof alias === "string")
        : [],
      quantity: Number(item.quantity),
      unit: item.unit as ConfirmedScanFoodLearningItem["unit"],
      estimatedGrams: Number(item.estimatedGrams),
      confidence: typeof item.confidence === "number" ? item.confidence : undefined,
      nutrition: item.nutrition as ConfirmedScanFoodLearningItem["nutrition"],
    }));
};

const learningItemsFromConfirmation = (
  items: ConfirmScanRequestContract["items"],
): ConfirmedScanFoodLearningItem[] =>
  items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    estimatedGrams: item.estimatedGrams,
    nutrition: item.nutrition,
  }));

const toScanItemSnapshot = (item: {
  name: string;
  quantity: number;
  unit: string;
  estimatedGrams: number;
  nutrition?: { calories?: number };
}): ScanItemSnapshot => ({
  name: item.name,
  quantity: Number(item.quantity) || 0,
  unit: item.unit,
  grams: Number(item.estimatedGrams) || 0,
  calories: Number(item.nutrition?.calories) || 0,
});

/**
 * Diffs what the AI suggested against what the user confirmed. Derived on the
 * server rather than reported by the client so every already-installed app
 * build feeds the accuracy loop without needing a release.
 *
 * Returns an empty diff when the scan has no stored analysis (for example a
 * manually built meal), which correctly yields "nothing was corrected".
 */
const diffConfirmationAgainstAnalysis = (
  analysis: unknown,
  confirmedItems: ConfirmScanRequestContract["items"],
): ScanConfirmationDiff =>
  diffScanConfirmation(
    learningItemsFromAnalysis(analysis).map(toScanItemSnapshot),
    confirmedItems.map(toScanItemSnapshot),
  );

/**
 * Re-attaches micronutrients the client dropped, using the analysis the API
 * already stored for this scan.
 *
 * App builds before the 7-field `MacroTotals` change parse only
 * calories/protein/carbs/fat, so fiber (and sugar/sodium when present) never
 * makes it back on confirm and is persisted as null. Recovering it server-side
 * means every installed app version contributes, with no release required.
 *
 * Deliberately conservative:
 * - only fiberG, sugarG and sodiumMg are ever written, never a macro;
 * - values the client did send always win;
 * - a nutrient the AI did not return stays absent, never becomes 0;
 * - any failure returns the original items, so a confirm can never break.
 */
const recoverMicronutrients = (
  analysis: unknown,
  items: ConfirmScanRequestContract["items"],
  log: FastifyBaseLogger,
): ConfirmScanRequestContract["items"] => {
  try {
    const source = learningItemsFromAnalysis(analysis).map((item) => ({
      name: item.name,
      grams: Number(item.estimatedGrams) || 0,
      nutrition: {
        fiberG: item.nutrition?.fiberG,
        sugarG: item.nutrition?.sugarG,
        sodiumMg: item.nutrition?.sodiumMg,
      },
    }));

    const hasAnything = source.some(
      ({ nutrition }) =>
        nutrition.fiberG !== undefined ||
        nutrition.sugarG !== undefined ||
        nutrition.sodiumMg !== undefined,
    );
    if (!hasAnything) return items;

    const merged = mergeAnalysisMicronutrients(
      source,
      items.map((item) => ({
        name: item.name,
        grams: item.estimatedGrams,
        nutrition: {
          fiberG: item.nutrition.fiberG,
          sugarG: item.nutrition.sugarG,
          sodiumMg: item.nutrition.sodiumMg,
        },
      })),
    );

    return items.map((item, index) => {
      const recovered = merged[index]?.nutrition;
      if (!recovered) return item;
      return {
        ...item,
        nutrition: {
          ...item.nutrition,
          ...(recovered.fiberG === undefined ? {} : { fiberG: recovered.fiberG }),
          ...(recovered.sugarG === undefined ? {} : { sugarG: recovered.sugarG }),
          ...(recovered.sodiumMg === undefined ? {} : { sodiumMg: recovered.sodiumMg }),
        },
      };
    });
  } catch (error) {
    log.error({ err: error }, "micronutrient recovery failed");
    return items;
  }
};

/**
 * Recovers each item's cooking method from the analysis the API already stored.
 *
 * No app build sends this back: `confirmScanRequest` carries name, portion and
 * nutrition only. Without recovering it here the field would be captured at
 * analysis and dropped at confirm, leaving the Part B and Part C cooking
 * modifiers inert on every stored meal. Doing it server-side means every
 * installed build contributes the moment prompt v9 is activated, with no release.
 *
 * Returns one entry per confirmed item, aligned by index. Undefined for an item
 * with no match, an analysis from before v9, or a model that answered "unknown"
 * — all three mean the same thing to the scorer, which is to skip the modifier.
 *
 * Any failure yields all-undefined, so a confirm can never break over this.
 */
const recoverCookingMethodsForConfirm = (
  analysis: unknown,
  items: ConfirmScanRequestContract["items"],
  log: FastifyBaseLogger,
): (CookingMethodValue | undefined)[] => {
  try {
    const analyzed = (
      (analysis as { items?: unknown } | undefined)?.items as
        | { name?: unknown; cookingMethod?: unknown }[]
        | undefined
    )?.map((item) => ({
      name: typeof item?.name === "string" ? item.name : "",
      cookingMethod: item?.cookingMethod as CookingMethodValue | undefined,
    }));

    if (!analyzed?.length) return items.map(() => undefined);

    return recoverCookingMethods(
      analyzed,
      items.map((item) => item.name),
    );
  } catch (error) {
    log.error({ err: error }, "cooking method recovery failed");
    return items.map(() => undefined);
  }
};

const correctionsFromDiff = (diff: ScanConfirmationDiff): ScanCorrectionRecord[] => [
  ...diff.added.map((after) => ({ kind: "item_added" as const, after })),
  ...diff.removed.map((before) => ({ kind: "item_removed" as const, before })),
  ...diff.changed.map((change) => ({
    kind: "item_changed" as const,
    before: change.before,
    after: { ...change.after, changedFields: change.fields },
  })),
];

/**
 * Runs the domain quality signals over an analysis.
 *
 * Values are never rewritten: a 3 kg pot of sabzi is a legitimate answer and
 * shrinking it would corrupt the user's log. Only genuine defects (calories
 * that disagree with their own macros) lower confidence, which the review
 * screen already surfaces. Size-based signals are pure telemetry for the admin
 * accuracy queue.
 */
const applyPortionSignals = (items: AnalyzeScanResponseContract["items"]) => {
  const evaluated = items.map((item) => ({
    item,
    signals: detectPortionSignals({
      estimatedGrams: item.estimatedGrams,
      nutrition: item.nutrition,
    }),
  }));

  return {
    items: evaluated.map(({ item, signals }) =>
      signals.some(isAccuracyDefect)
        ? { ...item, confidence: confidenceAfterSignals(item.confidence, signals) }
        : item,
    ),
    signalled: evaluated
      .filter(({ signals }) => signals.length > 0)
      .map(({ item, signals }) => ({
        name: item.name,
        estimatedGrams: item.estimatedGrams,
        calories: item.nutrition.calories,
        signals,
      })),
  };
};

/**
 * Attaches a freshly computed Plate Score to an analysis.
 *
 * Applied on every return path, including the two cached ones, because the
 * score depends on the user's health target and policy rather than on the
 * photo. Caching it would mean a user who updates their goal keeps seeing the
 * score from before the change on any repeat image.
 *
 * Non-fatal: a failure leaves whatever score was already there rather than
 * costing the user a scan.
 */
const withFreshPlateScore = async (
  analysis: Record<string, unknown>,
  profileId: string,
  repository: AppRepository,
  sql: SqlClient | undefined,
  log: FastifyBaseLogger,
): Promise<Record<string, unknown>> => {
  try {
    const items = (analysis.items as Array<{ nutrition?: unknown }> | undefined) ?? [];
    if (items.length === 0) return analysis;

    const [healthTarget, policy] = await Promise.all([
      repository.getHealthTarget(profileId),
      loadPlateScorePolicy(sql),
    ]);

    const nutrition = items.map(
      (item) => item.nutrition as AnalyzeScanResponseContract["items"][number]["nutrition"],
    );
    const baseScore = calculatePlateScore(
      {
        items: nutrition,
        mealType: analysis.mealType as AnalyzeScanResponseContract["mealType"],
        profile: toPlateScoreProfile(healthTarget),
      },
      policy,
    );
    if (!baseScore) return analysis;

    return {
      ...analysis,
      plateScore: {
        ...baseScore,
        warnings: detectPlateWarnings(nutrition, healthTarget?.healthFocus ?? []),
      },
    };
  } catch (error) {
    log.error({ err: error, profileId }, "plate score for analysis failed");
    return analysis;
  }
};

/**
 * Removes advice from a cached analysis.
 *
 * The analysis cache is keyed on the image, but advice is written for the
 * user's goal and health focus at the time it was generated. Rather than fold
 * the profile into the cache key — which would cost a scan credit every time
 * someone edits their conditions, since cache hits skip credit consumption — we
 * simply drop advice on a cache hit. The score is recomputed and stays correct;
 * advice reappears on the next fresh analysis.
 */
const withoutStaleAdvice = (analysis: Record<string, unknown>): Record<string, unknown> => {
  if (!("advice" in analysis)) return analysis;
  const { advice: _stale, ...rest } = analysis;
  return rest;
};

const noFoodScanLimit = () => {
  const configured = Number(process.env.NO_FOOD_SCAN_DAILY_LIMIT ?? defaultNoFoodScanLimit);
  return Number.isFinite(configured) ? Math.max(0, Math.floor(configured)) : defaultNoFoodScanLimit;
};

export const registerScanRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
  aiProvider: AiProvider = new MockAiProvider(),
  sql?: SqlClient,
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
        ...(await withFreshPlateScore(
          withoutStaleAdvice(scan.analyzedResponse as Record<string, unknown>),
          scan.profileId,
          repository,
          sql,
          request.log,
        )),
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

    // Kick off the quota and no-food reads now so they run concurrently with
    // the cache lookup instead of sequentially after a cache miss. Rejections
    // are surfaced where the promises are awaited below; the extra .catch on
    // a separate derived promise only prevents unhandled-rejection noise when
    // a cache hit returns early.
    const quotaPromise = timer.measure("quota", () => repository.getQuota());
    quotaPromise.catch(() => undefined);
    const noFoodLimit = noFoodScanLimit();
    const noFoodAttemptsPromise =
      noFoodLimit > 0
        ? timer.measure("noFoodAttempts", () =>
            repository.countNoFoodScanAttemptsSince(
              new Date(Date.now() - noFoodScanWindowMs).toISOString(),
            ),
          )
        : undefined;
    noFoodAttemptsPromise?.catch(() => undefined);

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
            ...(await withFreshPlateScore(
              withoutStaleAdvice(response as Record<string, unknown>),
              scan.profileId,
              repository,
              sql,
              request.log,
            )),
            imageStored: false,
          };
        }
      } catch (error) {
        request.log.error({ err: error, scanId: scan.id }, "scan analysis cache lookup failed");
      }
    }

    const quota = await quotaPromise;
    const decision = decideScanQuota(quota);
    if (!decision.allowed) {
      return reply.status(402).send({
        error: "scan_credit_required",
        reason: decision.reason,
        quota,
      });
    }

    if (noFoodAttemptsPromise) {
      const noFoodAttempts = await noFoodAttemptsPromise;
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
    // Run the bookkeeping "analyzing" write concurrently with the AI call.
    // Write ordering against the later ready/failed updates is preserved by
    // awaiting this promise before either of them. A failure here is logged
    // instead of aborting: the scan-ready write below surfaces persistent
    // database problems anyway, and the AI work should not be wasted.
    const markAnalyzingPromise = timer
      .measure("scanMarkAnalyzing", () => repository.updateScan(scanWithRequestContext))
      .catch((error) => {
        request.log.error({ err: error, scanId: scan.id }, "scan mark analyzing failed");
      });

    let analyzedResult;
    try {
      // Only goal and health focus travel to the model, and only to shape the
      // wording of optional advice. The score stays deterministic.
      const adviceProfile = await timer
        .measure("healthTargetForAdvice", () => repository.getHealthTarget(scan.profileId))
        .catch(() => undefined);

      analyzedResult = await timer.measure("aiAnalyze", () =>
        aiProvider.analyzeMealImage({
          scanId: scan.id,
          userHint,
          promptKey,
          locale: identity.locale,
          region: identity.region,
          timezone: identity.timezone,
          image,
          userProfile: adviceProfile
            ? { goal: adviceProfile.goal, healthFocus: adviceProfile.healthFocus }
            : undefined,
        }),
      );
    } catch (error) {
      await markAnalyzingPromise;
      // Record the failed run. Without this no ai_provider_runs row is written
      // at all on failure, so the cost dashboard's "failed runs" metric is zero
      // by construction rather than by measurement.
      const failedRun = error instanceof AiProviderError ? error.run : undefined;
      await timer.measure("scanMarkFailed", () =>
        repository.updateScan({
          ...scanWithRequestContext,
          status: "failed",
          aiProviderRun: failedRun
            ? {
                ...failedRun,
                success: false,
                errorCode: error instanceof AiProviderError ? error.code : "ai_provider_failed",
              }
            : undefined,
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

    const portionReview = applyPortionSignals(analyzedResult.analysis.items);
    if (portionReview.signalled.length > 0) {
      analyzedResult.analysis.items = portionReview.items;
      request.log.warn(
        {
          route: "/v1/scans/:id/analyze",
          scanId: scan.id,
          items: portionReview.signalled,
        },
        "scan portion signals",
      );
    }

    const hasFoodItems = analyzedResult.analysis.items.length > 0;

    // Credit consumption, image storage upload, and analysis-cache store are
    // independent of each other, so run them concurrently instead of paying
    // for three sequential round-trips. Only consumeCredit is fatal (same as
    // before); upload and cache-store failures stay logged and non-fatal.
    const consumeCreditPromise = hasFoodItems
      ? timer.measure("consumeCredit", () => repository.consumeCredit(decision.reason))
      : undefined;

    const scanImageUploadPromise: Promise<StoredMealImage | undefined> | undefined =
      hasFoodItems && image && imageBytes && mealImageStorage.enabled
        ? timer
            .measure("scanImageUpload", () =>
              mealImageStorage.uploadScanImage({
                profileId: scan.profileId,
                scanId: scan.id,
                bytes: imageBytes,
                mimeType: image.mimeType,
              }),
            )
            .catch((error) => {
              request.log.error({ err: error, scanId: scan.id }, "scan image upload failed");
              return undefined;
            })
        : undefined;

    const cacheStorePromise =
      hasFoodItems && imageHash
        ? timer
            .measure("scanAnalysisCacheStore", () =>
              repository.upsertScanAnalysisCache({
                profileId: scan.profileId,
                imageHash,
                hashAlgorithm: scanImageHashAlgorithm,
                imageMimeType: image?.mimeType,
                imageByteSize: image?.byteSize,
                analyzedResponse: analyzedResult.analysis,
              }),
            )
            .catch((error) => {
              request.log.error(
                { err: error, scanId: scan.id },
                "scan analysis cache store failed",
              );
            })
        : undefined;

    const [storedScanImage] = await Promise.all([
      scanImageUploadPromise,
      consumeCreditPromise,
      cacheStorePromise,
      // Preserve write ordering: the "analyzing" update must land before the
      // ready/failed update below. Never rejects (caught above).
      markAnalyzingPromise,
    ]);

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

    const response = {
      ...(await timer.measure("plateScore", () =>
        withFreshPlateScore(
          analyzedResult.analysis as unknown as Record<string, unknown>,
          scan.profileId,
          repository,
          sql,
          request.log,
        ),
      )),
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

    const correctionDiff = diffConfirmationAgainstAnalysis(
      scan.analyzedResponse,
      parsed.data.items,
    );

    // Order and length are preserved, so correctionDiff indexes stay aligned.
    const itemsToPersist = recoverMicronutrients(
      scan.analyzedResponse,
      parsed.data.items,
      request.log,
    );

    const cookingMethods = recoverCookingMethodsForConfirm(
      scan.analyzedResponse,
      parsed.data.items,
      request.log,
    );

    let meal = await timer.measure("dbCreateMeal", () =>
      repository.createMeal({
        profileId: scan.profileId,
        mealType: parsed.data.mealType,
        title: parsed.data.title,
        source: "ai_scan",
        scanSessionId: scan.id,
        // Captured at scan time so meal detail can show the same guidance the
        // user saw on the review screen, instead of it vanishing on confirm.
        advice: (scan.analyzedResponse as { advice?: unknown } | undefined)?.advice,
        items: itemsToPersist.map((item, index) => ({
          displayName: item.name,
          portion: {
            quantity: item.quantity,
            unit: item.unit,
            grams: item.estimatedGrams,
          },
          nutrition: item.nutrition,
          userEdited: correctionDiff.confirmedItemEdited[index] ?? false,
          cookingMethod: cookingMethods[index],
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

    try {
      await timer.measure("learnFoods", () =>
        repository.learnFoodsFromConfirmedScan({
          scanId: scan.id,
          region: currentRequestIdentity().region,
          predictedItems: learningItemsFromAnalysis(scan.analyzedResponse),
          confirmedItems: learningItemsFromConfirmation(parsed.data.items),
        }),
      );
    } catch (error) {
      request.log.error(
        { err: error, mealId: meal.mealId, scanId: scan.id },
        "confirmed food learning failed",
      );
    }

    // Best-effort accuracy telemetry: a failure here must never fail the confirm.
    if (correctionDiff.hasChanges) {
      try {
        await timer.measure("recordCorrections", () =>
          repository.recordScanCorrections({
            scanId: scan.id,
            corrections: correctionsFromDiff(correctionDiff),
          }),
        );
      } catch (error) {
        request.log.error(
          { err: error, mealId: meal.mealId, scanId: scan.id },
          "recording scan corrections failed",
        );
      }
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

    const [confirmHealthTarget, confirmPolicy, confirmMealScorePolicy] = await Promise.all([
      timer.measure("healthTarget", () => repository.getHealthTarget(scan.profileId)),
      timer.measure("plateScorePolicy", () => loadPlateScorePolicy(sql)),
      timer.measure("mealScorePolicy", () => loadMealScorePolicy(sql)),
    ]);
    const responseMeal = await timer.measure("hydrateMeal", () =>
      toApiMeal(scan.profileId, meal, mealImageStorage, {
        healthTarget: confirmHealthTarget,
        plateScorePolicy: confirmPolicy,
        rating: toRatingContext(confirmHealthTarget, confirmMealScorePolicy),
      }),
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
