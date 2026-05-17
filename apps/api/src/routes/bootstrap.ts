import type { FastifyInstance } from "fastify";
import type { AppRepository } from "../repositories/app-repository.js";
import { buildJournalRange } from "./journal-presenter.js";

export const registerBootstrapRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.get("/v1/app/bootstrap", async () => {
    const profile = await repository.getProfile();
    const [weeklyRange, quota] = await Promise.all([
      buildJournalRange(repository, profile, 7),
      repository.getQuota(),
    ]);
    const todayDay =
      weeklyRange.days.find((day) => day.date === weeklyRange.endDate) ??
      weeklyRange.days[weeklyRange.days.length - 1];
    if (!todayDay) throw new Error("bootstrap_range_empty");

    return {
      serverTime: new Date().toISOString(),
      profile,
      quota,
      today: {
        date: weeklyRange.endDate,
        timezone: profile.timezone,
        totals: todayDay.totals,
        meals: todayDay.meals,
      },
      weeklyRange,
    };
  });
};
