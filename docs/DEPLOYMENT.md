# EscrowHealth live deployment

EscrowHealth builds to a static site. Firebase Hosting serves it over HTTPS and uses the security headers in `firebase.json`. The browser reaches Gemini through Firebase AI Logic and App Check. One Hosting site is enough for the Web/Chrome entry.

## Set up the release site

1. Choose a Firebase project and create a **Firebase Hosting** site for the release. Record its actual **Project ID** and **Hosting Site ID**. The signed-in deployer needs Hosting deployment access to that project. Use a different site for the release build so the existing test spike and dashboard URLs remain available. [Firebase Hosting setup](https://firebase.google.com/docs/hosting/quickstart) · [Hosting site IDs](https://firebase.google.com/docs/hosting/default-site)
2. Register a **Web app** in that Firebase project. Enable **Firebase AI Logic** with the **Gemini Developer API** as the provider. EscrowHealth's live Judge Mode uses `gemini-3.5-flash-lite`. [Firebase AI Logic Web setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)
3. In the same Google Cloud project, create a **score-based reCAPTCHA Enterprise Web key** and add the hostname `SITE_ID.web.app`. Add any other hostname that judges will use. Register this key for the Web app in **Firebase Console → App Check → Apps**. Under **App Check → APIs**, verify that **Firebase AI Logic** has baseline protection enforced. The build uses standard App Check tokens. [reCAPTCHA Enterprise setup](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider) · [Firebase AI Logic enforcement](https://firebase.google.com/docs/ai-logic/app-check)
4. With Node.js 24 and npm, open the release checkout. Copy `.env.example` to the ignored `.env.local` file. Fill in the three Web app configuration fields and the reCAPTCHA Enterprise **site key**. The deploy script enables live Judge Mode for its build.

   | Field | Where to find it |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` in the Firebase Web app configuration |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` in the same Web app configuration |
   | `VITE_FIREBASE_APP_ID` | `appId` in the same Web app configuration |
   | `VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY` | The Web site key registered in Firebase App Check |

   Vite embeds these Web client settings in the app. Keep private Gemini keys, service-account credentials, and App Check debug tokens out of source, the deployment environment for this build, and submission notes. [Firebase Web API keys](https://firebase.google.com/docs/projects/api-keys)

## Build and deploy

Run the following from the checkout. Replace `PROJECT_ID` and `SITE_ID` with the actual IDs from step 1.

```sh
npm ci
npm test
npm exec --yes --package=firebase-tools@15.37.0 -- firebase login
npm run deploy:hosting -- --project PROJECT_ID --site SITE_ID --check
npm run deploy:hosting -- --project PROJECT_ID --site SITE_ID
```

`--check` validates the environment and builds without deploying. The deploy command verifies the site belongs to the selected project and publishes the live build to that one Hosting site. It uses a temporary Hosting target, leaving the checkout's Firebase target configuration intact. [Firebase CLI login](https://firebase.google.com/docs/cli#log-in-and-test-cli) · [Hosting targets](https://firebase.google.com/docs/hosting/multisites#step_5_test_locally_preview_changes_and_deploy_to_your_sites)

## Verify the live URL

Open `https://SITE_ID.web.app/` in a fresh Chrome session and run **India · Bill and denied claim → Run local privacy scan → Approve sample analysis → Confirm approval**. Confirm that the result shows **Live Firebase cloud route**, download and open the appeal, then verify the linked `INTENT` and `OUTCOME SUCCESS` in **Privacy Receipts**. Record the release commit and exact URL. Have a second reviewer repeat this on the same build.

## Devpost handoff

- Apply under **Web/Chrome**. The rules require Gemini Nano 4 integration through Firebase AI Logic. The separate feasibility spike proved Nano on-device and cloud fallback. The dashboard in this repository currently has live cloud Judge Mode and a simulated Nano scenario. Include a real Nano workflow in the public, runnable project before claiming the Web/Chrome requirement is satisfied. [Official application requirements](https://firebasehybridaihackathon.devpost.com/rules)
- Provide the public GitHub or GitLab repository, its open-source license, source, assets, and usable build and test instructions. This repository is public and declares Apache-2.0. Its current `LICENSE` contains the short notice, and GitHub reports the license as **Other**. Add the full Apache 2.0 license text and confirm GitHub detects it before submitting. Include the working demo URL and verification steps in the entry. Keep judge access free through the end of judging. [Official submission rules](https://firebasehybridaihackathon.devpost.com/rules)
- Publish the demonstration video publicly on YouTube. Keep it within three minutes and use English narration or English subtitles. In the Devpost description, explain EscrowHealth's value, how Firebase AI Logic is used, what works today, and what the team built during the submission period. Disclose any incorporated prior work as required. Add eligible team members and have the team representative submit the completed entry. [Official submission rules](https://firebasehybridaihackathon.devpost.com/rules)
- Submit by **30 November 2026 at 2:00 p.m. PST**, which is **1 December at 3:30 a.m. IST**. [Competition dates](https://firebasehybridaihackathon.devpost.com/details/dates)
