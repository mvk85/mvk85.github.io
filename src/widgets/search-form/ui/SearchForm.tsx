import { Button, CircularProgress, Stack, TextField } from '@mui/material';
import type { FormEvent } from 'react';

type SearchFormProps = {
  value: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  finished: boolean;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => Promise<void>;
};

export function SearchForm({ value, status, finished, onValueChange, onSubmit }: SearchFormProps) {
  const isLoading = status === 'loading';
  const isDisabled = isLoading || finished;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(value);
  };

  return (
    <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
      <TextField
        label="Ваш ответ"
        placeholder="Введите ответ"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        fullWidth
        autoComplete="off"
        disabled={isDisabled}
      />

      <Button type="submit" variant="contained" disabled={isDisabled || value.trim().length === 0} fullWidth>
        {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Отправить'}
      </Button>
    </Stack>
  );
}
