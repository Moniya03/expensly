/**
 * Avatar upload helpers (Supabase storage bucket 'avatars').
 * Bucket policy: public read, user may upload/update own folder only.
 */

import { supabase } from './supabase';

/**
 * Upload a picked image (file URI) as the user's avatar.
 * Returns the public URL of the uploaded image.
 */
export const uploadAvatar = async (userId: string, fileUri: string): Promise<string> => {
  const { readAsStringAsync, EncodingType } = require('expo-file-system/legacy');

  const base64 = await readAsStringAsync(fileUri, {
    encoding: EncodingType.Base64,
  });

  const extMatch = /\.(\w+)$/.exec(fileUri);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, base64, {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};
