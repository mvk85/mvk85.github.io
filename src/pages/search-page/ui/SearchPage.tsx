import { Stack, Typography } from '@mui/material';

import { useSubmitSearch } from '@/features/submit-search/model/useSubmitSearch';
import { ResultPanel } from '@/widgets/result-panel/ui/ResultPanel';
import { SearchForm } from '@/widgets/search-form/ui/SearchForm';
import { PageContainer } from '@/shared/ui/PageContainer';

export function SearchPage() {
  const { login, setLogin, status, resultText, errorMessage, onSubmit } = useSubmitSearch();

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Поиск синонима
        </Typography>

        <SearchForm login={login} status={status} onLoginChange={setLogin} onSubmit={onSubmit} />

        <ResultPanel status={status} resultText={resultText} errorMessage={errorMessage} />
      </Stack>
    </PageContainer>
  );
}
