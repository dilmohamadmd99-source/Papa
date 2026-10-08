import type { Message, WorkspaceFile } from '../types';

export interface ChatStreamCallbacks {
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onFinish: () => void;
}

export async function streamChatResponse(
  messages: Array<Pick<Message, 'role' | 'content'> & { attachments?: any[] }>,
  model: string = 'gemini-3.8-flash',
  attachments: any[] = [],
  callbacks: ChatStreamCallbacks,
  signal?: AbortSignal
) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        attachments,
      }),
      signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Response body has no reader');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          callbacks.onFinish();
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            callbacks.onChunk(parsed.text);
          } else if (parsed.error) {
            callbacks.onError(parsed.error);
          }
        } catch {
          // ignore chunk parse error
        }
      }
    }
    callbacks.onFinish();
  } catch (error: any) {
    if (signal?.aborted) {
      callbacks.onFinish();
      return;
    }
    callbacks.onError(error.message || 'Stream connection failed');
  }
}

export async function askWorkspaceAI(
  action: 'generate' | 'explain' | 'debug' | 'refactor' | 'review' | 'tests' | 'docs',
  file: WorkspaceFile,
  prompt?: string,
  projectFiles?: WorkspaceFile[]
): Promise<string> {
  const res = await fetch('/api/workspace/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, file, prompt, projectFiles }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Workspace AI generation failed');
  }
  const data = await res.json();
  return data.result;
}

export async function createPaymentOrder(
  planId: string,
  planName: string,
  amount: number,
  userId: string,
  userEmail: string
) {
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, planName, amount, userId, userEmail }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create payment order');
  }
  return res.json();
}

export async function verifyPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  planId: string;
  userId: string;
  amount: number;
  durationMonths: number;
}) {
  const res = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Payment verification failed');
  }
  return res.json();
}

export async function getAdminMetrics(adminEmail: string) {
  const res = await fetch('/api/admin/metrics', {
    headers: {
      'x-admin-email': adminEmail,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Admin authorization failed');
  }
  return res.json();
}

export async function updateAIConfig(adminEmail: string, config: { freeDailyLimit?: number; defaultModel?: string }) {
  const res = await fetch('/api/admin/ai-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail,
    },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getPaymentConfig() {
  const res = await fetch('/api/payments/config');
  if (!res.ok) return { keyId: 'rzp_test_rehanai_live', merchantUpiId: 'dilmhamadmiya2378@upi' };
  return res.json();
}

export async function getAdminRazorpayConfig(adminEmail: string) {
  const res = await fetch('/api/admin/razorpay-config', {
    headers: { 'x-admin-email': adminEmail },
  });
  if (!res.ok) throw new Error('Failed to fetch Razorpay config');
  return res.json();
}

export async function updateAdminRazorpayConfig(adminEmail: string, payload: {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  merchantUpiId?: string;
  merchantName?: string;
}) {
  const res = await fetch('/api/admin/razorpay-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update Razorpay config');
  return res.json();
}

export async function generateAIVideo(payload: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: '16:9' | '9:16';
}) {
  const res = await fetch('/api/ai/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Video generation failed');
  return res.json();
}

export async function generateAIImage(payload: { prompt: string; imageBase64?: string }) {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Image generation failed');
  return res.json();
}

export async function generateAIMusic(payload: { prompt: string; mode: 'clip' | 'pro' }) {
  const res = await fetch('/api/ai/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Music generation failed');
  return res.json();
}

export async function transcribeAudio(payload: { audioBase64: string; mimeType?: string }) {
  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Audio transcription failed');
  return res.json();
}
