import { AdminShell } from "../components/shell";
import { Badge, PageHeader } from "../components/ui";
import { updateEngagementPolicyAction } from "../lib/actions";
import {
  adminGet,
  type EngagementAnalyticsEvents,
  type EngagementNotificationScenario,
  type EngagementPolicy,
} from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

const scenarioLabels = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
  targetSetup: "Target setup",
} as const;

type ScenarioKey = keyof typeof scenarioLabels;

const analyticsEventLabels: Record<keyof EngagementAnalyticsEvents, string> = {
  appOpen: "App open",
  bootstrapLoaded: "Bootstrap loaded",
  tabSelected: "Tab selected",
  scanStarted: "Scan started",
  scanAnalysisSucceeded: "Scan analysis succeeded",
  scanAnalysisFailed: "Scan analysis failed",
  scanConfirmed: "Scan confirmed",
  manualMealSaved: "Manual meal saved",
  mealUpdated: "Meal updated",
  mealDeleted: "Meal deleted",
  rewardedAdStarted: "Rewarded ad started",
  rewardedAdEarned: "Rewarded ad earned",
  rewardedAdFailed: "Rewarded ad failed",
  accountGateShown: "Account gate shown",
  accountLinked: "Account linked",
  healthTargetSaved: "Health target saved",
};

export default async function GrowthControlsPage() {
  const { policy } = await adminGet<{ policy: EngagementPolicy }>("/admin/engagement-policy");

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Growth"
        title="Growth Controls"
        description="Prepare review prompts, interstitial ads, local notifications, and streak policies from backoffice. Phase 1 only stores configuration; mobile behavior remains inactive until later app support consumes these settings."
        action={
          <div className="inline-controls">
            <Badge tone={anyEnabled(policy) ? "green" : "red"}>
              {anyEnabled(policy) ? "Some controls enabled" : "All growth controls disabled"}
            </Badge>
          </div>
        }
      />

      <form action={updateEngagementPolicyAction} className="grid gap-4">
        <input
          name="idempotencyKey"
          type="hidden"
          value={createMutationKey("engagement-policy:update")}
        />

        <section className="grid two-col">
          <AnalyticsPanel policy={policy} />
          <ReviewPromptPanel policy={policy} />
        </section>

        <section className="grid two-col">
          <InterstitialAdsPanel policy={policy} />
          <StreaksPanel policy={policy} />
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2 className="text-xl font-bold">Local notifications</h2>
              <p className="muted mt-1 text-sm">
                Message timing and copy for a future local reminder scheduler.
              </p>
            </div>
            <Badge tone={policy.notifications.enabled ? "green" : "red"}>
              {policy.notifications.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="form-grid mt-4">
            <label className="inline-controls">
              <input
                name="notifications.enabled"
                type="checkbox"
                defaultChecked={policy.notifications.enabled}
              />
              Enable notification policy
            </label>
            <label>
              <span className="font-semibold">Daily notification cap</span>
              <input
                className="input mt-2"
                name="notifications.dailyCap"
                type="number"
                min="0"
                max="10"
                step="1"
                defaultValue={policy.notifications.dailyCap}
                required
              />
            </label>
            <div className="grid two-col">
              <label>
                <span className="font-semibold">Quiet hours start</span>
                <input
                  className="input mt-2"
                  name="notifications.quietHours.start"
                  type="time"
                  defaultValue={policy.notifications.quietHours.start}
                  required
                />
              </label>
              <label>
                <span className="font-semibold">Quiet hours end</span>
                <input
                  className="input mt-2"
                  name="notifications.quietHours.end"
                  type="time"
                  defaultValue={policy.notifications.quietHours.end}
                  required
                />
              </label>
            </div>
          </div>

          <div className="table-wrap mt-4">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Window</th>
                  <th>Message</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(scenarioLabels) as ScenarioKey[]).map((key) => (
                  <NotificationScenarioRow
                    key={key}
                    scenarioKey={key}
                    scenario={policy.notifications.scenarios[key]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <label className="block">
            <span className="font-semibold">Reason</span>
            <input
              className="input mt-2"
              name="reason"
              placeholder="Why this engagement policy is changing"
              minLength={8}
              maxLength={500}
              required
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button className="button" type="submit">
              Save growth controls
            </button>
          </div>
        </section>
      </form>
    </AdminShell>
  );
}

function AnalyticsPanel({ policy }: { policy: EngagementPolicy }) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2 className="text-xl font-bold">Firebase Analytics</h2>
          <p className="muted mt-1 text-sm">
            Remote event gates for mobile measurement. Requires Firebase dart defines in app builds.
          </p>
        </div>
        <Badge
          tone={policy.analytics.enabled && policy.analytics.firebaseEnabled ? "green" : "red"}
        >
          {policy.analytics.enabled && policy.analytics.firebaseEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <div className="form-grid mt-4">
        <label className="inline-controls">
          <input
            name="analytics.enabled"
            type="checkbox"
            defaultChecked={policy.analytics.enabled}
          />
          Enable analytics policy
        </label>
        <label className="inline-controls">
          <input
            name="analytics.firebaseEnabled"
            type="checkbox"
            defaultChecked={policy.analytics.firebaseEnabled}
          />
          Send to Firebase
        </label>
        <label className="inline-controls">
          <input
            name="analytics.debugLogging"
            type="checkbox"
            defaultChecked={policy.analytics.debugLogging}
          />
          Debug log events
        </label>
        <NumberField
          label="Sample rate percent"
          name="analytics.sampleRatePercent"
          value={policy.analytics.sampleRatePercent}
          min={0}
          max={100}
        />
      </div>

      <div className="table-wrap mt-4">
        <table className="table table-compact">
          <thead>
            <tr>
              <th>Event</th>
              <th>Track</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(analyticsEventLabels) as Array<keyof EngagementAnalyticsEvents>).map(
              (key) => (
                <tr key={key}>
                  <td>{analyticsEventLabels[key]}</td>
                  <td>
                    <input
                      name={`analytics.events.${key}`}
                      type="checkbox"
                      defaultChecked={policy.analytics.events[key]}
                    />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewPromptPanel({ policy }: { policy: EngagementPolicy }) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2 className="text-xl font-bold">Review prompt</h2>
          <p className="muted mt-1 text-sm">Native store review eligibility and copy.</p>
        </div>
        <Badge tone={policy.reviewPrompt.enabled ? "green" : "red"}>
          {policy.reviewPrompt.enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <div className="form-grid mt-4">
        <label className="inline-controls">
          <input
            name="reviewPrompt.enabled"
            type="checkbox"
            defaultChecked={policy.reviewPrompt.enabled}
          />
          Enable review prompt
        </label>
        <label className="inline-controls">
          <input
            name="reviewPrompt.oncePerAppVersion"
            type="checkbox"
            defaultChecked={policy.reviewPrompt.oncePerAppVersion}
          />
          Once per app version
        </label>
        <div className="grid two-col">
          <NumberField
            label="Min confirmed scans"
            name="reviewPrompt.minConfirmedScans"
            value={policy.reviewPrompt.minConfirmedScans}
            min={0}
            max={1000}
          />
          <NumberField
            label="Min active days"
            name="reviewPrompt.minActiveDays"
            value={policy.reviewPrompt.minActiveDays}
            min={0}
            max={365}
          />
        </div>
        <NumberField
          label="Cooldown days"
          name="reviewPrompt.cooldownDays"
          value={policy.reviewPrompt.cooldownDays}
          min={1}
          max={365}
        />
        <TextField
          label="iOS store URL"
          name="reviewPrompt.storeUrls.ios"
          value={policy.reviewPrompt.storeUrls.ios ?? ""}
          maxLength={500}
        />
        <TextField
          label="Android store URL"
          name="reviewPrompt.storeUrls.android"
          value={policy.reviewPrompt.storeUrls.android ?? ""}
          maxLength={500}
        />
        <TextField
          label="Prompt title"
          name="reviewPrompt.copy.title"
          value={policy.reviewPrompt.copy.title}
          minLength={3}
          maxLength={120}
          required
        />
        <TextareaField
          label="Prompt body"
          name="reviewPrompt.copy.body"
          value={policy.reviewPrompt.copy.body}
          minLength={3}
          maxLength={500}
        />
        <div className="grid two-col">
          <TextField
            label="Positive label"
            name="reviewPrompt.copy.positiveLabel"
            value={policy.reviewPrompt.copy.positiveLabel}
            minLength={1}
            maxLength={80}
            required
          />
          <TextField
            label="Negative label"
            name="reviewPrompt.copy.negativeLabel"
            value={policy.reviewPrompt.copy.negativeLabel}
            minLength={1}
            maxLength={80}
            required
          />
        </div>
      </div>
    </div>
  );
}

function InterstitialAdsPanel({ policy }: { policy: EngagementPolicy }) {
  return (
    <div className="panel">
      <div className="section-head">
        <div>
          <h2 className="text-xl font-bold">Interstitial ads</h2>
          <p className="muted mt-1 text-sm">Post-confirm ad caps and platform ad units.</p>
        </div>
        <Badge tone={policy.interstitialAds.enabled ? "green" : "red"}>
          {policy.interstitialAds.enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <div className="form-grid mt-4">
        <label className="inline-controls">
          <input
            name="interstitialAds.enabled"
            type="checkbox"
            defaultChecked={policy.interstitialAds.enabled}
          />
          Enable interstitial ads
        </label>
        <label className="inline-controls">
          <input
            name="interstitialAds.freeUsersOnly"
            type="checkbox"
            defaultChecked={policy.interstitialAds.freeUsersOnly}
          />
          Free users only
        </label>
        <label className="inline-controls">
          <input
            name="interstitialAds.premiumExcluded"
            type="checkbox"
            defaultChecked={policy.interstitialAds.premiumExcluded}
          />
          Exclude premium users
        </label>
        <div className="grid two-col">
          <NumberField
            label="First ad after scans"
            name="interstitialAds.minConfirmedScansBeforeFirstAd"
            value={policy.interstitialAds.minConfirmedScansBeforeFirstAd}
            min={0}
            max={1000}
          />
          <NumberField
            label="Scans between ads"
            name="interstitialAds.scansBetweenAds"
            value={policy.interstitialAds.scansBetweenAds}
            min={1}
            max={1000}
          />
        </div>
        <div className="grid two-col">
          <NumberField
            label="Cooldown minutes"
            name="interstitialAds.cooldownMinutes"
            value={policy.interstitialAds.cooldownMinutes}
            min={0}
            max={1440}
          />
          <NumberField
            label="Daily cap"
            name="interstitialAds.dailyCap"
            value={policy.interstitialAds.dailyCap}
            min={0}
            max={100}
          />
        </div>
        <TextField
          label="iOS ad unit id"
          name="interstitialAds.adUnitIds.ios"
          value={policy.interstitialAds.adUnitIds.ios ?? ""}
          maxLength={160}
        />
        <TextField
          label="Android ad unit id"
          name="interstitialAds.adUnitIds.android"
          value={policy.interstitialAds.adUnitIds.android ?? ""}
          maxLength={160}
        />
      </div>
    </div>
  );
}

function NotificationScenarioRow({
  scenarioKey,
  scenario,
}: {
  scenarioKey: ScenarioKey;
  scenario: EngagementNotificationScenario;
}) {
  const prefix = `notifications.scenarios.${scenarioKey}`;

  return (
    <tr>
      <td>
        <div className="font-semibold">{scenarioLabels[scenarioKey]}</div>
        <label className="inline-controls mt-2 text-sm">
          <input name={`${prefix}.enabled`} type="checkbox" defaultChecked={scenario.enabled} />
          Enabled
        </label>
      </td>
      <td>
        <div className="grid gap-2">
          <input
            className="input"
            name={`${prefix}.windowStart`}
            type="time"
            defaultValue={scenario.windowStart}
            required
          />
          <input
            className="input"
            name={`${prefix}.windowEnd`}
            type="time"
            defaultValue={scenario.windowEnd}
            required
          />
        </div>
      </td>
      <td>
        <div className="form-grid">
          <input
            className="input"
            name={`${prefix}.title`}
            defaultValue={scenario.title}
            minLength={3}
            maxLength={120}
            required
          />
          <textarea
            className="textarea"
            name={`${prefix}.body`}
            defaultValue={scenario.body}
            minLength={3}
            maxLength={500}
            required
          />
        </div>
      </td>
      <td>
        <label className="inline-controls text-sm">
          <input
            name={`${prefix}.requiresTarget`}
            type="checkbox"
            defaultChecked={scenario.requiresTarget}
          />
          Requires target
        </label>
        <label className="inline-controls mt-2 text-sm">
          <input
            name={`${prefix}.onlyIfTargetNotReached`}
            type="checkbox"
            defaultChecked={scenario.onlyIfTargetNotReached}
          />
          Target not reached
        </label>
      </td>
    </tr>
  );
}

function StreaksPanel({ policy }: { policy: EngagementPolicy }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2 className="text-xl font-bold">Streaks</h2>
          <p className="muted mt-1 text-sm">
            Milestones and optional scan rewards for a future streak system.
          </p>
        </div>
        <Badge tone={policy.streaks.enabled ? "green" : "red"}>
          {policy.streaks.enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <div className="form-grid mt-4">
        <label className="inline-controls">
          <input name="streaks.enabled" type="checkbox" defaultChecked={policy.streaks.enabled} />
          Enable streak celebration policy
        </label>
        <label className="inline-controls">
          <input
            name="streaks.scanRewards.enabled"
            type="checkbox"
            defaultChecked={policy.streaks.scanRewards.enabled}
          />
          Enable scan rewards
        </label>
        <input
          name="streaks.milestoneCount"
          type="hidden"
          value={policy.streaks.milestones.length}
        />
      </div>

      <div className="table-wrap mt-4">
        <table className="table table-compact">
          <thead>
            <tr>
              <th>Days</th>
              <th>Celebration copy</th>
              <th>Scan reward</th>
            </tr>
          </thead>
          <tbody>
            {policy.streaks.milestones.map((milestone, index) => (
              <tr key={`${milestone.days}-${index}`}>
                <td>
                  <input
                    className="input"
                    name={`streaks.milestones.${index}.days`}
                    type="number"
                    min="1"
                    max="3650"
                    step="1"
                    defaultValue={milestone.days}
                    required
                  />
                </td>
                <td>
                  <div className="form-grid">
                    <input
                      className="input"
                      name={`streaks.milestones.${index}.title`}
                      defaultValue={milestone.title}
                      minLength={3}
                      maxLength={120}
                      required
                    />
                    <textarea
                      className="textarea"
                      name={`streaks.milestones.${index}.body`}
                      defaultValue={milestone.body}
                      minLength={3}
                      maxLength={500}
                      required
                    />
                  </div>
                </td>
                <td>
                  <input
                    className="input"
                    name={`streaks.milestones.${index}.scanRewardAmount`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    defaultValue={milestone.scanRewardAmount}
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NumberField({
  label,
  name,
  value,
  min,
  max,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
}) {
  return (
    <label>
      <span className="font-semibold">{label}</span>
      <input
        className="input mt-2"
        name={name}
        type="number"
        min={min}
        max={max}
        step="1"
        defaultValue={value}
        required
      />
    </label>
  );
}

function TextField({
  label,
  name,
  value,
  minLength,
  maxLength,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  minLength?: number;
  maxLength: number;
  required?: boolean;
}) {
  return (
    <label>
      <span className="font-semibold">{label}</span>
      <input
        className="input mt-2"
        name={name}
        defaultValue={value}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  minLength: number;
  maxLength: number;
}) {
  return (
    <label>
      <span className="font-semibold">{label}</span>
      <textarea
        className="textarea mt-2"
        name={name}
        defaultValue={value}
        minLength={minLength}
        maxLength={maxLength}
        required
      />
    </label>
  );
}

function anyEnabled(policy: EngagementPolicy) {
  return (
    policy.analytics.enabled ||
    policy.analytics.firebaseEnabled ||
    policy.reviewPrompt.enabled ||
    policy.interstitialAds.enabled ||
    policy.notifications.enabled ||
    policy.streaks.enabled ||
    policy.streaks.scanRewards.enabled
  );
}
