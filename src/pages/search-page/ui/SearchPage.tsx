import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
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

import type { ChatContextStrategy, ChatSession } from '@/entities/chat/model/types';
import { USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { CHAT_TASK_OPTIONS, getTaskInvariants } from '@/entities/chat/lib/taskConfig';
import { MarkdownMessage } from '@/entities/chat-response/ui/MarkdownMessage';
import { useChat } from '@/features/chat/model/useChat';
import { PageContainer } from '@/shared/ui/PageContainer';
import { USER_PROFILE_OPTIONS } from '@/entities/profile/lib/profileConfig';
import { CHAT_MODEL_OPTIONS, type ChatModel } from '@/shared/config/llmModels';
import { loadMcpGithubSettings, saveMcpGithubSettings } from '@/processes/chat-agent/lib/mcpGithubSettings';

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

type MemoryTab = 'short-term' | 'working' | 'long-term';
type AgentSettingsTab = 'mcp';

type McpGithubHealthResponse = {
  status?: {
    connected?: unknown;
  };
};

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

export function SearchPage() {
  const initialMcpGithubSettings = loadMcpGithubSettings();
  const [strategy1WindowInput, setStrategy1WindowInput] = useState('10');
  const [strategy2WindowInput, setStrategy2WindowInput] = useState('10');
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [historyMenuChatId, setHistoryMenuChatId] = useState<string | null>(null);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState(false);
  const [activeMemoryTab, setActiveMemoryTab] = useState<MemoryTab>('short-term');
  const [isAgentSettingsDrawerOpen, setIsAgentSettingsDrawerOpen] = useState(false);
  const [activeAgentSettingsTab, setActiveAgentSettingsTab] = useState<AgentSettingsTab>('mcp');
  const [isMcpGithubEnabled, setIsMcpGithubEnabled] = useState(initialMcpGithubSettings.enabled);
  const [mcpGithubBaseUrl, setMcpGithubBaseUrl] = useState(initialMcpGithubSettings.baseUrl);
  const [mcpGithubUsername, setMcpGithubUsername] = useState(initialMcpGithubSettings.username);
  const [mcpGithubCheckStatus, setMcpGithubCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');

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
    deleteHistoryChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading,
    limitNotice,
    messages,
    model,
    promptTokens,
    completionTokens,
    clearLongTermMemory,
    totalTokens,
    longTermMemory,
    memoryErrorMessage,
    sendUserMessage,
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

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage();
  };

  const isSubmitDisabled = isLoading || isLimitReached || inputValue.trim().length === 0;
  const isCurrentChatEmpty = messages.length === 0;
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
                      {isUser ? <Typography variant="body2">{message.content}</Typography> : <MarkdownMessage content={message.content} />}
                    </Box>
                  );
                })}

                {isLoading ? (
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
          </Box>
        </Stack>
      </Drawer>
    </PageContainer>
  );
}
