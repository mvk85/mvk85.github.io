import { Alert, Paper, Typography } from '@mui/material';

type ResultPanelProps = {
  status: 'idle' | 'loading' | 'success' | 'error';
  resultText: string | null;
  errorMessage: string | null;
};

export function ResultPanel({ status, resultText, errorMessage }: ResultPanelProps) {
  if (status === 'idle') {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Введите одно слово и нажмите "Поиск".
        </Typography>
      </Paper>
    );
  }

  if (status === 'loading') {
    return <Alert severity="info">Отправляем запрос...</Alert>;
  }

  if (status === 'error') {
    return <Alert severity="error">{errorMessage ?? 'Произошла неизвестная ошибка.'}</Alert>;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Ответ сервера:
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {resultText}
      </Typography>
    </Paper>
  );
}
