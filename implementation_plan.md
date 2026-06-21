# LogMyPlate Mobile UI Fixes — Implementation Plan

Six UI requirements covering profile reorganization, camera screen cleanup, search disabling, AI modal icon fixes, and toast/alert unification. **All changes are end-to-end with real data — no dummies.**

---

## Requirement 1: Profile Section — Reorder & Group

**Reference:** Image 2

### Current Order (profile_screen.dart)

Account Hero → Health Target → Premium → Theme → Privacy & legal (with Delete account) → Support → Log out

### Target Order (per Image 2)

Account Hero → **Health Target** → Premium → Theme → Privacy & legal (**without** Delete account row) → Support → Log out

### Proposed Changes

#### [MODIFY] [profile_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/profile_screen.dart)

**Lines 100–137** — Remove the "Delete account and data" `_LinkRow` + its `_ProfileRowDivider` from the "Privacy & legal" section. This row already exists in the Account Details screen's "Manage Account" section and duplicating it in both places is redundant per the reference images.

The result:

- Privacy & legal keeps: Privacy policy, Legal terms
- Delete account / Deactivate profile remain exclusively in Account Details

**Health Target stays** in its current position (after Account Hero, before Premium). This matches the natural flow and keeps it accessible.

---

## Requirement 2: Account Details Screen — Restructure & Real Data

**Reference:** Image 1

### Current Layout (account_profile_screen.dart)

- Profile (avatar + email + provider label)
- Account section (Status, Provider, Journal)
- Access section (Free scans, Ad unlocks, Premium)
- Account control (Deactivate, Delete)
- Log out button

### Target Layout (per Image 1)

1. **Profile** — Avatar + email + "Email account" label (already correct)
2. **Account and Journal Status** — Status, Provider, Journal (rename section title from "Account" to "Account and Journal Status")
3. **Membership Status** — Current Plan, Subscribed on, Auto Renewal on (NEW section, using real `SubscriptionStatus` data)
4. **Manage Account** — Reset Password, Deactivate profile, Delete account (restructure existing "Account control")
5. **Log out** button

### Data Source: `SubscriptionStatus` Model

From [meal.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/models/meal.dart#L2112-L2194):

| Image 1 field   | Model field                       | Value derivation                                                                  |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Current Plan    | `subscription.active`             | `active ? 'Premium' : 'Free'`                                                     |
| Subscribed on   | `subscription.currentPeriodStart` | Format as `'MMM d, yyyy'` or `'—'` if null                                        |
| Auto Renewal on | `subscription.currentPeriodEnd`   | Format as `'MMM d, yyyy'` or `'—'` if null; show `'None'` if `willRenew == false` |

The `SubscriptionStatus` is already passed to `AccountProfileScreen` as `subscription` (line 1306 of app.dart).

### Proposed Changes

#### [MODIFY] [account_profile_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/account_profile_screen.dart)

**1. Rename "Account" section** (line 93) → `'Account and Journal Status'`

**2. Replace "Access" section** (lines 107-123) with **"Membership Status"** section:

```dart
_ProfileSection(
  title: 'Membership Status',
  children: [
    _ProfileRow(
      label: 'Current Plan',
      value: subscription?.active == true ? 'Premium' : 'Free',
    ),
    _ProfileRow(
      label: 'Subscribed on',
      value: _formatDate(subscription?.currentPeriodStart),
    ),
    _ProfileRow(
      label: 'Auto Renewal on',
      value: _renewalLabel(subscription),
    ),
  ],
),
```

**3. Restructure "Account control"** (lines 125-149) → rename to **"Manage Account"** and add a "Reset Password" row:

```dart
_ProfileSection(
  title: 'Manage Account',
  children: [
    _ProfileActionRow(
      label: 'Reset Password',
      value: '',
      color: colors.textPrimary,
      enabled: !loading,
      onTap: () => _resetPassword(context),
      trailingIcon: Icons.chevron_right_rounded,
    ),
    _ProfileActionRow(
      label: 'Deactivate profile',
      value: 'Pause access',
      color: LogMyPlateColors.accent,
      enabled: !loading,
      onTap: () => _requestLifecycleAction(context, action: _ProfileLifecycleAction.deactivate),
    ),
    _ProfileActionRow(
      label: 'Delete account and data',
      value: 'Permanent',
      color: LogMyPlateColors.destructive,
      enabled: !loading,
      onTap: () => _requestLifecycleAction(context, action: _ProfileLifecycleAction.delete),
    ),
  ],
),
```

**4. Add helper methods:**

```dart
String _formatDate(DateTime? date) {
  if (date == null) return '—';
  final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

String _renewalLabel(SubscriptionStatus? subscription) {
  if (subscription == null || !subscription.active) return '—';
  if (subscription.willRenew == false) return 'None';
  return _formatDate(subscription.currentPeriodEnd);
}
```

> [!NOTE]
> **Reset Password**: Image 1 shows "Reset Password" with a chevron. If the existing auth flow has a password reset method, we'll wire it. If not (e.g. OAuth-only users), we show it only for email auth provider.

**5. Check existing password reset logic:**

From the `AuthController` / API client, check if a `resetPassword` or `requestPasswordReset` method exists. If it does, wire it. If not, we'll add a stub that opens the support link or shows a "coming soon" notice — **but only if the user is on email auth**.

---

## Requirement 3: Remove Circular Rings from Camera Background

**Reference:** Image 3

### Proposed Changes

#### [MODIFY] [camera_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/camera_screen.dart)

**`_EmptyPlatePainter.paint()`** (lines 446–473) — Remove the body of `paint()`, making it a no-op:

```dart
@override
void paint(Canvas canvas, Size size) {
  // Rings removed per design requirement.
}
```

This removes:

- Outer accent circle (`maxRadius`)
- Two inner subtle circles (`maxRadius * 0.72`, `maxRadius * 0.45`)
- Horizontal guide line

**Kept intact:**

- The `Container` at lines 402–413 with `BoxDecoration(shape: BoxShape.circle)` — the restaurant icon highlight bubble

---

## Requirement 4: Disable Search in "Add Manually"

### Proposed Changes

#### [MODIFY] [app.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/app.dart)

**Line 591** — In `_buildScannedReviewScreen`:

```diff
-onFoodSearch: _journalController.searchFoods,
+onFoodSearch: null,
```

**Line 623** — In `_openManualReview`:

```diff
-onFoodSearch: _journalController.searchFoods,
+onFoodSearch: null,
```

The `MealItemEditorSheet` already handles `onFoodSearch == null` gracefully (skips debounced search, hides suggestion strip). **No code removed** — re-enable by restoring these lines later.

---

## Requirement 5: Fix Greyed-Out AI Icons in Dark Theme

**Reference:** Image 4

### Root Cause

Three locations hardcode `LogMyPlateColors.accentDeep` (`#3D2E07`, very dark brown) for icon color. On dark backgrounds, this dark brown is nearly invisible. The fix: use `colors.accentText` which is:

- **Light theme** → `accentWarm` (`#6B5118`, warm brown — visible on light surfaces)
- **Dark theme** → `accent` (golden — visible on dark surfaces)

### Proposed Changes

#### [MODIFY] [app.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/app.dart)

**Line 2739** — `_AiNutritionistPickerSheet` AI sparkle icon:

```diff
-color: LogMyPlateColors.accentDeep,
+color: colors.accentText,
```

(Note: `colors` is already available via `widget.colors` or `context.logmyplate` at line 2703.)

**Line 2770** — `_AiNutritionistPickerSheet` history icon:

```diff
-color: LogMyPlateColors.accentWarm,
+color: colors.accentText,
```

**Line 2889** — `_StartChatConfirmationSheet` AI sparkle icon:

```diff
-color: LogMyPlateColors.accentDeep,
+color: colors.accentText,
```

---

## Requirement 6: Uniform Toasts & Alerts

**Reference:** Image 5

### Problem

7 places use `ScaffoldMessenger.showSnackBar(SnackBar(...))` which renders as the default Material SnackBar — inconsistent with the app's glass-morphism design system. The app already has `LogMyPlateNotice` which is the canonical notification overlay.

### All SnackBar Locations

| File                      | Line | Message                            | Replacement Tone |
| ------------------------- | ---- | ---------------------------------- | ---------------- |
| chat_history_screen.dart  | 102  | "Chats deleted successfully"       | `success`        |
| chat_history_screen.dart  | 112  | "Failed to delete chats"           | `error`          |
| chat_history_screen.dart  | 149  | "Chat deleted successfully"        | `success`        |
| chat_history_screen.dart  | 159  | "Failed to delete chat"            | `error`          |
| camera_screen.dart        | 835  | "Voice input coming soon"          | `info`           |
| health_target_screen.dart | 983  | "Source link copied"               | `info`           |
| app_links.dart            | 56   | copiedMessage (e.g. "Link copied") | `info`           |

### Proposed Changes

#### [MODIFY] [chat_history_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/chat_history_screen.dart)

Replace all 4 `ScaffoldMessenger.showSnackBar` calls with `LogMyPlateNotice.show()`:

```dart
// Line 102 — success:
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.success, title: 'Chats deleted');

// Line 112 — error:
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.error, title: 'Delete failed', message: 'Please try again.');

// Line 149 — success:
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.success, title: 'Chat deleted');

// Line 159 — error:
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.error, title: 'Delete failed', message: 'Please try again.');
```

Add import: `import '../widgets/logmyplate_notice.dart';`

#### [MODIFY] [camera_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/camera_screen.dart)

**Line 835** — `_VoiceHintButton`:

```dart
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.info, title: 'Coming soon', message: 'Voice input will be available in a future update.');
```

Add import: `import '../widgets/logmyplate_notice.dart';`

#### [MODIFY] [health_target_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/health_target_screen.dart)

**Line 983** — `_openHealthSource`:

```dart
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.info, title: 'Source link copied');
```

Add import: `import '../widgets/logmyplate_notice.dart';`

#### [MODIFY] [app_links.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/services/app_links.dart)

**Line 56** — `openLogMyPlateLink`:

```dart
LogMyPlateNotice.show(context, tone: LogMyPlateNoticeTone.info, title: copiedMessage);
```

Add import: `import '../widgets/logmyplate_notice.dart';`

### Delete Confirmation Sheet Redesign

#### [MODIFY] [chat_history_screen.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/chat_history_screen.dart)

Rewrite `_DeleteConfirmationSheet` (lines 512–589) to match the standard sheet pattern used across the app (e.g. `_confirmExit()` in `nutritionist_chat_screen.dart`):

**Changes:**

- Padding: `24,24,24,32` → `18,18,18,16` (standard)
- Layout: centered icon-above-text → **row layout** (icon left, text right)
- Title: `headlineSmall` → `titleMedium`
- Icon container: 64×64 → 42×42
- Spacing: hardcoded `32` → `LogMyPlateSpacing.sectionSpacing`
- Cancel button: bare `TextButton` → `GlassWrapper(child: TextButton(...))`

---

## Verification Plan

### Automated Tests

```bash
pnpm mobile:analyze   # Dart analysis — no new warnings
pnpm mobile:test      # Existing Flutter tests pass
```

### Manual Verification

- **Req 1:** Profile screen → verify order: Hero → Health Target → Premium → Theme → Privacy & legal (no delete row) → Support → Log out
- **Req 2:** Account Details → verify 4 sections with real data from SubscriptionStatus
- **Req 3:** Scan screen (no photo) → no background rings, restaurant icon highlight remains
- **Req 4:** Add manually → type food name → no search suggestions appear
- **Req 5:** Dark theme → AI Nutritionist modal → sparkle + history icons are clearly visible in gold
- **Req 6:** Delete a chat → glass overlay notice (not Material SnackBar). Voice hint on camera → same check. All alerts uniform.
