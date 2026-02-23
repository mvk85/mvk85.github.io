import { Button, CircularProgress, Stack, TextField } from '@mui/material';
import type { FormEvent } from 'react';

type SearchFormProps = {
  promptText: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  onPromptChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function SearchForm({ promptText, status, onPromptChange, onSubmit }: SearchFormProps) {
  const isLoading = status === 'loading';
  const isDisabled = isLoading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit();
  };

  return (
    <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
      <TextField
        label="Текст запроса"
        placeholder="Введите текст промта для тестирования моделей"
        value={promptText}
        onChange={(event) => onPromptChange(event.target.value)}
        fullWidth
        autoComplete="off"
        disabled={isDisabled}
        multiline
        minRows={4}
        maxRows={12}
      />

      <Button type="submit" variant="contained" disabled={isDisabled || promptText.trim().length < 6} fullWidth>
        {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Отправить'}
      </Button>
    </Stack>
  );
}
