import type { FastifyInstance } from "fastify";
import { analyzeScanRequestSchema, confirmScanRequestSchema } from "@dfit/contracts";
import { decideScanQuota } from "@dfit/domain";
import type { AppRepository } from "../repositories/app-repository.js";
import { AiProviderError, type AiProvider } from "../services/ai-provider.js";
import { MockAiProvider } from "../services/mock-ai-provider.js";

export const registerScanRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
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
    const params = request.params as { id: string };
    const scan = await repository.getScan(params.id);
    if (!scan) return reply.status(404).send({ error: "scan_not_found" });
    if (scan.analyzedResponse) return scan.analyzedResponse;

    const parsed = analyzeScanRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_scan_image",
        issues: parsed.error.issues,
      });
    }

    const decision = decideScanQuota(await repository.getQuota());
    if (!decision.allowed) {
      return reply.status(402).send({
        error: "scan_credit_required",
        reason: decision.reason,
        quota: await repository.getQuota(),
      });
    }

    let analyzedResult;
    try {
      analyzedResult = await aiProvider.analyzeMealImage({
        scanId: scan.id,
        userHint: parsed.data.hint,
        image: parsed.data.image,
      });
    } catch (error) {
      await repository.updateScan({
        ...scan,
        status: "failed",
        imageMimeType: parsed.data.image?.mimeType,
        imageByteSize: parsed.data.image?.byteSize,
      });

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

    await repository.consumeCredit(decision.reason);

    await repository.updateScan({
      ...scan,
      status: "ready_for_review",
      creditReason: decision.reason,
      analyzedResponse: analyzedResult.analysis,
      aiProviderRun: analyzedResult.providerRun,
      imageMimeType: parsed.data.image?.mimeType,
      imageByteSize: parsed.data.image?.byteSize,
    });

    return analyzedResult.analysis;
  });

  app.post("/v1/scans/:id/confirm", async (request, reply) => {
    const params = request.params as { id: string };
    const scan = await repository.getScan(params.id);
    if (!scan) return reply.status(404).send({ error: "scan_not_found" });

    const parsed = confirmScanRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_confirmation",
        issues: parsed.error.issues,
      });
    }

    const meal = await repository.createMeal({
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
    });

    await repository.updateScan({ ...scan, status: "confirmed" });

    return reply.status(201).send({
      mealId: meal.mealId,
      totals: meal.totals,
    });
  });
};
