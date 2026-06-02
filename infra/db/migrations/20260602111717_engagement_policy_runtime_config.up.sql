-- 20260602111717_engagement_policy_runtime_config.up.sql
insert into app_runtime_config (key, value, description, updated_by)
values (
  'engagement_policy',
  '{
    "reviewPrompt": {
      "enabled": false,
      "minConfirmedScans": 3,
      "minActiveDays": 2,
      "cooldownDays": 90,
      "oncePerAppVersion": true,
      "storeUrls": {
        "ios": "https://apps.apple.com/app/id6770872606",
        "android": "https://play.google.com/store/apps/details?id=com.logmyplate.app"
      },
      "copy": {
        "title": "Enjoying LogMyPlate?",
        "body": "A quick review helps more people discover simple meal tracking.",
        "positiveLabel": "Rate LogMyPlate",
        "negativeLabel": "Not now"
      }
    },
    "interstitialAds": {
      "enabled": false,
      "freeUsersOnly": true,
      "premiumExcluded": true,
      "minConfirmedScansBeforeFirstAd": 2,
      "scansBetweenAds": 2,
      "cooldownMinutes": 10,
      "dailyCap": 3,
      "adUnitIds": {
        "ios": null,
        "android": null
      }
    },
    "notifications": {
      "enabled": false,
      "dailyCap": 2,
      "quietHours": {
        "start": "22:00",
        "end": "07:00"
      },
      "scenarios": {
        "breakfast": {
          "enabled": false,
          "windowStart": "08:30",
          "windowEnd": "10:00",
          "title": "Breakfast check-in",
          "body": "A quick breakfast log keeps today on track.",
          "requiresTarget": false,
          "onlyIfTargetNotReached": true
        },
        "lunch": {
          "enabled": false,
          "windowStart": "13:00",
          "windowEnd": "14:30",
          "title": "Lunch reminder",
          "body": "Still no lunch logged. Add it before the day gets busy.",
          "requiresTarget": true,
          "onlyIfTargetNotReached": true
        },
        "snack": {
          "enabled": false,
          "windowStart": "17:00",
          "windowEnd": "18:30",
          "title": "Snack check-in",
          "body": "If you had a snack, log it now while it is fresh.",
          "requiresTarget": true,
          "onlyIfTargetNotReached": true
        },
        "dinner": {
          "enabled": false,
          "windowStart": "20:00",
          "windowEnd": "21:30",
          "title": "Dinner reminder",
          "body": "Dinner not logged yet. Capture it before wrapping up.",
          "requiresTarget": true,
          "onlyIfTargetNotReached": true
        },
        "targetSetup": {
          "enabled": false,
          "windowStart": "18:00",
          "windowEnd": "19:00",
          "title": "Set your calorie target",
          "body": "Set a target once so LogMyPlate can guide your day better.",
          "requiresTarget": false,
          "onlyIfTargetNotReached": false
        }
      }
    },
    "streaks": {
      "enabled": false,
      "milestones": [
        {
          "days": 3,
          "title": "3-day streak",
          "body": "You logged meals for 3 days. Nice rhythm.",
          "scanRewardAmount": 0
        },
        {
          "days": 7,
          "title": "7-day streak",
          "body": "A full week of logging. Your pattern is getting clearer.",
          "scanRewardAmount": 0
        },
        {
          "days": 14,
          "title": "14-day streak",
          "body": "Two steady weeks. This is how awareness becomes a habit.",
          "scanRewardAmount": 0
        },
        {
          "days": 30,
          "title": "30-day streak",
          "body": "A month of consistency. That is real progress.",
          "scanRewardAmount": 0
        }
      ],
      "scanRewards": {
        "enabled": false
      }
    }
  }'::jsonb,
  'Controls review prompts, interstitial ads, local notification scenarios, and streak celebrations for mobile clients.',
  'migration'
)
on conflict (key) do nothing;
