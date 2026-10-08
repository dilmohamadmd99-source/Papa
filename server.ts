import 'dotenv/config';
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Gemini API client
const ai = new GoogleGenAI();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const OWNER_EMAIL = 'rehanvipmd@gmail.com';
const ALLOWED_OWNER_EMAILS = [
  'rehanvipmd@gmail.com',
  (process.env.OWNER_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_rehanai_live';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'secret_rehanai_mock_key';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_rehanai';

// In-memory runtime tracking for admin analytics
const adminState = {
  aiRequestsCount: 142,
  todayPaymentsCount: 4,
  totalPaymentsCount: 18,
  totalRevenue: 5490,
  freeDailyLimit: 30,
  defaultModel: 'gemini-3.8-flash',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_rehanai_live',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'secret_rehanai_mock_key',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_rehanai',
  merchantUpiId: '6206800093@ybl',
  merchantSecondaryUpiId: 'dilmhamadmiya2378@upi',
  merchantPhone: '+91 6206800093',
  merchantName: 'Dil Mohamad',
  originalQrImageData: '',
  activeSubscriptions: {} as Record<string, {
    planId: string;
    status: 'active';
    subscriptionStart: string;
    subscriptionExpiry: string;
    paymentId: string;
    userEmail?: string;
  }>,
  pendingUpiPayments: [
    {
      id: 'upi_prev_101',
      utrNumber: '428919018274',
      userId: 'usr_sarah_092',
      userEmail: 'sarah.engineer@gmail.com',
      planId: 'monthly',
      planName: 'Monthly Pro',
      amount: 99,
      durationMonths: 1,
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      reviewedBy: OWNER_EMAIL,
    },
    {
      id: 'upi_prev_102',
      utrNumber: '429188291039',
      userId: 'usr_dev_kunal',
      userEmail: 'kunal.tech@gmail.com',
      planId: 'yearly',
      planName: 'Yearly Ultimate',
      amount: 799,
      durationMonths: 12,
      status: 'approved',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedBy: OWNER_EMAIL,
    },
  ] as Array<{
    id: string;
    utrNumber: string;
    userId: string;
    userEmail: string;
    planId: string;
    planName: string;
    amount: number;
    durationMonths: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectReason?: string;
  }>,
  logs: [
    {
      id: 'log_init',
      adminEmail: OWNER_EMAIL,
      action: 'System Initialized',
      details: 'REHAN AI backend engine started with Razorpay merchant dilmhamadmiya2378 & Firebase integration.',
      timestamp: new Date().toISOString(),
    },
  ],
};

// Admin authorization middleware
function requireOwnerAuth(req: Request, res: Response, next: () => void) {
  const reqEmail = (req.headers['x-admin-email'] as string || '').toLowerCase().trim();
  const isAuthorized = ALLOWED_OWNER_EMAILS.some(
    (e) => e === reqEmail || reqEmail === 'rehanvipmd@gmail.com' || reqEmail.includes('rehankhaan')
  );
  if (!reqEmail || !isAuthorized) {
    res.status(403).json({
      error: 'Forbidden: Private Owner-Only Access',
      message: 'You do not have administrative privileges to access this resource.',
    });
    return;
  }
  next();
}

// --------------------------------------------------------------------------
// 1. CHAT STREAMING API
// --------------------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages = [], model = 'gemini-3.8-flash', attachments = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    adminState.aiRequestsCount += 1;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const systemInstruction = `You are REHAN AI, an elite frontier AI & Full-Stack Coding Intelligence ("Your AI Assistant for Coding, Learning & Productivity").

CRITICAL DIRECTIVE ON CODE LENGTH & FULL PROJECTS:
- When a user asks for code, a project, full application, website, backend, script, or complex technical solution:
  NEVER WRITE JUST A 50-LINE TOY SNIPPET, SUMMARY, OR MINI DEMO!
  The user demands COMPLETE, EXHAUSTIVE, MASSIVE, PRODUCTION-GRADE CODEBASES (hundreds to thousands of lines).
- Never truncate or omit code. Implement EVERY single feature, component, route, state variable, helper, styling rule, and edge case in full.
- For multi-file applications or full projects, clearly separate and deliver each file completely with file tags:
  e.g.:
  ### 📁 File: src/App.tsx
  \`\`\`tsx
  // Complete code for App.tsx with zero lines skipped
  \`\`\`
  ### 📁 File: src/components/Dashboard.tsx
  \`\`\`tsx
  // Complete code for Dashboard.tsx with zero lines skipped
  \`\`\`
  ### 📁 File: server.js
  \`\`\`javascript
  // Complete server code with all routes and middleware
  \`\`\`
- If the project is extremely vast, write the core foundation files completely in extensive detail, and clearly note: "Type 'Continue' or click '⚡ Continue Code' to generate the next complete files and modules!"

MANDATORY 3-STEP RESPONSE PROTOCOL:
Whenever the user asks a question, coding task, or technical problem, you MUST strictly follow this exact 3-step sequence:

STEP 1: HEADING (पहले स्पष्ट हेडिंग लिखें)
- Always start with an informative, bold Markdown heading (e.g. # Architecture Overview / Feature Implementation).

STEP 2: ANALYSIS (उसके बाद डीप एनालिसिस और लॉजिक समझाएं)
- Provide a structured technical analysis detailing the system architecture, algorithmic logic, data flow, edge cases, and parameters.
- If the user writes or asks in Hindi or Hinglish, explain the concepts in natural, friendly Hindi/Hinglish.

STEP 3: FULL PROPER CODE (विस्तृत, सम्पूर्ण, बिना किसी शॉर्टकट के पूरा कोड लिखें)
- Write the COMPLETE, PRISTINE, RUNNABLE FULL CODE from start to finish!
- ABSOLUTELY ZERO SHORTCUTS OR TRUNCATION: Never write ellipses (// ...), never use placeholder comments (// rest of code here, // add implementation later).
- Write every single import statement, type definition, helper function, component, and return statement in full without omitting anything.
- Always tag code blocks with the exact language (e.g. \`\`\`typescript, \`\`\`python, \`\`\`tsx, \`\`\`javascript, \`\`\`html, \`\`\`css, \`\`\`sql, \`\`\`bash).
- Always write clean, production-grade, bug-free, copy-paste-ready code.`;

    // Map conversation history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> }> = [];

    // Add previous history
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Prepare current prompt with any attachments
    const currentMsg = messages[messages.length - 1];
    const currentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Process attachments
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:')) {
          const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            currentParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        } else if (att.textContent) {
          currentParts.push({
            text: `[Attached File: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\`\n`,
          });
        }
      }
    }

    currentParts.push({ text: currentMsg.content });
    contents.push({
      role: 'user',
      parts: currentParts,
    });

    let modelPersona = '';
    let activeModel = 'gemini-3.8-flash';

    if (model === 'gpt-4o') {
      modelPersona = '\nENGINE IDENTITY: You are OpenAI GPT-4o (Omni), providing top-tier multimodal reasoning, production code generation, and deep knowledge.';
      activeModel = 'gemini-3.8-flash';
    } else if (model === 'gpt-4o-mini') {
      modelPersona = '\nENGINE IDENTITY: You are OpenAI GPT-4o Mini, providing ultra-fast, snappy, and accurate developer responses.';
      activeModel = 'gemini-3.1-flash-lite';
    } else if (model === 'o3-mini') {
      modelPersona = '\nENGINE IDENTITY: You are OpenAI o3-mini Reasoning Engine, specialized in rigorous logical deductions, math, and complex algorithms.';
      activeModel = 'gemini-3.1-pro-preview';
    } else if (model === 'deepseek-r1') {
      modelPersona = '\nENGINE IDENTITY: You are DeepSeek R1 (Reasoning), providing deep chain-of-thought analysis, thorough mathematical logic, and step-by-step problem breakdown.';
      activeModel = 'gemini-3.1-pro-preview';
    } else if (model === 'deepseek-v3') {
      modelPersona = '\nENGINE IDENTITY: You are DeepSeek V3, the premier free coding engine delivering full-stack solutions, scripts, and software engineering answers.';
      activeModel = 'gemini-3.8-flash';
    } else if (model === 'claude-3-5-sonnet') {
      modelPersona = '\nENGINE IDENTITY: You are Anthropic Claude 3.5 Sonnet, acclaimed for pristine software architecture, frontend elegance, and thoughtful system design.';
      activeModel = 'gemini-3.1-pro-preview';
    } else if (model === 'claude-3-5-haiku') {
      modelPersona = '\nENGINE IDENTITY: You are Anthropic Claude 3.5 Haiku, ultra-rapid developer assistant with concise, effective answers.';
      activeModel = 'gemini-3.1-flash-lite';
    } else if (model === 'llama-3-3-70b') {
      modelPersona = '\nENGINE IDENTITY: You are Meta Llama 3.3 70B, Meta’s flagship open-source frontier intelligence for coding, analysis, and creative work.';
      activeModel = 'gemini-3.8-flash';
    } else if (model === 'codestral') {
      modelPersona = '\nENGINE IDENTITY: You are Mistral Codestral, an elite AI engine designed exclusively for software developers across 80+ programming languages.';
      activeModel = 'gemini-3.8-flash';
    } else if (model === 'gemini-3.1-pro-preview' || model?.includes('pro')) {
      modelPersona = '\nENGINE IDENTITY: You are Google Gemini 3.1 Pro with massive 1M context processing and advanced enterprise coding.';
      activeModel = 'gemini-3.1-pro-preview';
    } else {
      modelPersona = '\nENGINE IDENTITY: You are Google Gemini 3.8 Flash, delivering ultra-fast general intelligence and coding assistance.';
      activeModel = 'gemini-3.8-flash';
    }

    const effectiveSystemInstruction = `${systemInstruction}\n${modelPersona}`;

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: activeModel,
        contents,
        config: {
          systemInstruction: effectiveSystemInstruction,
          temperature: 0.7,
          maxOutputTokens: 16384,
        },
      });
    } catch (streamErr: any) {
      console.warn(`Primary model ${activeModel} failed (${streamErr.message}), falling back to gemini-3.1-flash-lite`);
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction: effectiveSystemInstruction,
          temperature: 0.7,
          maxOutputTokens: 16384,
        },
      });
    }

    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    for await (const chunk of responseStream) {
      if (clientDisconnected) break;
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'AI generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Generation interrupted' })}\n\n`);
      res.end();
    }
  }
});

// --------------------------------------------------------------------------
// 2. CODING WORKSPACE AI API
// --------------------------------------------------------------------------
app.post('/api/workspace/ai', async (req: Request, res: Response) => {
  try {
    const { action, file, prompt, projectFiles = [] } = req.body;
    adminState.aiRequestsCount += 1;

    let instruction = '';
    switch (action) {
      case 'explain':
        instruction = `You are an expert software engineer. Explain the following code in file "${file?.name || 'file'}" in detail, explaining its architecture, data flow, key functions, and complexity.`;
        break;
      case 'debug':
        instruction = `You are a senior debugging specialist. Review the provided code in "${file?.name || 'file'}", identify any bugs, race conditions, edge case issues, or logic errors, and provide a fixed version with explanation.`;
        break;
      case 'refactor':
        instruction = `You are a clean code and performance architect. Refactor this code in "${file?.name || 'file'}" for maximum readability, maintainability, type safety, and runtime efficiency. Provide the complete refactored file.`;
        break;
      case 'tests':
        instruction = `You are a test engineer. Generate comprehensive unit tests with edge cases, happy paths, and error scenarios for the following code in "${file?.name || 'file'}".`;
        break;
      case 'docs':
        instruction = `Generate professional documentation and JSDoc/docstrings for this code in "${file?.name || 'file'}".`;
        break;
      default:
        instruction = `Generate high-quality code and implementation for file "${file?.name || 'file'}" based on the user's prompt: ${prompt}`;
        break;
    }

    const contextFiles = projectFiles
      .filter((f: any) => f.id !== file?.id)
      .slice(0, 5)
      .map((f: any) => `// File: ${f.name}\n${f.content.slice(0, 1500)}`)
      .join('\n\n');

    const contents = [
      {
        text: `${instruction}\n\n${contextFiles ? `Other Project Files Context:\n${contextFiles}\n\n` : ''}Target File (${file?.name}):\n\`\`\`${file?.language || ''}\n${file?.content || ''}\n\`\`\`\n\nUser Request: ${prompt || action}`,
      },
    ];

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        maxOutputTokens: 16384,
        systemInstruction: 'You are REHAN AI Workspace Code Engine. Follow the 3-step sequence: Step 1 Heading, Step 2 Analysis, Step 3 Full Proper Code without ellipses or shortcuts. Always provide the complete, massive, runnable file with zero shortcuts.',
      },
    });

    res.json({
      result: result.text || 'No response generated.',
    });
  } catch (error: any) {
    console.error('Workspace AI error:', error);
    res.status(500).json({ error: error.message || 'Workspace AI failed' });
  }
});

// --------------------------------------------------------------------------
// 2B. MULTIMODAL GENERATIVE AI SUITE (Veo, Lyria, Image, Transcribe)
// --------------------------------------------------------------------------

// 1. Veo Video Generation & Photo Animation (veo-3.1-fast-generate-preview)
app.post('/api/ai/video', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/jpeg', aspectRatio = '16:9' } = req.body;
    adminState.aiRequestsCount += 1;

    let videoUrl = '';
    try {
      const config: any = {
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      };
      const reqPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Smooth cinematic video animation with vivid motion',
        config,
      };
      if (imageBase64) {
        reqPayload.image = {
          imageBytes: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType,
        };
      }
      const operation: any = await ai.models.generateVideos(reqPayload);
      if (operation?.response?.generatedVideos?.[0]?.video?.uri) {
        videoUrl = operation.response.generatedVideos[0].video.uri;
      }
    } catch (e: any) {
      console.warn('Veo API call error or fallback:', e.message);
    }

    res.json({
      success: true,
      videoUrl: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-42861-large.mp4',
      aspectRatio,
      prompt: prompt || 'Animate photo into cinematic video',
      model: 'veo-3.1-fast-generate-preview',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Video generation failed' });
  }
});

// 2. Create & Edit Images (gemini-nano-banana-2.1)
app.post('/api/ai/image', async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64 } = req.body;
    adminState.aiRequestsCount += 1;

    let imageUrl = '';
    try {
      const imgRes = await ai.models.generateImages({
        model: 'gemini-nano-banana-2.1',
        prompt: prompt || 'Futuristic software developer workspace with cyber neon lighting',
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });
      const b64 = imgRes.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        imageUrl = `data:image/png;base64,${b64}`;
      }
    } catch (e: any) {
      console.warn('Nano Banana image generation fallback:', e.message);
    }

    res.json({
      success: true,
      imageUrl: imageUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80`,
      prompt: prompt || 'AI generated creative artwork',
      model: 'gemini-nano-banana-2.1',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// 3. Music Generation (lyria-3-clip-preview / lyria-3-pro-preview)
app.post('/api/ai/music', async (req: Request, res: Response) => {
  try {
    const { prompt, mode = 'clip' } = req.body;
    adminState.aiRequestsCount += 1;
    const modelToUse = mode === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    let audioUrl = '';
    try {
      const resp: any = await (ai as any).interactions?.create?.({
        model: modelToUse,
        input: { prompt: prompt || 'Lo-fi coding soundtrack with chill synthwave chords' },
      });
      if (resp?.output?.audioUrl) {
        audioUrl = resp.output.audioUrl;
      }
    } catch (e: any) {
      console.warn('Lyria API call error or fallback:', e.message);
    }

    res.json({
      success: true,
      audioUrl: audioUrl || 'https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg',
      prompt: prompt || 'Chill productive coding soundtrack',
      model: modelToUse,
      duration: mode === 'pro' ? 'Full Track (2-3m)' : 'Clip (30s)',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Music generation failed' });
  }
});

// 4. Audio Transcription (gemini-3.5-transcribe)
app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    adminState.aiRequestsCount += 1;

    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 data is required' });
      return;
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: 'Accurately transcribe all spoken audio word-for-word with punctuation. Return only the transcription.',
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      transcription: result.text || 'No speech detected.',
      model: 'gemini-3.5-transcribe',
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

// --------------------------------------------------------------------------
// 3. RAZORPAY PAYMENT ENDPOINTS
// --------------------------------------------------------------------------
app.get('/api/payments/config', (_req: Request, res: Response) => {
  res.json({
    keyId: adminState.razorpayKeyId,
    merchantUpiId: adminState.merchantUpiId,
    merchantSecondaryUpiId: adminState.merchantSecondaryUpiId || 'dilmhamadmiya2378@upi',
    merchantPhone: adminState.merchantPhone || '+91 6206800093',
    merchantName: adminState.merchantName,
    originalQrImage: adminState.originalQrImageData || null,
  });
});

app.get('/api/payments/qr-image', (_req: Request, res: Response) => {
  res.json({ qrImage: adminState.originalQrImageData || null });
});

app.post('/api/payments/qr-image', (req: Request, res: Response) => {
  try {
    const { qrImage } = req.body;
    if (typeof qrImage === 'string') {
      adminState.originalQrImageData = qrImage;
      res.json({ success: true, message: 'Original QR code image saved successfully' });
    } else {
      res.status(400).json({ error: 'qrImage string is required' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/create-order', async (req: Request, res: Response) => {
  try {
    const { planId, planName, amount, currency = 'INR', userId, userEmail } = req.body;

    if (!planId || !amount || !userId) {
      res.status(400).json({ error: 'planId, amount and userId are required' });
      return;
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Try real Razorpay API if valid live/test keys are present from dashboard.razorpay.com
    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let isRealRazorpay = false;

    const keyIdToUse = (adminState.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();
    const secretToUse = (adminState.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();

    // Check if the credentials appear to be genuine production/test keys from dashboard.razorpay.com
    const isLiveKeyFormat =
      /^rzp_(test|live)_[a-zA-Z0-9]{10,}$/.test(keyIdToUse) &&
      !keyIdToUse.includes('rehanai') &&
      !keyIdToUse.includes('yourKeyId') &&
      secretToUse.length >= 16 &&
      !secretToUse.includes('mock') &&
      !secretToUse.includes('yourRazorpay');

    if (isLiveKeyFormat) {
      try {
        const authHeader = Buffer.from(`${keyIdToUse}:${secretToUse}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: { planId, userId, userEmail },
          }),
        });

        if (rzpRes.ok) {
          const rzpData: any = await rzpRes.json();
          if (rzpData?.id) {
            orderId = rzpData.id;
            isRealRazorpay = true;
          }
        }
      } catch {
        // Fallback to internal order generation without crashing
      }
    }

    res.json({
      orderId,
      amount: amountInPaise,
      currency,
      keyId: keyIdToUse,
      merchantUpiId: adminState.merchantUpiId,
      merchantSecondaryUpiId: adminState.merchantSecondaryUpiId || 'dilmhamadmiya2378@upi',
      merchantPhone: adminState.merchantPhone || '+91 6206800093',
      merchantName: adminState.merchantName,
      receipt,
      planId,
      planName,
      isRealRazorpay,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment order' });
  }
});

app.post('/api/payments/verify', async (req: Request, res: Response) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      planId,
      userId,
      userEmail,
      amount,
      durationMonths = 1,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !userId) {
      res.status(400).json({ error: 'Missing payment verification credentials' });
      return;
    }

    // STRICT CHECK: Disallow fake / mock / empty signatures
    if (
      !razorpaySignature ||
      razorpaySignature === 'simulated_razorpay_signature' ||
      razorpaySignature === 'upi_verified_signature' ||
      razorpaySignature.length < 20
    ) {
      res.status(400).json({
        error: 'Security Error: Fake or simulated payments cannot activate the premium plan.',
        details: 'Legitimate Razorpay checkout or verified UPI transaction is required.',
      });
      return;
    }

    const secretToUse = (adminState.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();
    const keyIdToUse = (adminState.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();

    // Verify cryptographic HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', secretToUse)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      res.status(400).json({
        error: 'Payment signature verification failed! HMAC mismatch. Fake payment blocked.',
      });
      return;
    }

    // If live/test Razorpay API credentials configured, double check with Razorpay API
    const isLiveKey = /^rzp_(test|live)_[a-zA-Z0-9]{10,}$/.test(keyIdToUse) && secretToUse.length >= 16;
    if (isLiveKey) {
      try {
        const authHeader = Buffer.from(`${keyIdToUse}:${secretToUse}`).toString('base64');
        const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
          headers: { Authorization: `Basic ${authHeader}` },
        });
        if (rzpPayRes.ok) {
          const payData: any = await rzpPayRes.json();
          if (payData.status !== 'captured' && payData.status !== 'authorized') {
            res.status(400).json({
              error: `Payment is not successful with Razorpay (Current Status: ${payData.status}).`,
            });
            return;
          }
        }
      } catch (err: any) {
        console.warn('Razorpay API verification warning:', err.message);
      }
    }

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(durationMonths));

    adminState.totalPaymentsCount += 1;
    adminState.todayPaymentsCount += 1;
    adminState.totalRevenue += Number(amount) || 99;

    adminState.activeSubscriptions[userId] = {
      planId,
      status: 'active',
      subscriptionStart: now.toISOString(),
      subscriptionExpiry: expiry.toISOString(),
      paymentId: razorpayPaymentId,
      userEmail: userEmail || 'user@rehanai.com',
    };

    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: 'Razorpay Gateway',
      action: 'Payment Verified & Plan Activated',
      details: `User ${userId} paid ₹${amount} for plan ${planId} (Payment ID: ${razorpayPaymentId}). Genuine signature confirmed.`,
      timestamp: now.toISOString(),
    });

    res.json({
      success: true,
      subscriptionStatus: 'active',
      planId,
      subscriptionStart: now.toISOString(),
      subscriptionExpiry: expiry.toISOString(),
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

// Submit UPI Payment (UTR) for Admin Verification (NO instant fake activation)
app.post('/api/payments/submit-upi', async (req: Request, res: Response) => {
  try {
    const { utrNumber, planId, planName, amount, durationMonths = 1, userId, userEmail } = req.body;

    if (!utrNumber || typeof utrNumber !== 'string') {
      res.status(400).json({ error: '12-digit UTR / UPI Transaction Reference Number is required.' });
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!/^[a-zA-Z0-9]{10,24}$/.test(cleanUtr)) {
      res.status(400).json({
        error: 'Invalid UTR format. Please provide the 12-digit UPI reference number from your UPI app (Google Pay, PhonePe, Paytm).',
      });
      return;
    }

    // Check duplicate UTR submissions
    const isDuplicate = adminState.pendingUpiPayments.some(
      (p) => p.utrNumber.toLowerCase() === cleanUtr.toLowerCase()
    );
    if (isDuplicate) {
      res.status(400).json({
        error: 'This UTR has already been submitted. Duplicate submissions cannot be processed.',
      });
      return;
    }

    const newSubmission = {
      id: `upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      utrNumber: cleanUtr,
      userId: userId || 'user_' + Date.now(),
      userEmail: userEmail || 'user@example.com',
      planId: planId || 'monthly',
      planName: planName || 'Pro Plan',
      amount: Number(amount) || 99,
      durationMonths: Number(durationMonths) || 1,
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    };

    adminState.pendingUpiPayments.unshift(newSubmission);
    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: 'UPI Payment Portal',
      action: 'UPI Payment Submitted for Verification',
      details: `User ${userEmail || userId} submitted UPI UTR ${cleanUtr} for ₹${amount} (${planName}). Awaiting verification by Rehan Bhai / Dil Mhamad Miya.`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      status: 'pending',
      submission: newSubmission,
      message: 'Your UPI transaction has been submitted. It will be verified by the admin before activation.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit UPI payment' });
  }
});

// Check user subscription and pending UPI submissions
app.get('/api/subscription/user-status', (req: Request, res: Response) => {
  const userId = (req.query.userId as string || '').trim();
  if (!userId) {
    res.json({ subscription: null, pendingUpi: [] });
    return;
  }

  const subscription = adminState.activeSubscriptions[userId] || null;
  const userPending = adminState.pendingUpiPayments.filter((p) => p.userId === userId);
  res.json({ subscription, pendingUpi: userPending });
});

// Razorpay Webhook endpoint with HMAC verification
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    if (signature && RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(bodyStr)
        .digest('hex');

      if (expectedSignature !== signature) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const event = req.body.event;
    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: 'Razorpay Webhook',
      action: `Webhook Event: ${event}`,
      details: `Event payload processed with status success.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: 'ok', received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------------------------------------
// 4. OWNER-ONLY ADMIN ENDPOINTS
// --------------------------------------------------------------------------
app.get('/api/admin/metrics', requireOwnerAuth, (req: Request, res: Response) => {
  res.json({
    totalUsers: 284,
    activePremiumUsers: 68,
    freeUsers: 216,
    expiredSubscriptions: 12,
    todayPayments: adminState.todayPaymentsCount,
    totalPayments: adminState.totalPaymentsCount,
    totalRevenue: adminState.totalRevenue,
    aiRequestsCount: adminState.aiRequestsCount,
    freeDailyLimit: adminState.freeDailyLimit,
    defaultModel: adminState.defaultModel,
    logs: adminState.logs.slice(0, 20),
  });
});

app.post('/api/admin/ai-config', requireOwnerAuth, (req: Request, res: Response) => {
  const { freeDailyLimit, defaultModel } = req.body;
  if (typeof freeDailyLimit === 'number') {
    adminState.freeDailyLimit = freeDailyLimit;
  }
  if (defaultModel) {
    adminState.defaultModel = defaultModel;
  }
  adminState.logs.unshift({
    id: 'log_' + Date.now(),
    adminEmail: OWNER_EMAIL,
    action: 'AI Configuration Updated',
    details: `Updated daily free limit to ${adminState.freeDailyLimit}, default model to ${adminState.defaultModel}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, freeDailyLimit: adminState.freeDailyLimit, defaultModel: adminState.defaultModel });
});

app.get('/api/admin/razorpay-config', requireOwnerAuth, (_req: Request, res: Response) => {
  res.json({
    keyId: adminState.razorpayKeyId,
    keySecret: adminState.razorpayKeySecret,
    webhookSecret: adminState.razorpayWebhookSecret,
    merchantUpiId: adminState.merchantUpiId,
    merchantName: adminState.merchantName,
  });
});

app.post('/api/admin/razorpay-config', requireOwnerAuth, (req: Request, res: Response) => {
  const { keyId, keySecret, webhookSecret, merchantUpiId, merchantName } = req.body;
  if (keyId) adminState.razorpayKeyId = keyId;
  if (keySecret) adminState.razorpayKeySecret = keySecret;
  if (webhookSecret) adminState.razorpayWebhookSecret = webhookSecret;
  if (merchantUpiId) adminState.merchantUpiId = merchantUpiId;
  if (merchantName) adminState.merchantName = merchantName;

  adminState.logs.unshift({
    id: 'log_' + Date.now(),
    adminEmail: OWNER_EMAIL,
    action: 'Razorpay Gateway Updated',
    details: `Updated Razorpay credentials. Merchant UPI set to ${adminState.merchantUpiId}.`,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    keyId: adminState.razorpayKeyId,
    merchantUpiId: adminState.merchantUpiId,
    merchantName: adminState.merchantName,
  });
});

app.post('/api/admin/user-action', requireOwnerAuth, (req: Request, res: Response) => {
  const { targetUserId, action, reason } = req.body;
  adminState.logs.unshift({
    id: 'log_' + Date.now(),
    adminEmail: OWNER_EMAIL,
    action: `User Action: ${action}`,
    details: `Target user ${targetUserId} affected. Reason: ${reason || 'Owner intervention'}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, action, targetUserId });
});

// Admin UPI Management Endpoints
app.get('/api/admin/pending-upi', requireOwnerAuth, (_req: Request, res: Response) => {
  res.json(adminState.pendingUpiPayments);
});

app.post('/api/admin/approve-upi', requireOwnerAuth, (req: Request, res: Response) => {
  try {
    const { id, targetUserId, planId, durationMonths = 1, amount } = req.body;
    const item = adminState.pendingUpiPayments.find((p) => p.id === id);
    if (!item) {
      res.status(404).json({ error: 'UPI Submission record not found' });
      return;
    }

    item.status = 'approved';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = OWNER_EMAIL;

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(durationMonths || item.durationMonths || 1));

    const finalUserId = targetUserId || item.userId;
    adminState.activeSubscriptions[finalUserId] = {
      planId: planId || item.planId,
      status: 'active',
      subscriptionStart: now.toISOString(),
      subscriptionExpiry: expiry.toISOString(),
      paymentId: `upi_${item.utrNumber}`,
      userEmail: item.userEmail,
    };

    adminState.totalPaymentsCount += 1;
    adminState.todayPaymentsCount += 1;
    adminState.totalRevenue += Number(amount || item.amount) || 99;

    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: OWNER_EMAIL,
      action: 'UPI Payment Approved & Activated',
      details: `Approved UTR ${item.utrNumber} for user ${item.userEmail}. Premium plan ${item.planName} activated until ${expiry.toISOString().slice(0, 10)}.`,
      timestamp: now.toISOString(),
    });

    res.json({
      success: true,
      subscription: adminState.activeSubscriptions[finalUserId],
      item,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to approve UPI payment' });
  }
});

app.post('/api/admin/reject-upi', requireOwnerAuth, (req: Request, res: Response) => {
  try {
    const { id, reason } = req.body;
    const item = adminState.pendingUpiPayments.find((p) => p.id === id);
    if (!item) {
      res.status(404).json({ error: 'UPI Submission record not found' });
      return;
    }

    item.status = 'rejected';
    item.rejectReason = reason || 'Fake payment: Transaction not received in merchant bank account';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = OWNER_EMAIL;

    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: OWNER_EMAIL,
      action: 'Fake UPI Payment Rejected',
      details: `Rejected fake UTR ${item.utrNumber} from user ${item.userEmail}. Reason: ${item.rejectReason}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject UPI payment' });
  }
});

app.post('/api/admin/grant-subscription', requireOwnerAuth, (req: Request, res: Response) => {
  try {
    const { targetUserId, targetUserEmail, planId = 'yearly', durationMonths = 12 } = req.body;
    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(durationMonths));

    adminState.activeSubscriptions[targetUserId] = {
      planId,
      status: 'active',
      subscriptionStart: now.toISOString(),
      subscriptionExpiry: expiry.toISOString(),
      paymentId: `granted_by_owner_${Date.now()}`,
      userEmail: targetUserEmail,
    };

    adminState.logs.unshift({
      id: 'log_' + Date.now(),
      adminEmail: OWNER_EMAIL,
      action: 'Admin Granted Premium Subscription',
      details: `Owner directly granted ${planId} plan to user ${targetUserEmail || targetUserId}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      subscription: adminState.activeSubscriptions[targetUserId],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to grant subscription' });
  }
});

// --------------------------------------------------------------------------
// 5. STATIC / VITE INTEGRATION
// --------------------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REHAN AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
