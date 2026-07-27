const FIRST_LAUNCH_KEY = "menashe-first-launch";
const TRIAL_DAYS = 30;

export interface TrialStatus {
  isInTrial: boolean;
  daysLeft: number;
  trialExpired: boolean;
  firstLaunch: Date;
}

export function useTrialStatus(): TrialStatus {
  let raw: string | null = null;
  try { raw = localStorage.getItem(FIRST_LAUNCH_KEY); } catch {}
  if (!raw) {
    raw = new Date().toISOString();
    try { localStorage.setItem(FIRST_LAUNCH_KEY, raw); } catch {}
  }
  const firstLaunch = new Date(raw);
  const msElapsed = Date.now() - firstLaunch.getTime();
  const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed);
  const isInTrial = daysLeft > 0;
  const trialExpired = !isInTrial;
  return { isInTrial, daysLeft, trialExpired, firstLaunch };
}
