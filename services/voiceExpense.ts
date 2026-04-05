import { supabase } from './supabase';
import { File } from 'expo-file-system';

export interface VoiceExpenseRequest {
  audioBase64: string;
  userId: string;
}

export interface VoiceExpenseResponse {
  success: boolean;
  transaction?: any;
  transcription?: string;
  error?: string;
}

/**
 * Process voice recording and create expense transaction
 * @param audioBase64 - Base64 encoded audio data
 * @param userId - User ID from auth
 * @returns Response with transaction data or error
 */
export async function processVoiceExpense(
  audioBase64: string,
  userId: string
): Promise<VoiceExpenseResponse> {
  try {
    console.log('Processing voice expense for user:', userId);

    const { data, error } = await supabase.functions.invoke('process-voice', {
      body: { audioBase64, userId },
    });

    if (error) {
      console.error('Voice expense edge function error:', error);
      throw error;
    }

    console.log('Voice expense processed successfully:', data);
    return data;
  } catch (error) {
    console.error('Voice expense error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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

    // Create a File instance from the URI
    const file = new File(uri);
    
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    console.log('Audio converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Error converting audio to base64:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to convert audio: ${error.message}`
        : 'Failed to convert audio to base64'
    );
  }
}
