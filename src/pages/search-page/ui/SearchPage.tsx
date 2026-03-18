import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  type SelectChangeEvent,
  Tab,
  Tabs,
  Stack,
  TextField,
  Typography,
  InputLabel,
  Switch,
} from '@mui/material';

import type { ChatContextStrategy, ChatMessageRagSource, ChatSession } from '@/entities/chat/model/types';
import type { ScheduledEvent } from '@/processes/chat-agent/model/schedulerTypes';
import { USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { CHAT_TASK_OPTIONS, getTaskInvariants } from '@/entities/chat/lib/taskConfig';
import { MarkdownMessage } from '@/entities/chat-response/ui/MarkdownMessage';
import { useChat } from '@/features/chat/model/useChat';
import { PageContainer } from '@/shared/ui/PageContainer';
import { USER_PROFILE_OPTIONS } from '@/entities/profile/lib/profileConfig';
import { CHAT_MODEL_OPTIONS, type ChatModel } from '@/shared/config/llmModels';
import { loadMcpGithubSettings, saveMcpGithubSettings } from '@/processes/chat-agent/lib/mcpGithubSettings';
import { DEFAULT_RAG_MIN_SCORE, DEFAULT_RAG_TOP_K, loadRagSettings, saveRagSettings } from '@/processes/chat-agent/lib/ragSettings';
import { ragApi, type RagHealthResponse, type RagIndexListItem } from '@/shared/api/ragApi';
import { env } from '@/shared/config/env';
import { normalizeError } from '@/shared/lib/errors';

function formatRubles(value: number): string {
  return `${value.toFixed(6).replace('.', ',')} ₽`;
}

function formatHistoryTitle(chat: ChatSession): string {
  if (chat.title) {
    return chat.title;
  }

  const firstMessage = chat.messages[0];
  if (!firstMessage) {
    return 'Новый чат';
  }

  const compact = firstMessage.content.replace(/\s+/g, ' ').trim();
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatScheduledEventTitle(event: ScheduledEvent): string {
  const repeatText = event.repeat.mode === 'always' ? 'всегда' : `${event.repeat.totalRuns}`;
  return `${event.action} • повторений: ${repeatText} • ${formatDateTime(event.createdAt)}`;
}

function formatRagSourceKey(source: ChatMessageRagSource, index: number): string {
  const base = source.chunkId || source.indexId || source.file || String(index);
  return `${base}_${index}`;
}

type MemoryTab = 'short-term' | 'working' | 'long-term';
type AgentSettingsTab = 'mcp' | 'rag';

type McpGithubHealthResponse = {
  status?: {
    connected?: unknown;
  };
};

type RagConnectionStatus = 'idle' | 'checking' | 'success' | 'error';

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isMcpGithubConnected(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const response = payload as McpGithubHealthResponse;
  return response.status?.connected === true;
}

function isRagHealthy(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const response = payload as RagHealthResponse;
  return response.status === 'ok';
}

function isRagEmbeddingsConfigured(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const response = payload as RagHealthResponse;
  return response.embeddings?.configured === true;
}

export function SearchPage() {
  const initialMcpGithubSettings = loadMcpGithubSettings();
  const initialRagSettings = loadRagSettings();
  const [strategy1WindowInput, setStrategy1WindowInput] = useState('10');
  const [strategy2WindowInput, setStrategy2WindowInput] = useState('10');
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [historyMenuChatId, setHistoryMenuChatId] = useState<string | null>(null);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [activeMemoryTab, setActiveMemoryTab] = useState<MemoryTab>('short-term');
  const [isAgentSettingsDrawerOpen, setIsAgentSettingsDrawerOpen] = useState(false);
  const [activeAgentSettingsTab, setActiveAgentSettingsTab] = useState<AgentSettingsTab>('mcp');
  const [isRagEnabled, setIsRagEnabled] = useState(initialRagSettings.enabled);
  const [ragBaseUrl, setRagBaseUrl] = useState(initialRagSettings.baseUrl || env.ragApiBaseUrl);
  const [ragCheckStatus, setRagCheckStatus] = useState<RagConnectionStatus>('idle');
  const [ragCheckMessage, setRagCheckMessage] = useState<string | null>(null);
  const [ragStrategy, setRagStrategy] = useState<'fixed' | 'structured'>('structured');
  const [ragSelectedFile, setRagSelectedFile] = useState<File | null>(null);
  const [ragFileActionStatus, setRagFileActionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [ragFileActionMessage, setRagFileActionMessage] = useState<string | null>(null);
  const [ragIndexes, setRagIndexes] = useState<RagIndexListItem[]>([]);
  const [ragIndexesStatus, setRagIndexesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [ragIndexesErrorMessage, setRagIndexesErrorMessage] = useState<string | null>(null);
  const [ragDeletingIndexId, setRagDeletingIndexId] = useState<string | null>(null);
  const [ragSelectedIndexIds, setRagSelectedIndexIds] = useState<string[]>(initialRagSettings.selectedIndexIds);
  const [ragMinScoreInput, setRagMinScoreInput] = useState(String(initialRagSettings.minScore));
  const [ragTopKInput, setRagTopKInput] = useState(String(initialRagSettings.topK || DEFAULT_RAG_TOP_K));
  const [isMcpGithubEnabled, setIsMcpGithubEnabled] = useState(initialMcpGithubSettings.enabled);
  const [mcpGithubBaseUrl, setMcpGithubBaseUrl] = useState(initialMcpGithubSettings.baseUrl);
  const [mcpGithubUsername, setMcpGithubUsername] = useState(initialMcpGithubSettings.username);
  const [mcpGithubCheckStatus, setMcpGithubCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [isScheduledListCollapsed, setIsScheduledListCollapsed] = useState(false);

  const {
    canCreateBranchFromCurrentChat,
    chatHistory,
    createBranchFromCurrentChat,
    createNewChat,
    currentChatStrategy,
    currentChatProfile,
    currentChatTask,
    currentTaskInvariantsEnabled,
    currentStrategy1WindowSize,
    currentStrategy2WindowSize,
    currentChatId,
    deleteScheduledEvent,
    deleteHistoryChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading,
    showThinkingLoader,
    limitNotice,
    messages,
    model,
    promptTokens,
    completionTokens,
    clearLongTermMemory,
    totalTokens,
    longTermMemory,
    memoryErrorMessage,
    ragWarningMessage,
    sendUserMessage,
    scheduledEvents,
    setCurrentChatStrategy,
    setCurrentChatProfile,
    setCurrentChatModel,
    setCurrentChatTask,
    setCurrentTaskInvariantsEnabled,
    setStrategy1WindowSize,
    setStrategy2WindowSize,
    setInputValue,
    switchToHistoryChat,
    totalCost,
    userMessageCount,
    workingMemory,
  } = useChat();
  const safeScheduledEvents = scheduledEvents ?? [];

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const ragFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatPaneHeight = { xs: '50vh', sm: '58vh', md: '62vh' };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading, messages, limitNotice]);

  useEffect(() => {
    setStrategy1WindowInput(String(currentStrategy1WindowSize));
    setStrategy2WindowInput(String(currentStrategy2WindowSize));
  }, [currentStrategy1WindowSize, currentStrategy2WindowSize, currentChatId]);

  useEffect(() => {
    saveMcpGithubSettings({
      enabled: isMcpGithubEnabled,
      baseUrl: mcpGithubBaseUrl,
      username: mcpGithubUsername,
    });
  }, [isMcpGithubEnabled, mcpGithubBaseUrl, mcpGithubUsername]);

  useEffect(() => {
    saveRagSettings({
      enabled: isRagEnabled,
      baseUrl: ragBaseUrl,
      selectedIndexIds: ragSelectedIndexIds,
      minScore: Number(ragMinScoreInput),
      topK: Number(ragTopKInput),
    });
  }, [isRagEnabled, ragBaseUrl, ragSelectedIndexIds, ragMinScoreInput, ragTopKInput]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage();
  };

  const isSubmitDisabled = isLoading || isLimitReached || inputValue.trim().length === 0;
  const isCurrentChatEmpty = messages.length === 0;
  const normalizedRagBaseUrl = ragBaseUrl.trim();
  const isRagBaseUrlValid = isValidHttpUrl(normalizedRagBaseUrl);
  const isAllRagIndexesSelected = ragIndexes.length > 0 && ragSelectedIndexIds.length === ragIndexes.length;
  const normalizedMcpGithubBaseUrl = mcpGithubBaseUrl.trim();
  const isMcpGithubBaseUrlValid = isValidHttpUrl(normalizedMcpGithubBaseUrl);
  const mcpGithubHealthUrl = isMcpGithubBaseUrlValid ? `${normalizedMcpGithubBaseUrl.replace(/\/+$/, '')}/github/health` : null;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !event.ctrlKey) {
      return;
    }

    event.preventDefault();
    if (!isSubmitDisabled) {
      void sendUserMessage();
    }
  };

  const handleStrategyChange = (nextStrategy: ChatContextStrategy) => {
    if (nextStrategy === currentChatStrategy || !isCurrentChatEmpty) {
      return;
    }

    setCurrentChatStrategy(nextStrategy);
  };

  const handleProfileChange = (event: SelectChangeEvent) => {
    setCurrentChatProfile(event.target.value as typeof currentChatProfile);
  };

  const handleTaskChange = (event: SelectChangeEvent) => {
    setCurrentChatTask(event.target.value as typeof currentChatTask);
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    setCurrentChatModel(event.target.value as ChatModel);
  };

  const taskInvariants = getTaskInvariants(currentChatTask);
  const shouldShowTaskInvariants = currentChatTask !== 'none' && taskInvariants.length > 0;

  const handleStrategy1WindowInputChange = (nextValue: string) => {
    if (nextValue === '') {
      setStrategy1WindowInput(nextValue);
      return;
    }

    if (!/^\d+$/.test(nextValue)) {
      return;
    }

    setStrategy1WindowInput(nextValue);
    const parsed = Number(nextValue);
    if (Number.isInteger(parsed) && parsed > 0) {
      setStrategy1WindowSize(parsed);
    }
  };

  const handleStrategy1WindowBlur = () => {
    const parsed = Number(strategy1WindowInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setStrategy1WindowInput(String(currentStrategy1WindowSize));
      return;
    }

    setStrategy1WindowSize(parsed);
    setStrategy1WindowInput(String(parsed));
  };

  const handleStrategy2WindowInputChange = (nextValue: string) => {
    if (nextValue === '') {
      setStrategy2WindowInput(nextValue);
      return;
    }

    if (!/^\d+$/.test(nextValue)) {
      return;
    }

    setStrategy2WindowInput(nextValue);
    const parsed = Number(nextValue);
    if (Number.isInteger(parsed) && parsed >= 0) {
      setStrategy2WindowSize(parsed);
    }
  };

  const handleStrategy2WindowBlur = () => {
    const parsed = Number(strategy2WindowInput);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setStrategy2WindowInput(String(currentStrategy2WindowSize));
      return;
    }

    setStrategy2WindowSize(parsed);
    setStrategy2WindowInput(String(parsed));
  };

  const handleOpenHistoryMenu = (event: MouseEvent<HTMLButtonElement>, chatId: string) => {
    event.stopPropagation();
    setHistoryMenuAnchor(event.currentTarget);
    setHistoryMenuChatId(chatId);
  };

  const handleCloseHistoryMenu = () => {
    setHistoryMenuAnchor(null);
    setHistoryMenuChatId(null);
  };

  const handleDeleteHistoryChat = () => {
    if (!historyMenuChatId) {
      return;
    }

    deleteHistoryChat(historyMenuChatId);
    handleCloseHistoryMenu();
  };

  const handleOpenMemoryDrawer = () => {
    setIsMemoryDrawerOpen(true);
  };

  const handleCloseMemoryDrawer = () => {
    setIsMemoryDrawerOpen(false);
  };

  const handleOpenAgentSettingsDrawer = () => {
    setIsAgentSettingsDrawerOpen(true);
  };

  const handleCloseAgentSettingsDrawer = () => {
    setIsAgentSettingsDrawerOpen(false);
  };

  const handleMcpGithubToggleChange = (enabled: boolean) => {
    setIsMcpGithubEnabled(enabled);
    setMcpGithubCheckStatus('idle');
  };

  const handleMcpGithubBaseUrlChange = (nextValue: string) => {
    setMcpGithubBaseUrl(nextValue);
    setMcpGithubCheckStatus('idle');
  };

  const handleMcpGithubUsernameChange = (nextValue: string) => {
    setMcpGithubUsername(nextValue);
  };

  const loadRagIndexes = async () => {
    if (!isRagBaseUrlValid) {
      return;
    }

    setRagIndexesStatus('loading');
    setRagIndexesErrorMessage(null);

    try {
      const indexes = await ragApi.listIndexes(normalizedRagBaseUrl);
      setRagIndexes(indexes);
      setRagSelectedIndexIds((previous) => previous.filter((indexId) => indexes.some((item) => item.indexId === indexId)));
      setRagIndexesStatus('success');
    } catch (error) {
      setRagIndexesStatus('error');
      setRagIndexesErrorMessage(normalizeError(error));
    }
  };

  useEffect(() => {
    if (activeAgentSettingsTab !== 'rag' || !isRagEnabled || !isRagBaseUrlValid) {
      return;
    }

    void loadRagIndexes();
  }, [activeAgentSettingsTab, isRagEnabled, isRagBaseUrlValid, normalizedRagBaseUrl]);

  const handleRagToggleChange = (enabled: boolean) => {
    setIsRagEnabled(enabled);
    setRagFileActionStatus('idle');
    setRagFileActionMessage(null);
  };

  const handleRagBaseUrlChange = (nextValue: string) => {
    setRagBaseUrl(nextValue);
    setRagCheckStatus('idle');
    setRagCheckMessage(null);
    setRagIndexesStatus('idle');
    setRagIndexesErrorMessage(null);
  };

  const handleRagFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setRagSelectedFile(file);
    setRagFileActionStatus('idle');
    setRagFileActionMessage(null);
  };

  const handleRagStrategyChange = (event: SelectChangeEvent) => {
    const nextValue = event.target.value;
    if (nextValue !== 'fixed' && nextValue !== 'structured') {
      return;
    }
    setRagStrategy(nextValue);
  };

  const handleRagMinScoreChange = (nextValue: string) => {
    if (nextValue.trim() === '') {
      setRagMinScoreInput(nextValue);
      return;
    }

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      return;
    }

    if (parsed < 0 || parsed > 1) {
      return;
    }
    setRagMinScoreInput(nextValue);
  };

  const handleRagMinScoreBlur = () => {
    const parsed = Number(ragMinScoreInput);
    if (!Number.isFinite(parsed)) {
      setRagMinScoreInput(String(DEFAULT_RAG_MIN_SCORE));
      return;
    }

    const normalized = Math.min(1, Math.max(0, parsed));
    setRagMinScoreInput(String(Number(normalized.toFixed(2))));
  };

  const handleRagTopKChange = (nextValue: string) => {
    if (nextValue.trim() === '') {
      setRagTopKInput(nextValue);
      return;
    }

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setRagTopKInput(String(parsed));
  };

  const handleRagTopKBlur = () => {
    setRagTopKInput(String(DEFAULT_RAG_TOP_K));
  };

  const handleToggleRagIndex = (indexId: string, checked: boolean) => {
    setRagSelectedIndexIds((previous) => {
      if (checked) {
        if (previous.includes(indexId)) {
          return previous;
        }
        return [...previous, indexId];
      }

      return previous.filter((item) => item !== indexId);
    });
  };

  const handleSelectAllRagIndexes = () => {
    const allIndexIds = ragIndexes.map((item) => item.indexId);
    if (allIndexIds.length === 0) {
      setRagSelectedIndexIds([]);
      return;
    }

    setRagSelectedIndexIds((previous) => (previous.length === allIndexIds.length ? [] : allIndexIds));
  };

  const handleCheckRagConnection = async () => {
    if (!isRagBaseUrlValid) {
      return;
    }

    setRagCheckStatus('checking');
    setRagCheckMessage(null);

    try {
      const payload = await ragApi.checkHealth(normalizedRagBaseUrl);
      if (!isRagHealthy(payload)) {
        setRagCheckStatus('error');
        setRagCheckMessage('RAG вернул неожиданный health-ответ.');
        return;
      }

      if (!isRagEmbeddingsConfigured(payload)) {
        setRagCheckStatus('success');
        setRagCheckMessage('Соединение с RAG есть, но embeddings не настроены (PROXYAPI_OPENAI_API_KEY пуст).');
        return;
      }

      setRagCheckStatus('success');
      setRagCheckMessage('RAG доступен и embeddings настроены.');
    } catch (error) {
      setRagCheckStatus('error');
      setRagCheckMessage(normalizeError(error));
    }
  };

  const handleBuildRagIndex = async () => {
    if (!isRagBaseUrlValid || !ragSelectedFile) {
      return;
    }

    setRagFileActionStatus('processing');
    setRagFileActionMessage(null);

    try {
      const uploadResult = await ragApi.uploadFile(normalizedRagBaseUrl, ragSelectedFile);
      const buildResult = await ragApi.buildIndex(normalizedRagBaseUrl, {
        source: 'local-file',
        filePath: uploadResult.filePath,
        title: ragSelectedFile.name,
        strategy: ragStrategy,
      });

      setRagFileActionStatus('success');
      setRagFileActionMessage(`Индекс создан: ${buildResult.indexId} (чанков: ${buildResult.chunksCount}).`);
      setRagSelectedFile(null);
      if (ragFileInputRef.current) {
        ragFileInputRef.current.value = '';
      }
      await loadRagIndexes();
    } catch (error) {
      setRagFileActionStatus('error');
      setRagFileActionMessage(normalizeError(error));
    }
  };

  const handleDeleteRagIndex = async (indexId: string) => {
    if (!isRagBaseUrlValid || !indexId) {
      return;
    }

    setRagDeletingIndexId(indexId);
    setRagFileActionMessage(null);

    try {
      await ragApi.deleteIndex(normalizedRagBaseUrl, indexId);
      setRagIndexes((prev) => prev.filter((item) => item.indexId !== indexId));
      setRagSelectedIndexIds((previous) => previous.filter((item) => item !== indexId));
      setRagFileActionStatus('success');
      setRagFileActionMessage(`Индекс удален: ${indexId}`);
    } catch (error) {
      setRagFileActionStatus('error');
      setRagFileActionMessage(normalizeError(error));
    } finally {
      setRagDeletingIndexId(null);
    }
  };

  const handleCheckMcpGithubConnection = async () => {
    if (!mcpGithubHealthUrl) {
      return;
    }

    setMcpGithubCheckStatus('checking');
    try {
      const response = await fetch(mcpGithubHealthUrl, { method: 'GET' });
      if (!response.ok) {
        throw new Error('HTTP request failed');
      }

      const payload = (await response.json()) as unknown;
      setMcpGithubCheckStatus(isMcpGithubConnected(payload) ? 'success' : 'error');
    } catch {
      setMcpGithubCheckStatus('error');
    }
  };

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Чат
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            <Button variant="outlined" color="inherit" onClick={handleOpenAgentSettingsDrawer}>
              Настройка агента
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleOpenMemoryDrawer}>
              Память
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => createNewChat()} disabled={isLoading}>
              Создать чат
            </Button>
          </Stack>
        </Stack>

        <Accordion variant="outlined" disableGutters sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="chat-settings-content" id="chat-settings-header">
            <Typography variant="subtitle1" fontWeight={600}>
              Настройки чата
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <FormControl>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Профиль
                </Typography>
                <FormControl size="small" disabled={!isCurrentChatEmpty || isLoading}>
                  <InputLabel id="chat-profile-select-label">Профиль пользователя</InputLabel>
                  <Select
                    labelId="chat-profile-select-label"
                    label="Профиль пользователя"
                    value={currentChatProfile}
                    onChange={handleProfileChange}
                  >
                    {USER_PROFILE_OPTIONS.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Модель
                </Typography>
                <FormControl size="small" disabled={isLoading}>
                  <InputLabel id="chat-model-select-label">LLM модель</InputLabel>
                  <Select labelId="chat-model-select-label" label="LLM модель" value={model} onChange={handleModelChange}>
                    {CHAT_MODEL_OPTIONS.map((modelOption) => (
                      <MenuItem key={modelOption} value={modelOption}>
                        {modelOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Стратегии
                </Typography>
                <RadioGroup
                  value={currentChatStrategy}
                  onChange={(_, value) => handleStrategyChange(value as ChatContextStrategy)}
                  sx={{ opacity: isCurrentChatEmpty ? 1 : 0.75 }}
                >
                  <FormControlLabel
                    value="strategy-1"
                    control={<Radio />}
                    disabled={!isCurrentChatEmpty || isLoading}
                    label="Стратегия 1: Sliding Window"
                  />
                  <FormControlLabel
                    value="strategy-2"
                    control={<Radio />}
                    disabled={!isCurrentChatEmpty || isLoading}
                    label="Стратегия 2: Sticky Facts / Key-Value Memory"
                  />
                  <FormControlLabel
                    value="strategy-3"
                    control={<Radio />}
                    disabled={!isCurrentChatEmpty || isLoading}
                    label="Стратегия 3: Branching (ветки диалога)"
                  />
                </RadioGroup>
              </FormControl>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                  Настройки стратегии
                </Typography>
                {currentChatStrategy === 'strategy-1' ? (
                  <TextField
                    label="Последние N сообщений"
                    value={strategy1WindowInput}
                    onChange={(event) => handleStrategy1WindowInputChange(event.target.value)}
                    onBlur={handleStrategy1WindowBlur}
                    size="small"
                    disabled={!isCurrentChatEmpty || isLoading}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 1 }}
                    helperText="Только положительные целые числа. По умолчанию: 10."
                  />
                ) : currentChatStrategy === 'strategy-2' ? (
                  <TextField
                    label="Последние N сообщений"
                    value={strategy2WindowInput}
                    onChange={(event) => handleStrategy2WindowInputChange(event.target.value)}
                    onBlur={handleStrategy2WindowBlur}
                    size="small"
                    disabled={!isCurrentChatEmpty || isLoading}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
                    helperText="Только целые неотрицательные числа. По умолчанию: 10."
                  />
                ) : (
                  <Button variant="outlined" onClick={createBranchFromCurrentChat} disabled={!canCreateBranchFromCurrentChat}>
                    Создать новую ветку из текущего чата
                  </Button>
                )}
              </Box>
              <FormControl>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Задача
                </Typography>
                <FormControl size="small" disabled={!isCurrentChatEmpty || isLoading}>
                  <InputLabel id="chat-task-select-label">Задача</InputLabel>
                  <Select labelId="chat-task-select-label" label="Задача" value={currentChatTask} onChange={handleTaskChange}>
                    {CHAT_TASK_OPTIONS.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FormControl>
              {shouldShowTaskInvariants ? (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    Инварианты задачи
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentTaskInvariantsEnabled}
                        onChange={(event) => setCurrentTaskInvariantsEnabled(event.target.checked)}
                        disabled={!isCurrentChatEmpty || isLoading}
                      />
                    }
                    label="Включить инварианты"
                  />
                  <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                    {taskInvariants.map((invariant) => (
                      <Paper key={invariant.id} variant="outlined" sx={{ p: 1.25, backgroundColor: '#fbfcff' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {invariant.questionText}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invariant.ruleText}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: 'stretch',
          }}
        >
          <Stack spacing={2} sx={{ width: { xs: '100%', md: '33.33%' }, height: chatPaneHeight }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#fcfdfd',
                height: '50%',
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h6" component="h2" fontWeight={700}>
                  Ваши чаты
                </Typography>
                {!isCurrentChatEmpty ? (
                  <Typography variant="caption" color="text.secondary">
                    Для непустого чата стратегия доступна только для просмотра.
                  </Typography>
                ) : null}
                {chatHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    История пока пуста.
                  </Typography>
                ) : null}

                {chatHistory.map((chat) => (
                  <Box
                    key={chat.id}
                    onClick={() => switchToHistoryChat(chat.id)}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: chat.id === currentChatId ? '#e0e0e0' : 'transparent',
                      '&:hover': {
                        backgroundColor: chat.id === currentChatId ? '#d6d6d6' : 'action.hover',
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: chat.id === currentChatId ? '#424242' : 'text.primary',
                        fontWeight: chat.id === currentChatId ? 700 : 500,
                      }}
                    >
                      {formatHistoryTitle(chat)}
                    </Typography>
                    <IconButton size="small" sx={{ p: 0.35 }} onClick={(event) => handleOpenHistoryMenu(event, chat.id)}>
                      <MoreHorizIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Box sx={{ mt: 1.25 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>
                      Запланированные события
                    </Typography>
                    <IconButton size="small" onClick={() => setIsScheduledListCollapsed((value) => !value)}>
                      <ExpandMoreIcon
                        sx={{
                          transform: isScheduledListCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 120ms linear',
                        }}
                      />
                    </IconButton>
                  </Stack>

                  {!isScheduledListCollapsed ? (
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {safeScheduledEvents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Событий пока нет.
                        </Typography>
                      ) : null}
                      {safeScheduledEvents.map((event) => (
                        <Box
                          key={event.id}
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            backgroundColor: 'transparent',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              flexGrow: 1,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              color: 'text.primary',
                              fontWeight: 500,
                            }}
                          >
                            {formatScheduledEventTitle(event)}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ p: 0.35 }}
                            onClick={() => {
                              if (window.confirm('Удалить запланированное действие?')) {
                                deleteScheduledEvent(event.id);
                              }
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#fcfdfd',
                height: '50%',
                minHeight: 0,
                overflowY: 'auto',
              }}
            >
                <Stack spacing={2}>
                <Stack spacing={1.25}>
                  <Typography variant="h6" component="h2" fontWeight={700}>
                    Статистика
                  </Typography>
                  <Typography variant="body2">Токены запроса: {promptTokens}</Typography>
                  <Typography variant="body2">Токены ответа: {completionTokens}</Typography>
                  <Typography variant="body2">Токены всего: {totalTokens}</Typography>
                  <Typography variant="body2">Общая стоимость: {formatRubles(totalCost)}</Typography>
                  <Typography variant="body2">Модель (текущий чат): {model}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={2} sx={{ width: { xs: '100%', md: '66.67%' } }}>
            <Paper
              variant="outlined"
              sx={{
                height: chatPaneHeight,
                p: 1.5,
                overflowY: 'auto',
                backgroundColor: '#fafcfc',
              }}
            >
              <Stack spacing={1.5}>
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Диалог пока пуст. Отправьте первое сообщение.
                  </Typography>
                ) : null}

                {messages.map((message) => {
                  const isUser = message.role === 'user';
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: { xs: '90%', sm: '80%' },
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: isUser ? 'primary.main' : 'grey.100',
                        color: isUser ? 'primary.contrastText' : 'text.primary',
                        whiteSpace: isUser ? 'pre-wrap' : 'normal',
                        wordBreak: 'break-word',
                      }}
                    >
                      {isUser ? (
                        <Typography variant="body2">{message.content}</Typography>
                      ) : (
                        <Stack spacing={1}>
                          <MarkdownMessage content={message.content} />
                          {message.rag?.sources.length ? (
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                backgroundColor: '#f8fbff',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Источники RAG
                              </Typography>
                              <Stack spacing={0.5}>
                                {message.rag.sources.map((source, sourceIndex) => (
                                  <Typography key={formatRagSourceKey(source, sourceIndex)} variant="caption" sx={{ display: 'block' }}>
                                    file: {source.file || '-'} | section: {source.section || '-'} | chunk_id: {source.chunkId || '-'} | indexId:{' '}
                                    {source.indexId || '-'}
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          ) : null}
                        </Stack>
                      )}
                    </Box>
                  );
                })}

                {isLoading && showThinkingLoader ? (
                  <Box
                    sx={{
                      alignSelf: 'flex-start',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'grey.100',
                      color: 'text.secondary',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={14} />
                      <Typography variant="body2">Думаю над ответом...</Typography>
                    </Stack>
                  </Box>
                ) : null}

                {limitNotice ? (
                  <Box
                    sx={{
                      alignSelf: 'center',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: 'warning.light',
                      color: 'warning.contrastText',
                    }}
                  >
                    <Typography variant="body2">{limitNotice}</Typography>
                  </Box>
                ) : null}
                <div ref={endOfMessagesRef} />
              </Stack>
            </Paper>

            <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1} onSubmit={handleSubmit}>
              <TextField
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Введите сообщение..."
                autoComplete="off"
                disabled={isLoading || isLimitReached}
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                helperText={`Пользовательских сообщений: ${userMessageCount}/${USER_MESSAGE_LIMIT}`}
              />
              <Button type="submit" variant="contained" disabled={isSubmitDisabled} sx={{ minWidth: 140 }}>
                Отправить
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {ragWarningMessage ? <Alert severity="warning">{ragWarningMessage}</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      </Stack>

      <Menu anchorEl={historyMenuAnchor} open={Boolean(historyMenuAnchor)} onClose={handleCloseHistoryMenu}>
        <MenuItem onClick={handleDeleteHistoryChat}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      <Drawer
        anchor="right"
        open={isMemoryDrawerOpen}
        onClose={handleCloseMemoryDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100vw', sm: '66.67vw' },
            maxWidth: '100%',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Память
            </Typography>
            <IconButton aria-label="Закрыть память" onClick={handleCloseMemoryDrawer}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Tabs
            value={activeMemoryTab}
            onChange={(_, value: MemoryTab) => setActiveMemoryTab(value)}
            variant="fullWidth"
            sx={{ px: 2 }}
          >
            <Tab value="short-term" label="краткосрочная" />
            <Tab value="working" label="рабочая" />
            <Tab value="long-term" label="долговременная" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {memoryErrorMessage ? (
              <Alert severity="warning" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {memoryErrorMessage}
              </Alert>
            ) : null}

            {activeMemoryTab === 'short-term' ? (
              <Stack spacing={1.25}>
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    В текущем чате пока нет сообщений.
                  </Typography>
                ) : null}
                {messages.map((message) => (
                  <Box
                    key={`memory-${message.id}`}
                    sx={{
                      borderLeft: '3px solid',
                      borderColor: 'divider',
                      pl: 1.25,
                      py: 0.25,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      <Typography component="span" variant="body2" fontWeight={700}>
                        {message.role === 'user' ? 'Пользователь: ' : 'Ассистент: '}
                      </Typography>
                      {message.content}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}

            {activeMemoryTab === 'working' ? (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafcfc' }}>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    m: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(workingMemory ?? {}, null, 2)}
                </Typography>
              </Paper>
            ) : null}

            {activeMemoryTab === 'long-term' ? (
              <Stack spacing={1.25}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outlined" color="inherit" onClick={clearLongTermMemory}>
                    Очистить долговременную память
                  </Button>
                </Box>
                {longTermMemory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Долговременная память пока пуста.
                  </Typography>
                ) : null}
                {longTermMemory.map((item) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderColor: '#00acc1',
                    }}
                  >
                    <Stack spacing={0.75}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {item.kind} / confidence: {item.confidence.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">{item.text}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={isAgentSettingsDrawerOpen}
        onClose={handleCloseAgentSettingsDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100vw', sm: '66.67vw' },
            maxWidth: '100%',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Настройка агента
            </Typography>
            <IconButton aria-label="Закрыть настройки агента" onClick={handleCloseAgentSettingsDrawer}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Tabs
            value={activeAgentSettingsTab}
            onChange={(_, value: AgentSettingsTab) => setActiveAgentSettingsTab(value)}
            variant="fullWidth"
            sx={{ px: 2 }}
          >
            <Tab value="mcp" label="MCP" />
            <Tab value="rag" label="RAG" />
          </Tabs>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {activeAgentSettingsTab === 'mcp' ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  MCP
                </Typography>
                <FormControlLabel
                  control={<Switch checked={isMcpGithubEnabled} onChange={(event) => handleMcpGithubToggleChange(event.target.checked)} />}
                  label="MCP github"
                />

                {isMcpGithubEnabled ? (
                  <Stack spacing={1}>
                    <TextField
                      label="Адрес mcp для github"
                      value={mcpGithubBaseUrl}
                      onChange={(event) => handleMcpGithubBaseUrlChange(event.target.value)}
                      placeholder="http://localhost:3001/mcp"
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="GitHub username"
                      value={mcpGithubUsername}
                      onChange={(event) => handleMcpGithubUsernameChange(event.target.value)}
                      placeholder="mvk85"
                      size="small"
                      fullWidth
                    />

                    {normalizedMcpGithubBaseUrl.length > 0 && !isMcpGithubBaseUrlValid ? (
                      <Alert severity="warning">Введите корректный URL (допускается localhost).</Alert>
                    ) : null}

                    {normalizedMcpGithubBaseUrl.length > 0 && isMcpGithubBaseUrlValid ? (
                      <Button
                        variant="outlined"
                        onClick={handleCheckMcpGithubConnection}
                        disabled={mcpGithubCheckStatus === 'checking'}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {mcpGithubCheckStatus === 'checking' ? 'Проверяем...' : 'Проверить соединение'}
                      </Button>
                    ) : null}

                    {mcpGithubCheckStatus === 'success' ? <Alert severity="success">mcp успешно подключен</Alert> : null}
                    {mcpGithubCheckStatus === 'error' ? <Alert severity="error">Ошибка подключения</Alert> : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            {activeAgentSettingsTab === 'rag' ? (
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  RAG
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Проверка соединения с RAG
                  </Typography>
                  <TextField
                    label="Адрес RAG backend"
                    value={ragBaseUrl}
                    onChange={(event) => handleRagBaseUrlChange(event.target.value)}
                    placeholder="http://localhost:5001"
                    size="small"
                    fullWidth
                  />

                  {normalizedRagBaseUrl.length > 0 && !isRagBaseUrlValid ? (
                    <Alert severity="warning">Введите корректный URL (допускается localhost).</Alert>
                  ) : null}

                  {normalizedRagBaseUrl.length > 0 && isRagBaseUrlValid ? (
                    <Button
                      variant="outlined"
                      onClick={handleCheckRagConnection}
                      disabled={ragCheckStatus === 'checking'}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {ragCheckStatus === 'checking' ? 'Проверяем...' : 'Проверить соединение'}
                    </Button>
                  ) : null}

                  {ragCheckStatus === 'success' ? <Alert severity="success">Соединение с RAG успешно.</Alert> : null}
                  {ragCheckStatus === 'error' ? <Alert severity="error">Ошибка подключения к RAG.</Alert> : null}
                  {ragCheckMessage ? (
                    <Alert severity={ragCheckStatus === 'error' ? 'error' : ragCheckMessage.includes('не настроены') ? 'warning' : 'info'}>
                      {ragCheckMessage}
                    </Alert>
                  ) : null}
                </Stack>

                <Box sx={{ pt: 2, mt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={1.5}>
                    <FormControlLabel
                      control={<Switch checked={isRagEnabled} onChange={(event) => handleRagToggleChange(event.target.checked)} />}
                      label="Включить RAG"
                    />

                    {isRagEnabled ? (
                      <Stack spacing={1.5}>
                        <FormControl size="small" sx={{ maxWidth: 280 }}>
                          <InputLabel id="rag-strategy-select-label">Стратегия индексации</InputLabel>
                          <Select
                            labelId="rag-strategy-select-label"
                            label="Стратегия индексации"
                            value={ragStrategy}
                            onChange={handleRagStrategyChange}
                          >
                            <MenuItem value="structured">structured</MenuItem>
                            <MenuItem value="fixed">fixed</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          label="Минимальная релевантность (minScore)"
                          value={ragMinScoreInput}
                          onChange={(event) => handleRagMinScoreChange(event.target.value)}
                          onBlur={handleRagMinScoreBlur}
                          size="small"
                          sx={{ maxWidth: 320 }}
                          inputProps={{ inputMode: 'decimal', min: 0, max: 1, step: 0.01 }}
                          helperText="Диапазон 0..1, рекомендуем 0.35..0.5."
                        />

                        <TextField
                          label="TopK (фиксировано)"
                          value={ragTopKInput}
                          onChange={(event) => handleRagTopKChange(event.target.value)}
                          onBlur={handleRagTopKBlur}
                          size="small"
                          sx={{ maxWidth: 220 }}
                          inputProps={{ inputMode: 'numeric' }}
                          helperText="Для retrieval используется значение 8."
                        />

                        <Box>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              Индексы для retrieval
                            </Typography>
                            <Button variant="text" size="small" onClick={handleSelectAllRagIndexes} disabled={ragIndexes.length === 0}>
                              {isAllRagIndexesSelected ? 'Снять выбор' : 'Выбрать все'}
                            </Button>
                          </Stack>

                          {ragIndexesStatus === 'loading' ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                Загружаем индексы...
                              </Typography>
                            </Stack>
                          ) : null}

                          {ragIndexesStatus !== 'loading' && ragIndexes.length > 0 ? (
                            <Stack spacing={0.5}>
                              {ragIndexes.map((index) => (
                                <FormControlLabel
                                  key={`select-${index.indexId}`}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={ragSelectedIndexIds.includes(index.indexId)}
                                      onChange={(event) => handleToggleRagIndex(index.indexId, event.target.checked)}
                                    />
                                  }
                                  label={index.indexMeta.title || index.indexId}
                                />
                              ))}
                            </Stack>
                          ) : null}

                          {ragIndexesStatus !== 'loading' && ragIndexes.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Индексов пока нет, retrieval использовать нечего.
                            </Typography>
                          ) : null}
                        </Box>

                        <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
                          Выбрать файл (.json, .txt, .md)
                          <input
                            ref={ragFileInputRef}
                            type="file"
                            accept=".json,.txt,.md,text/plain,application/json,text/markdown"
                            hidden
                            onChange={handleRagFileChange}
                          />
                        </Button>
                        {ragSelectedFile ? <Typography variant="body2">Выбран файл: {ragSelectedFile.name}</Typography> : null}

                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            onClick={handleBuildRagIndex}
                            disabled={!ragSelectedFile || !isRagBaseUrlValid || ragFileActionStatus === 'processing'}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            {ragFileActionStatus === 'processing' ? 'Обрабатываем...' : 'Обработать в RAG'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => void loadRagIndexes()}
                            disabled={!isRagBaseUrlValid || ragIndexesStatus === 'loading'}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Обновить список
                          </Button>
                        </Stack>

                        {ragFileActionMessage ? (
                          <Alert severity={ragFileActionStatus === 'error' ? 'error' : 'success'}>{ragFileActionMessage}</Alert>
                        ) : null}

                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                            Индексы в RAG
                          </Typography>

                          {ragIndexesStatus === 'loading' ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                Загружаем список индексов...
                              </Typography>
                            </Stack>
                          ) : null}

                          {ragIndexesStatus === 'error' && ragIndexesErrorMessage ? (
                            <Alert severity="error" sx={{ mb: 1 }}>
                              {ragIndexesErrorMessage}
                            </Alert>
                          ) : null}

                          {ragIndexesStatus !== 'loading' && ragIndexes.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              Индексов пока нет.
                            </Typography>
                          ) : null}

                          <Stack spacing={0.75}>
                            {ragIndexes.map((index) => (
                              <Paper
                                key={index.indexId}
                                variant="outlined"
                                sx={{ px: 1.25, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {index.indexMeta.title || index.indexId}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {index.indexMeta.strategy || 'fixed'} • чанков: {index.indexMeta.chunksCount}
                                  </Typography>
                                  {index.indexMeta.createdAt ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {formatDateTime(index.indexMeta.createdAt)}
                                    </Typography>
                                  ) : null}
                                </Box>
                                <IconButton
                                  aria-label={`Удалить индекс ${index.indexId}`}
                                  size="small"
                                  onClick={() => void handleDeleteRagIndex(index.indexId)}
                                  disabled={ragDeletingIndexId === index.indexId}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    ) : null}
                  </Stack>
                </Box>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Drawer>
    </PageContainer>
  );
}
