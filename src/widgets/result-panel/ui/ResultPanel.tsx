import { Alert, Paper, Stack, Typography } from '@mui/material';

import type { ChatUiMessage } from '@/features/submit-search/model/useSubmitSearch';

type ResultPanelProps = {
  messages: ChatUiMessage[];
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
};

export function ResultPanel({ messages, status, errorMessage }: ResultPanelProps) {
  return (
    <Stack spacing={1.5}>
      {messages.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Чат готовится к началу диалога...
          </Typography>
        </Paper>
      ) : (
        messages.map((message) => {
          const isUser = message.role === 'user';
          const isSystem = message.role === 'system';

          return (
            <Paper
              key={message.id}
              variant="outlined"
              sx={{
                p: 1.5,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                bgcolor: isUser ? 'primary.light' : isSystem ? 'warning.light' : 'background.paper',
                maxWidth: '85%',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {isUser ? 'Вы' : isSystem ? 'Система' : 'Ассистент'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
            </Paper>
          );
        })
      )}

      {status === 'loading' ? <Alert severity="info">Ожидаем ответ...</Alert> : null}
      {status === 'error' ? <Alert severity="error">{errorMessage ?? 'Произошла неизвестная ошибка.'}</Alert> : null}
    </Stack>
  );
}
