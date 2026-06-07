import type { EngagementPolicyConfig } from "./engagement-policy.js";
import {
  FirebaseCloudMessagingSender,
  pushNotificationFailureKey,
  type PushNotificationSendResult,
} from "./push-notifications.js";
import type { SqlClient } from "../db/client.js";

export const reminderScenarioKeys = [
  "breakfast",
  "lunch",
  "snack",
  "dinner",
  "targetSetup",
] as const;

export type ReminderScenarioKey = (typeof reminderScenarioKeys)[number];
export type ReminderScenarioSlot = "primary" | "secondary";

type ReminderToken = {
  id: string;
  token: string;
  tokenHash: string;
};

type ReminderMealSummary = {
  localDate: string;
  mealType: string;
  calories: number;
};

type SentReminderSummary = {
  localDate: string;
  scenarioKey: ReminderScenarioKey;
  scenarioSlot?: ReminderScenarioSlot;
};

type ReminderCandidateRow = {
  profile_id: string;
  timezone: string | null;
  has_target: boolean;
  daily_calorie_target: number | string | null;
  tokens: unknown;
  meals: unknown;
  sent_reminders: unknown;
};

type ReminderRunRow = {
  id: string;
};

type ReminderDeliveryRow = {
  id: string;
};

const reminderHistoryRetentionDays = 14;

export type ReminderCandidate = {
  profileId: string;
  timezone: string;
  localDate: string;
  localTimeMinutes: number;
  hasTarget: boolean;
  dailyCalorieTarget: number | null;
  todayCalories: number;
  loggedMealTypes: Set<string>;
  sentScenarioKeys: Set<string>;
  sentTodayCount: number;
  tokens: ReminderToken[];
};

export type ReminderDecision =
  | {
      shouldSend: true;
      scenarioKey: ReminderScenarioKey;
      scenarioSlot: ReminderScenarioSlot;
      title: string;
      body: string;
      deeplink: string;
    }
  | {
      shouldSend: false;
      reason: string;
    };

export type ScheduledPushReminderSummary = {
  runId: string | null;
  dryRun: boolean;
  scannedProfiles: number;
  eligibleProfiles: number;
  attemptedProfiles: number;
  sentProfiles: number;
  failedProfiles: number;
  targetTokens: number;
  sentTokens: number;
  failedTokens: number;
  disabledTokens: number;
  skipped: Record<string, number>;
  scenarios: Record<ReminderScenarioKey, number>;
};

export type RunScheduledPushRemindersInput = {
  sql: SqlClient;
  policy: EngagementPolicyConfig;
  sender: FirebaseCloudMessagingSender;
  now?: Date;
  dryRun?: boolean;
  limit?: number;
};

export const runScheduledPushReminders = async ({
  sql,
  policy,
  sender,
  now = new Date(),
  dryRun = false,
  limit = 500,
}: RunScheduledPushRemindersInput): Promise<ScheduledPushReminderSummary> => {
  const summary = emptySummary(dryRun);

  if (!policy.notifications.enabled) {
    bump(summary.skipped, "notifications_disabled");
    return summary;
  }

  await cleanupOldReminderHistory(sql);
  const runId = await createReminderRun(sql, dryRun);
  summary.runId = runId;

  try {
    const candidates = await listReminderCandidates(sql, Math.max(1, Math.min(limit, 5000)));
    for (const row of candidates) {
      const candidate = normalizeCandidate(row, now);
      summary.scannedProfiles += 1;

      const decision = selectDueReminder(policy, candidate);
      if (!decision.shouldSend) {
        bump(summary.skipped, decision.reason);
        continue;
      }

      summary.eligibleProfiles += 1;
      summary.scenarios[decision.scenarioKey] += 1;
      if (dryRun) continue;

      const deliveryId = await reserveReminderDelivery(sql, {
        runId,
        candidate,
        decision,
      });
      if (!deliveryId) {
        bump(summary.skipped, "already_reserved");
        continue;
      }

      summary.attemptedProfiles += 1;
      const delivery = await sendReminderToCandidate(sql, sender, candidate, decision);
      summary.targetTokens += delivery.attempted;
      summary.sentTokens += delivery.sent;
      summary.failedTokens += delivery.failed;
      summary.disabledTokens += delivery.disabledTokens;
      if (delivery.sent > 0) {
        summary.sentProfiles += 1;
      } else {
        summary.failedProfiles += 1;
      }

      await updateReminderDelivery(sql, deliveryId, {
        status: delivery.sent > 0 ? "sent" : "failed",
        targetTokenCount: delivery.attempted,
        sentCount: delivery.sent,
        failedCount: delivery.failed,
        failures: delivery.failures,
      });
    }

    await finishReminderRun(sql, runId, "completed", summary);
    return summary;
  } catch (error) {
    await finishReminderRun(sql, runId, "failed", summary, String(error));
    throw error;
  }
};

export const selectDueReminder = (
  policy: EngagementPolicyConfig,
  candidate: ReminderCandidate,
): ReminderDecision => {
  const notificationPolicy = policy.notifications;
  if (!notificationPolicy.enabled) return { shouldSend: false, reason: "notifications_disabled" };
  if (candidate.tokens.length === 0) return { shouldSend: false, reason: "no_tokens" };
  if (notificationPolicy.dailyCap <= 0) return { shouldSend: false, reason: "daily_cap_zero" };
  if (candidate.sentTodayCount >= notificationPolicy.dailyCap) {
    return { shouldSend: false, reason: "daily_cap_reached" };
  }
  if (
    isWithinTimeWindow(
      candidate.localTimeMinutes,
      notificationPolicy.quietHours.start,
      notificationPolicy.quietHours.end,
    )
  ) {
    return { shouldSend: false, reason: "quiet_hours" };
  }

  for (const scenarioKey of reminderScenarioKeys) {
    const scenario = notificationPolicy.scenarios[scenarioKey];
    if (!scenario.enabled) continue;
    const slotDecision = selectScenarioSlot(scenarioKey, scenario, candidate);
    if (slotDecision.reason === "already_sent") {
      return { shouldSend: false, reason: "already_sent" };
    }
    if (slotDecision.reason !== "due") continue;
    if (scenario.requiresTarget && !candidate.hasTarget) {
      return { shouldSend: false, reason: "target_required" };
    }
    if (
      scenario.onlyIfTargetNotReached &&
      candidate.dailyCalorieTarget !== null &&
      candidate.todayCalories >= candidate.dailyCalorieTarget
    ) {
      return { shouldSend: false, reason: "target_reached" };
    }
    if (scenarioKey === "targetSetup") {
      if (candidate.hasTarget) return { shouldSend: false, reason: "target_already_set" };
    } else if (candidate.loggedMealTypes.has(scenarioKey)) {
      return { shouldSend: false, reason: "meal_already_logged" };
    }

    return {
      shouldSend: true,
      scenarioKey,
      scenarioSlot: slotDecision.slot,
      title: scenario.title,
      body: scenario.body,
      deeplink: scenarioKey === "targetSetup" ? "logmyplate://target" : "logmyplate://",
    };
  }

  return { shouldSend: false, reason: "no_due_scenario" };
};

export const localReminderClock = (now: Date, timezone: string) => {
  const safeTimezone = normalizeTimezone(timezone);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour ?? 0);
  const minute = Number(parts.minute ?? 0);
  return {
    timezone: safeTimezone,
    localDate: `${parts.year}-${parts.month}-${parts.day}`,
    localTimeMinutes: hour * 60 + minute,
  };
};

export const isWithinTimeWindow = (
  localMinutes: number,
  startTime: string,
  endTime: string,
): boolean => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === end) return true;
  if (start < end) return localMinutes >= start && localMinutes <= end;
  return localMinutes >= start || localMinutes <= end;
};

type SlotSelection =
  | { reason: "due"; slot: ReminderScenarioSlot }
  | { reason: "not_due" | "already_sent" };

const selectScenarioSlot = (
  scenarioKey: ReminderScenarioKey,
  scenario: EngagementPolicyConfig["notifications"]["scenarios"][ReminderScenarioKey],
  candidate: ReminderCandidate,
): SlotSelection => {
  const primaryDue = isWithinTimeWindow(
    candidate.localTimeMinutes,
    scenario.windowStart,
    scenario.windowEnd,
  );
  if (scenarioKey !== "targetSetup") {
    if (!primaryDue) return { reason: "not_due" };
    return candidate.sentScenarioKeys.has(scenarioSendKey(scenarioKey, "primary"))
      ? { reason: "already_sent" }
      : { reason: "due", slot: "primary" };
  }

  if (primaryDue) {
    return candidate.sentScenarioKeys.has(scenarioSendKey(scenarioKey, "primary"))
      ? { reason: "already_sent" }
      : { reason: "due", slot: "primary" };
  }

  if (
    scenario.secondWindowStart &&
    scenario.secondWindowEnd &&
    isWithinTimeWindow(
      candidate.localTimeMinutes,
      scenario.secondWindowStart,
      scenario.secondWindowEnd,
    )
  ) {
    return candidate.sentScenarioKeys.has(scenarioSendKey(scenarioKey, "secondary"))
      ? { reason: "already_sent" }
      : { reason: "due", slot: "secondary" };
  }

  return { reason: "not_due" };
};

const scenarioSendKey = (scenarioKey: ReminderScenarioKey, slot: ReminderScenarioSlot): string =>
  `${scenarioKey}:${slot}`;

const emptySummary = (dryRun: boolean): ScheduledPushReminderSummary => ({
  runId: null,
  dryRun,
  scannedProfiles: 0,
  eligibleProfiles: 0,
  attemptedProfiles: 0,
  sentProfiles: 0,
  failedProfiles: 0,
  targetTokens: 0,
  sentTokens: 0,
  failedTokens: 0,
  disabledTokens: 0,
  skipped: {},
  scenarios: {
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0,
    targetSetup: 0,
  },
});

const createReminderRun = async (sql: SqlClient, dryRun: boolean): Promise<string> => {
  const [row] = await sql<ReminderRunRow[]>`
    insert into push_reminder_runs (dry_run)
    values (${dryRun})
    returning id::text
  `;
  return row.id;
};

const finishReminderRun = async (
  sql: SqlClient,
  runId: string,
  status: "completed" | "failed",
  summary: ScheduledPushReminderSummary,
  error?: string,
) => {
  await sql`
    update push_reminder_runs
    set
      status = ${status},
      finished_at = now(),
      summary = ${sql.json(summary)},
      error = ${error ?? null}
    where id = ${runId}
  `;
};

const cleanupOldReminderHistory = async (sql: SqlClient): Promise<void> => {
  await sql`
    delete from push_reminder_deliveries
    where created_at < now() - (${reminderHistoryRetentionDays} * interval '1 day')
  `;
  await sql`
    delete from push_reminder_runs
    where started_at < now() - (${reminderHistoryRetentionDays} * interval '1 day')
  `;
};

const listReminderCandidates = async (
  sql: SqlClient,
  limit: number,
): Promise<ReminderCandidateRow[]> =>
  sql<ReminderCandidateRow[]>`
    select
      profiles.id::text as profile_id,
      coalesce(
        (array_agg(nullif(push_notification_tokens.timezone, '') order by push_notification_tokens.last_seen_at desc))[1],
        nullif(profiles.timezone, ''),
        'Asia/Kolkata'
      ) as timezone,
      (profile_health_targets.profile_id is not null) as has_target,
      profile_health_targets.daily_calorie_target,
      jsonb_agg(
        jsonb_build_object(
          'id', push_notification_tokens.id::text,
          'token', push_notification_tokens.token,
          'tokenHash', push_notification_tokens.token_hash
        )
        order by push_notification_tokens.last_seen_at desc
      ) as tokens,
      coalesce(meal_rollups.meals, '[]'::jsonb) as meals,
      coalesce(sent_rollups.sent_reminders, '[]'::jsonb) as sent_reminders
    from profiles
    inner join push_notification_tokens
      on push_notification_tokens.profile_id = profiles.id
      and push_notification_tokens.enabled = true
      and push_notification_tokens.permission_status in ('authorized', 'provisional')
    left join profile_health_targets
      on profile_health_targets.profile_id = profiles.id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'localDate', meal_summary.local_date::text,
          'mealType', meal_summary.meal_type,
          'calories', meal_summary.calories
        )
      ) as meals
      from (
        select
          meals.local_date,
          meals.meal_type::text,
          coalesce(sum(nutrition_results.calories), 0)::float8 as calories
        from meals
        left join meal_items
          on meal_items.meal_id = meals.id
        left join nutrition_results
          on nutrition_results.meal_item_id = meal_items.id
        where meals.profile_id = profiles.id
          and meals.local_date between current_date - 1 and current_date + 1
        group by meals.local_date, meals.meal_type
      ) meal_summary
    ) meal_rollups on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'localDate', push_reminder_deliveries.local_date::text,
          'scenarioKey', push_reminder_deliveries.scenario_key,
          'scenarioSlot', push_reminder_deliveries.scenario_slot
        )
      ) as sent_reminders
      from push_reminder_deliveries
      where push_reminder_deliveries.profile_id = profiles.id
        and push_reminder_deliveries.status = 'sent'
        and push_reminder_deliveries.local_date between current_date - 1 and current_date + 1
    ) sent_rollups on true
    where profiles.deactivated_at is null
    group by
      profiles.id,
      profiles.timezone,
      profile_health_targets.profile_id,
      profile_health_targets.daily_calorie_target,
      meal_rollups.meals,
      sent_rollups.sent_reminders
    order by max(push_notification_tokens.last_seen_at) desc
    limit ${limit}
  `;

const normalizeCandidate = (row: ReminderCandidateRow, now: Date): ReminderCandidate => {
  const clock = localReminderClock(now, row.timezone ?? "Asia/Kolkata");
  const meals = parseJsonArray<ReminderMealSummary>(row.meals);
  const sentReminders = parseJsonArray<SentReminderSummary>(row.sent_reminders);
  const todaysMeals = meals.filter((meal) => meal.localDate === clock.localDate);
  const todaysSentReminders = sentReminders.filter(
    (reminder) => reminder.localDate === clock.localDate,
  );
  return {
    profileId: row.profile_id,
    timezone: clock.timezone,
    localDate: clock.localDate,
    localTimeMinutes: clock.localTimeMinutes,
    hasTarget: row.has_target,
    dailyCalorieTarget: row.daily_calorie_target === null ? null : Number(row.daily_calorie_target),
    todayCalories: todaysMeals.reduce((sum, meal) => sum + Number(meal.calories ?? 0), 0),
    loggedMealTypes: new Set(todaysMeals.map((meal) => meal.mealType)),
    sentScenarioKeys: new Set(
      todaysSentReminders.map((reminder) =>
        scenarioSendKey(reminder.scenarioKey, reminder.scenarioSlot ?? "primary"),
      ),
    ),
    sentTodayCount: todaysSentReminders.length,
    tokens: parseTokens(row.tokens).slice(0, 3),
  };
};

const reserveReminderDelivery = async (
  sql: SqlClient,
  input: {
    runId: string;
    candidate: ReminderCandidate;
    decision: Extract<ReminderDecision, { shouldSend: true }>;
  },
): Promise<string | null> => {
  const [row] = await sql<ReminderDeliveryRow[]>`
    insert into push_reminder_deliveries (
      run_id,
      profile_id,
      scenario_key,
      scenario_slot,
      local_date,
      timezone,
      title,
      body,
      status
    )
    values (
      ${input.runId},
      ${input.candidate.profileId},
      ${input.decision.scenarioKey},
      ${input.decision.scenarioSlot},
      ${input.candidate.localDate},
      ${input.candidate.timezone},
      ${input.decision.title},
      ${input.decision.body},
      'pending'
    )
    on conflict do nothing
    returning id::text
  `;
  return row?.id ?? null;
};

type PushReminderDeliveryResult = {
  attempted: number;
  sent: number;
  failed: number;
  disabledTokens: number;
  failures: Record<string, number>;
};

const sendReminderToCandidate = async (
  sql: SqlClient,
  sender: FirebaseCloudMessagingSender,
  candidate: ReminderCandidate,
  decision: Extract<ReminderDecision, { shouldSend: true }>,
): Promise<PushReminderDeliveryResult> => {
  let sent = 0;
  let failed = 0;
  const failures: Record<string, number> = {};
  const disabledHashes: string[] = [];

  for (const target of candidate.tokens) {
    let result: PushNotificationSendResult;
    try {
      result = await sender.send({
        token: target.token,
        title: decision.title,
        body: decision.body,
        data: {
          source: "scheduled_reminder",
          scenario: decision.scenarioKey,
          scenarioSlot: decision.scenarioSlot,
          localDate: candidate.localDate,
          deeplink: decision.deeplink,
        },
      });
    } catch {
      failed += 1;
      failures.send_exception = (failures.send_exception ?? 0) + 1;
      continue;
    }

    if (result.success) {
      sent += 1;
      continue;
    }

    failed += 1;
    const key = pushNotificationFailureKey(result);
    failures[key] = (failures[key] ?? 0) + 1;
    if (shouldDisableToken(result)) {
      disabledHashes.push(target.tokenHash);
    }
  }

  for (const tokenHash of disabledHashes) {
    await sql`
      update push_notification_tokens
      set
        enabled = false,
        disabled_at = now(),
        updated_at = now()
      where token_hash = ${tokenHash}
    `;
  }

  return {
    attempted: candidate.tokens.length,
    sent,
    failed,
    disabledTokens: disabledHashes.length,
    failures,
  };
};

const updateReminderDelivery = async (
  sql: SqlClient,
  deliveryId: string,
  input: {
    status: "sent" | "failed";
    targetTokenCount: number;
    sentCount: number;
    failedCount: number;
    failures: Record<string, number>;
  },
) => {
  await sql`
    update push_reminder_deliveries
    set
      status = ${input.status},
      target_token_count = ${input.targetTokenCount},
      sent_count = ${input.sentCount},
      failed_count = ${input.failedCount},
      failures = ${sql.json(input.failures)}
    where id = ${deliveryId}
  `;
};

const parseTokens = (value: unknown): ReminderToken[] =>
  parseJsonArray<Partial<ReminderToken>>(value).flatMap((token) => {
    if (!token.id || !token.token || !token.tokenHash) return [];
    return [{ id: token.id, token: token.token, tokenHash: token.tokenHash }];
  });

const parseJsonArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeTimezone = (value: string): string => {
  const candidate = value.trim() || "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "Asia/Kolkata";
  }
};

const timeToMinutes = (value: string): number => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const bump = (bucket: Record<string, number>, key: string): void => {
  bucket[key] = (bucket[key] ?? 0) + 1;
};

const shouldDisableToken = (result: PushNotificationSendResult): boolean =>
  result.status === 404 || result.errorCode === "NOT_FOUND" || result.errorCode === "UNREGISTERED";
