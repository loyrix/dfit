import { describe, expect, it } from "vitest";
import {
  defaultAppUpdatePolicyConfig,
  resolveAppUpdatePolicy,
  type AppUpdatePolicyConfig,
} from "./app-update-policy.js";

describe("app update policy", () => {
  it("does not prompt when policy is disabled", () => {
    const policy = resolveAppUpdatePolicy(defaultAppUpdatePolicyConfig(), {
      platform: "ios",
      version: "1.0.0",
      buildNumber: 1,
    });

    expect(policy).toMatchObject({ status: "current", platform: "ios", currentBuild: 1 });
  });

  it("returns optional when the build is behind latest but still supported", () => {
    const config = enabledPolicy({
      latestBuild: 14,
      minSupportedBuild: 10,
    });

    const policy = resolveAppUpdatePolicy(config, {
      platform: "ios",
      version: "1.0.0",
      buildNumber: 12,
    });

    expect(policy).toMatchObject({
      status: "optional",
      currentBuild: 12,
      latestBuild: 14,
      minSupportedBuild: 10,
      title: "Update available",
    });
  });

  it("returns mandatory when the build is below the supported floor", () => {
    const config = enabledPolicy({
      latestBuild: 14,
      minSupportedBuild: 13,
    });

    const policy = resolveAppUpdatePolicy(config, {
      platform: "android",
      version: "1.0.0",
      buildNumber: 12,
    });

    expect(policy).toMatchObject({
      status: "mandatory",
      platform: "android",
      currentBuild: 12,
      latestBuild: 14,
      minSupportedBuild: 13,
      title: "Update required",
    });
  });

  it("does not block clients that have not started sending build metadata", () => {
    const config = enabledPolicy({
      latestBuild: 14,
      minSupportedBuild: 13,
    });

    expect(resolveAppUpdatePolicy(config, { platform: "ios" }).status).toBe("current");
    expect(resolveAppUpdatePolicy(config, { buildNumber: 1 }).status).toBe("current");
  });
});

const enabledPolicy = (values: Partial<AppUpdatePolicyConfig["ios"]>): AppUpdatePolicyConfig => {
  const defaults = defaultAppUpdatePolicyConfig();
  return {
    ...defaults,
    enabled: true,
    ios: { ...defaults.ios, ...values },
    android: { ...defaults.android, ...values },
  };
};
