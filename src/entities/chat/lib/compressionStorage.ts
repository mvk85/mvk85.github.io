import { CHAT_COMPRESSION_ENABLED_STORAGE_KEY } from '@/entities/chat/lib/constants';

export function saveCompressionEnabled(value: boolean): void {
  localStorage.setItem(CHAT_COMPRESSION_ENABLED_STORAGE_KEY, value ? '1' : '0');
}

export function loadCompressionEnabled(): boolean | null {
  const raw = localStorage.getItem(CHAT_COMPRESSION_ENABLED_STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  if (raw === '1') {
    return true;
  }

  if (raw === '0') {
    return false;
  }

  return null;
}

export function initializeCompressionEnabled(defaultValue: boolean): boolean {
  const savedValue = loadCompressionEnabled();
  if (savedValue !== null) {
    return savedValue;
  }

  saveCompressionEnabled(defaultValue);
  return defaultValue;
}
