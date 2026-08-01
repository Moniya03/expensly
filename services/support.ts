/**
 * Feedback & bug report submissions (Settings > Help).
 * Attachments (photo/video) upload to the 'bug-attachments' storage bucket.
 */

import { supabase } from './supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Upload a picked photo/video to the bug-attachments bucket.
 * Returns the public URL.
 */
export const uploadBugAttachment = async (fileUri: string): Promise<string> => {
  const userId = useAuthStore.getState().session?.user?.id;

  if (!userId) {
    throw new Error('No active session');
  }

  const { readAsStringAsync, EncodingType } = require('expo-file-system/legacy');

  const base64 = await readAsStringAsync(fileUri, {
    encoding: EncodingType.Base64,
  });

  const extMatch = /\.(\w+)$/.exec(fileUri);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const path = `${userId}/attachment-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('bug-attachments')
    .upload(path, base64, {
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('bug-attachments').getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Submit a bug report (description + optional attachment URL).
 */
export const submitBugReport = async (description: string, attachmentUrl?: string): Promise<void> => {
  const userId = useAuthStore.getState().session?.user?.id;

  if (!userId) {
    throw new Error('No active session');
  }

  const { error } = await supabase.from('bug_reports').insert({
    user_id: userId,
    description,
    attachment_url: attachmentUrl ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Submit app feedback (1-5 rating + optional message).
 */
export const submitFeedback = async (rating: number, message?: string): Promise<void> => {
  const userId = useAuthStore.getState().session?.user?.id;

  if (!userId) {
    throw new Error('No active session');
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: userId,
    rating,
    message: message?.trim() ? message.trim() : null,
  });

  if (error) {
    throw new Error(error.message);
  }
};
