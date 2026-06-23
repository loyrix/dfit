export const WEBSITE_CONTENT_PLACEHOLDER = "{{WEBSITE_CONTENT}}";

export const getDefaultWebsiteReferenceContent = (): string => {
  return `## Website Reference Material

Use the information below to answer user questions about app features, account management, subscriptions, privacy, data deletion, refunds, and troubleshooting. If a user asks about something not covered here, say you don't have that information and suggest checking the website or contacting support.

### App Features
- LogMyPlate is an AI calorie tracker app for iOS and Android. It estimates calories and macros from meal photos.
- The app also supports scanning with Rewarded ads (free scans), manual meal entry, a meal journal, daily/weekly summaries, and the AI Nutritionist chat.
- Users with an account can sync their journal across reinstalls. A local-only mode works without an account.
- Indian food tracking is a primary use case: dal, roti, sabzi, rice, biryani, poha, khichdi, idli, dosa, and mixed plates are handled by the photo AI.
- The AI estimates portions visually. Users can edit food names, portions, and quantities before saving.
- Accuracy depends on photo quality, item visibility, and portion estimation. Estimates are approximate, not clinical measurements.
- Free users get 3 one-time free scans. Additional scans may be available through rewarded ads when supported and available.
- Premium subscribers get up to 300 AI meal scans per month and up to 10 scans per day.

### How To Use The App
- To scan a meal: open the app, tap the camera or photo icon, take or select a photo, optionally add a food note, review the AI analysis, edit items if needed, and save.
- To edit a saved meal: open the meal log, tap the meal entry, and adjust items or quantities.
- To view daily totals and weekly summaries: open the Today or Weekly tabs in the app.
- To chat with the AI Nutritionist: open the chat feature from the app dashboard. Premium subscribers get more daily sessions.

### Account Management
- An account is optional. Creating one with an email address preserves your journal across reinstalls.
- To delete your account: go to Profile > Privacy & legal > Delete account and data. This permanently deletes the account, journal, saved photos, targets, and sign-in access. The action is irreversible.
- Account deletion also removes associated subscription entitlement records and push tokens.
- For data deletion requests when the app is not accessible, email the support address.

### Subscriptions
- Premium is a paid subscription sold through Apple App Store and Google Play.
- Features of Premium include: up to 300 AI meal scans per month, up to 10 scans per day, more AI Nutritionist sessions per day, and priority support.
- Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
- To manage or cancel: open your app store account settings (Apple App Store or Google Play).
- Refunds are handled entirely by the app store you purchased from. LogMyPlate cannot issue refunds directly.
  - Apple App Store refund request: https://support.apple.com/en-in/118428
  - Google Play refund request: https://support.google.com/googleplay/answer/2479637
- If you cancel your subscription, Premium access continues until the end of the current billing period.

### Privacy And Data
- Meal photos are used only for AI analysis and optionally stored in the user's private journal.
- LogMyPlate does not sell user data, meal photos, or health data.
- The app uses Google AdMob for rewarded ads. AdMob may collect device and interaction data. Ad personalization can be managed in device/Google settings.
- Push notifications are optional. Notification tokens are stored for delivery only and not sold or used for ad targeting.
- Subscription data (entitlement status, purchase/expiration dates, product IDs) is processed through RevenueCat for entitlement verification.
- Data retention: meal journal and targets are kept while the account or app installation is active. Technical logs are retained up to 90 days.

### AI Features
- The AI Nutritionist discusses the user's food logs, nutrition data, and eating patterns. It cannot discuss topics outside the user's food data.
- The AI provides estimates and suggestions. It does not diagnose medical conditions, prescribe treatments, or provide clinical advice.
- The AI keeps responses under 150 words unless the user explicitly asks for more detail.

### Troubleshooting And FAQ
- "Rewarded ads not ready": This usually means a VPN, ad blocker, Private DNS (like dns.adguard.com), restricted network, or unstable connection is blocking Google AdMob. Turn off VPN/ad-blocking DNS, switch to mobile data or a different Wi-Fi network, then reopen the app and try again.
- "Calorie estimates inaccurate": Ensure photos are well-lit, show the full plate, and include a short food note for context. Estimates are approximate.
- "Can't sign in": Check your email and password. Use the password reset flow if needed. Ensure you have an internet connection.
- "How do I restore my Premium purchase": Use the "Restore Purchase" option in the app's subscription management area. This works for both Apple and Google purchases.
- "Can I use LogMyPlate outside India": Yes, the app works globally. Indian food support is a primary feature but the app handles global cuisines.
- "Is the app free to use": The app includes 3 free scans. Additional features require watching rewarded ads or purchasing a Premium subscription.

### Health Disclaimer
- AI calorie and macro estimates are approximate. They are not medical measurements.
- If you have medical nutrition needs, diabetes, an eating disorder, kidney disease, or are pregnant or breastfeeding, consult a qualified healthcare professional. Do not rely solely on AI estimates.
- The app is not a medical device and does not provide clinical advice.
- Extreme calorie restriction (below 1200 kcal/day) is not recommended.

### Contact And Support
- Support email: help@logmyplate.com (or the current support email from the website).
- For urgent issues, create a support request via the Support page on the website.`;
};
