import { supabase } from './supabase';
import { Profile } from '../types';

type ProfileUpdateInput = Partial<Pick<Profile, 'name' | 'monthly_budget' | 'onboarding_complete'>>;

const isNoRowsError = (error: { code?: string | null } | null | undefined) => error?.code === 'PGRST116';

const PROFILE_VISIBILITY_TIMEOUT_MS = 4000;
const PROFILE_VISIBILITY_POLL_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a profile without throwing for the expected zero-row case.
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    if (isNoRowsError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data;
};

/**
 * Wait for the trigger-created profile row to become visible.
 */
export const ensureProfile = async (
  userId: string,
  options?: { timeoutMs?: number; pollIntervalMs?: number }
): Promise<Profile | null> => {
  const timeoutMs = options?.timeoutMs ?? PROFILE_VISIBILITY_TIMEOUT_MS;
  const pollIntervalMs = options?.pollIntervalMs ?? PROFILE_VISIBILITY_POLL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const profile = await fetchProfile(userId);

    if (profile) {
      return profile;
    }

    if (Date.now() + pollIntervalMs > deadline) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  return null;
};

/**
 * Update a profile after its trigger-created row becomes visible.
 */
export const saveProfile = async (userId: string, updates: ProfileUpdateInput): Promise<Profile> => {
  const profile = await ensureProfile(userId);

  if (!profile) {
    throw new Error('Your profile is still being set up. Please try again in a moment.');
  }

  const payload: Record<string, unknown> = {};

  if (typeof updates.monthly_budget === 'number') {
    payload.monthly_budget = updates.monthly_budget;
  }

  if (typeof updates.name === 'string') {
    payload.name = updates.name;
  }

  if (typeof updates.onboarding_complete === 'boolean') {
    payload.onboarding_complete = updates.onboarding_complete;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Your profile is still being set up. Please try again in a moment.');
  }

  return data;
};
