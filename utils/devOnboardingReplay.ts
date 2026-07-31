let replayPending = __DEV__;

export function shouldReplayOnboarding() {
  return replayPending;
}

export function consumeOnboardingReplay() {
  replayPending = false;
}

export function resetOnboardingReplay() {
  replayPending = __DEV__;
}
