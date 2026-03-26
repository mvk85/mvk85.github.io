import { CHAT_MODEL_OPTIONS, type ChatModel } from '@/shared/config/llmModels';
import { env } from '@/shared/config/env';

export const CHAT_AGENT_SETTINGS_STORAGE_KEY = 'chat_agent_settings_v1';

export type ChatAgentSettings = {
  model: ChatModel;
  requestBalance: boolean;
  memoryEnabled: boolean;
  temperatureEnabled: boolean;
  temperature: number;
  numPredictEnabled: boolean;
  numPredict: number;
  numCtxEnabled: boolean;
  numCtx: number;
};

type StoredChatAgentSettings = {
  model?: unknown;
  requestBalance?: unknown;
  memoryEnabled?: unknown;
  temperatureEnabled?: unknown;
  temperature?: unknown;
  numPredictEnabled?: unknown;
  numPredict?: unknown;
  numCtxEnabled?: unknown;
  numCtx?: unknown;
};

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_NUM_PREDICT = 512;
const DEFAULT_NUM_CTX = 4096;

function resolveDefaultModel(): ChatModel {
  if (CHAT_MODEL_OPTIONS.includes(env.llmModelMain as ChatModel)) {
    return env.llmModelMain as ChatModel;
  }

  return CHAT_MODEL_OPTIONS[0];
}

function normalizeNonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function createDefaultSettings(): ChatAgentSettings {
  return {
    model: resolveDefaultModel(),
    requestBalance: false,
    memoryEnabled: false,
    temperatureEnabled: false,
    temperature: DEFAULT_TEMPERATURE,
    numPredictEnabled: false,
    numPredict: DEFAULT_NUM_PREDICT,
    numCtxEnabled: false,
    numCtx: DEFAULT_NUM_CTX,
  };
}

export function loadChatAgentSettings(): ChatAgentSettings {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return createDefaultSettings();
  }

  try {
    const raw = globalThis.localStorage.getItem(CHAT_AGENT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return createDefaultSettings();
    }

    const parsed = JSON.parse(raw) as StoredChatAgentSettings;
    const defaults = createDefaultSettings();
    const model = CHAT_MODEL_OPTIONS.includes(parsed.model as ChatModel) ? (parsed.model as ChatModel) : defaults.model;

    return {
      model,
      requestBalance: parsed.requestBalance === true,
      memoryEnabled: parsed.memoryEnabled === true,
      temperatureEnabled: parsed.temperatureEnabled === true,
      temperature: normalizeNonNegativeNumber(parsed.temperature, defaults.temperature),
      numPredictEnabled: parsed.numPredictEnabled === true,
      numPredict: normalizePositiveInteger(parsed.numPredict, defaults.numPredict),
      numCtxEnabled: parsed.numCtxEnabled === true,
      numCtx: normalizePositiveInteger(parsed.numCtx, defaults.numCtx),
    };
  } catch {
    return createDefaultSettings();
  }
}

export function saveChatAgentSettings(settings: ChatAgentSettings): void {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  globalThis.localStorage.setItem(
    CHAT_AGENT_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      model: settings.model,
      requestBalance: settings.requestBalance,
      memoryEnabled: settings.memoryEnabled,
      temperatureEnabled: settings.temperatureEnabled,
      temperature: settings.temperature,
      numPredictEnabled: settings.numPredictEnabled,
      numPredict: settings.numPredict,
      numCtxEnabled: settings.numCtxEnabled,
      numCtx: settings.numCtx,
    }),
  );
}
