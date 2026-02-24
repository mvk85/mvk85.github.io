import { useEffect, useRef, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';

import { USER_MESSAGE_LIMIT } from '@/entities/chat/lib/constants';
import { useChat } from '@/features/chat/model/useChat';
import { PageContainer } from '@/shared/ui/PageContainer';

export function SearchPage() {
  const { clearChat, errorMessage, inputValue, isLimitReached, isLoading, limitNotice, messages, sendUserMessage, setInputValue, userMessageCount } =
    useChat();
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isLoading, messages, limitNotice]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendUserMessage();
  };

  const isSubmitDisabled = isLoading || isLimitReached || inputValue.trim().length === 0;

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

        <Paper
          variant="outlined"
          sx={{
            height: { xs: '58vh', sm: '62vh' },
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

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Stack component="form" direction={{ xs: 'column', sm: 'row' }} spacing={1} onSubmit={handleSubmit}>
          <TextField
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
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
    </PageContainer>
  );
}
