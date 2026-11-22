import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const env = import.meta.env;
const options = {
  apiKey: env.VITE_FIREBASE_API_KEY?.trim(),
  projectId: env.VITE_FIREBASE_PROJECT_ID?.trim(),
  appId: env.VITE_FIREBASE_APP_ID?.trim(),
};
const siteKey = env.VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim() ?? '';

export const liveJudgeConfigured = env.VITE_ENABLE_LIVE_JUDGE === 'true'
  && /^AIza[A-Za-z0-9_-]{35}$/.test(options.apiKey ?? '')
  && /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(options.projectId ?? '')
  && /^1:\d+:web:[0-9a-f]+$/i.test(options.appId ?? '')
  && /^[A-Za-z0-9_-]{20,}$/.test(siteKey);

let context: { app: ReturnType<typeof initializeApp>; appCheck: ReturnType<typeof initializeAppCheck> } | undefined;

export function getLiveFirebase() {
  if (!liveJudgeConfigured || typeof window === 'undefined') throw new Error('LIVE_JUDGE_UNAVAILABLE');
  if (!context) {
    const app = initializeApp(options, 'escrowhealth-live-judge');
    const appCheck = initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey) });
    context = { app, appCheck };
  }
  return context;
}
