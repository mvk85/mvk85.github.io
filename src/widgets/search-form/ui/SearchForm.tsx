import { Button, CircularProgress, Stack, TextField } from '@mui/material';
import type { FormEvent } from 'react';

type SearchFormProps = {
  login: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  onLoginChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function SearchForm({ login, status, onLoginChange, onSubmit }: SearchFormProps) {
  const isLoading = status === 'loading';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit();
  };

  return (
    <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
      <TextField
        label="Слово"
        placeholder="Слово для синонимов"
        value={login}
        onChange={(event) => onLoginChange(event.target.value)}
        fullWidth
        autoComplete="off"
      />

      <Button type="submit" variant="contained" disabled={isLoading} fullWidth>
        {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Поиск'}
      </Button>
    </Stack>
  );
}
