export interface AIModel {
  id: string;
  name: string;
  provider: 'OpenAI' | 'DeepSeek' | 'Anthropic' | 'Meta' | 'Mistral' | 'Google';
  badge: string;
  badgeColor: string;
  dotColor: string;
  description: string;
  isFree: boolean;
  category: 'General' | 'Coding' | 'Reasoning' | 'Speed';
}

export const AVAILABLE_AI_MODELS: AIModel[] = [
  // --- OpenAI ---
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o (Omni)',
    provider: 'OpenAI',
    badge: 'GPT-4o Free',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    description: 'OpenAI flagship model with multimodal vision & full code generation',
    isFree: true,
    category: 'General',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'OpenAI',
    badge: '100% Free',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    description: 'Lightning-fast, lightweight OpenAI intelligence for daily coding',
    isFree: true,
    category: 'Speed',
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini Reasoning',
    provider: 'OpenAI',
    badge: 'Pro Reasoning',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    description: 'Deep mathematical, algorithmic & logic reasoning engine by OpenAI',
    isFree: false,
    category: 'Reasoning',
  },

  // --- DeepSeek (Free & Open) ---
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    provider: 'DeepSeek',
    badge: '100% Free AI',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-400',
    description: 'Deep-thinking open weights reasoning AI with step-by-step logic',
    isFree: true,
    category: 'Reasoning',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 (Coding & Chat)',
    provider: 'DeepSeek',
    badge: '100% Free AI',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-400',
    description: 'World-renowned open-source coding engine with blazing fast speed',
    isFree: true,
    category: 'Coding',
  },

  // --- Anthropic ---
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Pro Coder',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    description: 'Elite programming model for production architecture & clean code',
    isFree: false,
    category: 'Coding',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Free Fast',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    description: 'Rapid responses and high efficiency for everyday developer tasks',
    isFree: true,
    category: 'Speed',
  },

  // --- Meta Llama ---
  {
    id: 'llama-3-3-70b',
    name: 'Meta Llama 3.3 70B',
    provider: 'Meta',
    badge: '100% Free Open',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-400',
    description: 'Meta flagship open-source frontier intelligence with 70B parameters',
    isFree: true,
    category: 'General',
  },

  // --- Mistral AI ---
  {
    id: 'codestral',
    name: 'Mistral Codestral',
    provider: 'Mistral',
    badge: 'Free Code AI',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    dotColor: 'bg-orange-400',
    description: 'Specialized 25B coding engine supporting 80+ programming languages',
    isFree: true,
    category: 'Coding',
  },

  // --- Google Gemini ---
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google',
    badge: 'Default Fast',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dotColor: 'bg-purple-400',
    description: 'Ultra-fast multimodal AI with high precision and speed',
    isFree: true,
    category: 'General',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    badge: 'Pro Engine',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dotColor: 'bg-purple-400',
    description: 'Massive 1M context window and advanced enterprise reasoning',
    isFree: false,
    category: 'Reasoning',
  },
];

export const DEFAULT_AI_MODEL = AVAILABLE_AI_MODELS[0]; // GPT-4o or Gemini 3.8 Flash

export function getAIModelById(id: string): AIModel {
  return AVAILABLE_AI_MODELS.find((m) => m.id === id) || AVAILABLE_AI_MODELS[0];
}
