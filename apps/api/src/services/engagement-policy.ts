import {
  defaultEngagementPolicyConfig,
  parseEngagementPolicyConfig,
  type EngagementPolicyConfigContract,
} from "@logmyplate/contracts";
import type { SqlClient } from "../db/client.js";

type RuntimeConfigRow = {
  value: unknown;
};

export const ENGAGEMENT_POLICY_KEY = "engagement_policy";

export type EngagementPolicyConfig = EngagementPolicyConfigContract;

export const defaultEngagementPolicy = (): EngagementPolicyConfig =>
  defaultEngagementPolicyConfig();

export const parseEngagementPolicy = (value: unknown): EngagementPolicyConfig =>
  parseEngagementPolicyConfig(value);

export const loadEngagementPolicy = async (sql?: SqlClient): Promise<EngagementPolicyConfig> => {
  if (!sql) return defaultEngagementPolicy();
  const [row] = await sql<RuntimeConfigRow[]>`
    select value
    from app_runtime_config
    where key = ${ENGAGEMENT_POLICY_KEY}
    limit 1
  `;
  return parseEngagementPolicy(row?.value);
};
