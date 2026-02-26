import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';

import { USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { useChat } from '@/features/chat/model/useChat';
import { PageContainer } from '@/shared/ui/PageContainer';

function formatRubles(value: number): string {
  return `${value.toFixed(6).replace('.', ',')} ₽`;
}

export function SearchPage() {
  const {
    clearChat,
    errorMessage,
    inputValue,
    isLimitReached,
    isLoading,
    limitNotice,
    lastResponseStats,
    messages,
    sendUserMessage,
    setInputValue,
    statsItems,
    totalCost,
    userMessageCount,
  } = useChat();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading, messages, limitNotice]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage();
  };

  const isSubmitDisabled = isLoading || isLimitReached || inputValue.trim().length === 0;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !event.ctrlKey) {
      return;
    }

    event.preventDefault();
    if (!isSubmitDisabled) {
      void sendUserMessage();
    }
  };

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Философский чат
          </Typography>
          <Button variant="outlined" color="inherit" onClick={clearChat}>
            Очистить чат
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: 'stretch',
          }}
        >
          <Stack spacing={2} sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f6faf9' }}>
              <Stack spacing={1.25}>
                <Typography variant="h6" component="h2" fontWeight={700}>
                  Статистика
                </Typography>
                <Typography variant="body2">Модель: {lastResponseStats.model ?? '—'}</Typography>
                <Typography variant="body2">Токены запроса: {lastResponseStats.promptTokens}</Typography>
                <Typography variant="body2">Токены ответа: {lastResponseStats.completionTokens}</Typography>
                <Typography variant="body2">Токены всего: {lastResponseStats.totalTokens}</Typography>
                <Typography variant="body2">
                  Стоимость последнего запроса:{' '}
                  {lastResponseStats.requestCost === null ? '—' : formatRubles(lastResponseStats.requestCost)}
                </Typography>
                <Typography variant="body2">Общая стоимость: {formatRubles(totalCost)}</Typography>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#fcfdfd',
                minHeight: { xs: 220, md: 420 },
                maxHeight: { xs: 320, md: 520 },
                overflowY: 'auto',
              }}
            >
              <Stack spacing={1.25}>
                <Typography variant="h6" component="h2" fontWeight={700}>
                  По ответам
                </Typography>
                {statsItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Пока нет данных по ответам.
                  </Typography>
                ) : null}
                {statsItems.map((item, index) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.25, backgroundColor: '#ffffff' }}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        Ответ #{index + 1}
                      </Typography>
                      <Typography variant="body2">Токены запроса: {item.promptTokens}</Typography>
                      <Typography variant="body2">Токены ответа: {item.completionTokens}</Typography>
                      <Typography variant="body2">Токены всего: {item.totalTokens}</Typography>
                      <Typography variant="body2">Стоимость: {formatRubles(item.requestCost)}</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={2} sx={{ width: { xs: '100%', md: '66.67%' } }}>
            <Paper
              variant="outlined"
              sx={{
                height: { xs: '50vh', sm: '58vh', md: '62vh' },
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

                {messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  return (
                    <Box
                      key={`${message.role}-${index}`}
                      sx={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: { xs: '90%', sm: '80%' },
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: isUser ? 'primary.main' : 'grey.100',
                        color: isUser ? 'primary.contrastText' : 'text.primary',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      <Typography variant="body2">{message.content}</Typography>
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
    </PageContainer>
  );
}
