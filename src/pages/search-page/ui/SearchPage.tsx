import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
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
  FormControl,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import type { ChatContextStrategy, ChatSession } from '@/entities/chat/model/types';
import { USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { MarkdownMessage } from '@/entities/chat-response/ui/MarkdownMessage';
import { useChat } from '@/features/chat/model/useChat';
import { PageContainer } from '@/shared/ui/PageContainer';

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

export function SearchPage() {
  const [strategy1WindowInput, setStrategy1WindowInput] = useState('10');
  const [strategy2WindowInput, setStrategy2WindowInput] = useState('10');
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [historyMenuChatId, setHistoryMenuChatId] = useState<string | null>(null);

  const {
    canCreateBranchFromCurrentChat,
    chatHistory,
    createBranchFromCurrentChat,
    createNewChat,
    currentChatStrategy,
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
    totalTokens,
    sendUserMessage,
    setCurrentChatStrategy,
    setStrategy1WindowSize,
    setStrategy2WindowSize,
    setInputValue,
    switchToHistoryChat,
    totalCost,
    userMessageCount,
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage();
  };

  const isSubmitDisabled = isLoading || isLimitReached || inputValue.trim().length === 0;
  const isCurrentChatEmpty = messages.length === 0;

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

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Чат
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => createNewChat()}
            disabled={isLoading}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            Создать чат
          </Button>
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
    </PageContainer>
  );
}
