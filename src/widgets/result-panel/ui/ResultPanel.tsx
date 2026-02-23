import {
  Alert,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { ComparisonRow } from '@/features/compare-models/model/useCompareModels';

type ResultPanelProps = {
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
  progressMessage: string | null;
  rows: ComparisonRow[];
};

function formatRub(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 20 }).format(value);
}

function formatSec(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

export function ResultPanel({ status, errorMessage, progressMessage, rows }: ResultPanelProps) {
  return (
    <Stack spacing={1.5}>
      {rows.length === 0 && status === 'idle' ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Введите текст запроса и нажмите «Отправить». Запрос будет выполнен последовательно для 3 моделей.
          </Typography>
        </Paper>
      ) : null}

      {rows.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table
            size="small"
            aria-label="Сравнение моделей"
            sx={{
              minWidth: { xs: 900, md: 0 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>Модель</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>
                  Стоимость, ₽
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>
                  Время, сек
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 180 }}>
                  Токенов в запросе
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 170 }}>
                  Токенов в ответе
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>
                  Всего токенов
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.model} hover>
                  <TableCell>{row.model}</TableCell>
                  <TableCell align="right">{formatRub(row.costRub)}</TableCell>
                  <TableCell align="right">{formatSec(row.responseTimeSec)}</TableCell>
                  <TableCell align="right">{row.promptTokens}</TableCell>
                  <TableCell align="right">{row.completionTokens}</TableCell>
                  <TableCell align="right">{row.totalTokens}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      {rows.length > 0 ? (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Ответы моделей</Typography>
          {rows.map((row) => (
            <Paper key={`${row.model}-response`} variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {row.model}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {row.responseText}
              </Typography>
            </Paper>
          ))}
        </Stack>
      ) : null}

      {status === 'loading' ? (
        <Alert severity="info">{progressMessage ?? 'Ожидаем ответ...'}</Alert>
      ) : status === 'success' && rows.length > 0 ? (
        <Alert severity="success">Готово.</Alert>
      ) : null}
      {status === 'error' ? <Alert severity="error">{errorMessage ?? 'Произошла неизвестная ошибка.'}</Alert> : null}
    </Stack>
  );
}
