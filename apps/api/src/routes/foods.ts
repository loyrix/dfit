import type { FastifyInstance } from "fastify";
import type { AppRepository } from "../repositories/app-repository.js";

export const registerFoodRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.get("/v1/foods", async (request) => {
    const query = (request.query as { q?: string }).q ?? "";
    return {
      query,
      results: await repository.searchFoods(query),
    };
  });

  app.get("/v1/foods/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const food = await repository.getFood(params.id);
    if (!food) return reply.status(404).send({ error: "food_not_found" });
    return food;
  });

  app.get("/v1/foods/:id/units", async (request, reply) => {
    const params = request.params as { id: string };
    const food = await repository.getFood(params.id);
    if (!food) return reply.status(404).send({ error: "food_not_found" });
    return {
      foodId: food.id,
      portions: food.portions,
    };
  });
};
