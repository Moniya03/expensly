import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import type { VoiceExpenseResponse } from '../types';
import { toLocalDateString } from '../utils/date';
import { supabase } from './supabase';

async function extractFunctionError(error: any): Promise<string> {
  let details: string | undefined = error?.details;

  if (!details && error?.context) {
    try {
      details = await error.context.text();
    } catch {
      details = undefined;
    }
  }

  if (details && typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      if (parsed?.error) {
        return parsed.details ? `${parsed.error}: ${parsed.details}` : parsed.error;
      }
    } catch {
      return details;
    }
  }

  if (error?.message) return error.message;
  return 'Unknown error occurred';
}

/**
 * Process voice recording and create expense transaction
 * @param audioBase64 - Base64 encoded audio data
 * @param userId - User ID from auth
 * @returns Response with transaction data or error
 */
export async function processVoiceExpense(
  audioBase64: string,
  userId: string,
): Promise<VoiceExpenseResponse> {
  try {
    console.log('Processing voice expense for user:', userId);

    // Ensure we always send an auth header when invoking the Edge Function
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const headers: Record<string, string> = {};

    if (anonKey) {
      headers.apikey = anonKey;
    }

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else if (anonKey) {
      headers.Authorization = `Bearer ${anonKey}`;
    }

    const { data, error } = await supabase.functions.invoke('process-voice', {
      body: { audioBase64, userId, clientDate: toLocalDateString(new Date()) },
      headers,
    });

    if (error) {
      const parsedError = await extractFunctionError(error);
      console.error('Voice expense edge function error:', {
        status: error?.context?.status,
        error: parsedError,
      });
      return {
        success: false,
        error: parsedError,
      };
    }

    if (!data || typeof data !== 'object' || !('success' in data)) {
      return {
        success: false,
        error: 'Invalid response from voice parser',
      };
    }

    console.log('Voice expense processed successfully:', data);
    return data as VoiceExpenseResponse;
  } catch (error) {
    const parsedError = await extractFunctionError(error);
    console.error('Voice expense error:', parsedError);
    return {
      success: false,
      error: parsedError,
    };
  }
}

/**
 * Convert audio file URI to base64 string
 * @param uri - Local file URI from expo-av recording
 * @returns Base64 encoded audio string
 */
export async function audioUriToBase64(uri: string): Promise<string> {
  try {
    console.log('Converting audio URI to base64:', uri);

    // Use the legacy API for reading files as base64
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });

    console.log('Audio converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Error converting audio to base64:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to convert audio: ${error.message}`
        : 'Failed to convert audio to base64',
    );
  }
}
