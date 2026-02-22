/**
 * Feedback Service - handles anonymous app feedback submissions
 */

import { supabase } from '../supabase';

export interface FeedbackSubmission {
  content: string;
  groupId?: string;
  weekOf?: string;
  source: 'fireside' | 'general';
  screenshotUri?: string;
}

export async function uploadFeedbackScreenshot(screenshotUri: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  try {
    const uriLower = screenshotUri.toLowerCase();
    let contentType = 'image/jpeg';
    let ext = 'jpeg';
    if (uriLower.includes('.png')) { contentType = 'image/png'; ext = 'png'; }
    else if (uriLower.includes('.heic')) { contentType = 'image/heic'; ext = 'heic'; }
    else if (uriLower.includes('.webp')) { contentType = 'image/webp'; ext = 'webp'; }

    const fileName = `feedback/${userData.user.id}_${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append('', {
      uri: screenshotUri,
      name: fileName.split('/').pop(),
      type: contentType,
    } as any);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/uploads/${fileName}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-upsert': 'false',
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('[feedbackScreenshot] Upload error:', response.status);
      return null;
    }

    return fileName;
  } catch (err) {
    console.error('[feedbackScreenshot] Upload failed:', err);
    return null;
  }
}

export async function submitFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    let screenshotUrl: string | null = null;
    if (feedback.screenshotUri) {
      screenshotUrl = await uploadFeedbackScreenshot(feedback.screenshotUri);
    }

    const { error } = await supabase.from('app_feedback').insert({
      user_id: userData.user.id,
      group_id: feedback.groupId || null,
      week_of: feedback.weekOf || null,
      content: feedback.content,
      screenshot_url: screenshotUrl,
      source: feedback.source,
    });

    if (error) {
      console.error('[submitFeedback] Insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[submitFeedback] Failed:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
