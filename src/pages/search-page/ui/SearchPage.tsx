import { Stack, Typography } from '@mui/material';

import { useSubmitSearch } from '@/features/submit-search/model/useSubmitSearch';
import { ResultPanel } from '@/widgets/result-panel/ui/ResultPanel';
import { SearchForm } from '@/widgets/search-form/ui/SearchForm';
import { PageContainer } from '@/shared/ui/PageContainer';

export function SearchPage() {
  const { inputValue, setInputValue, messages, status, errorMessage, finished, sendUserMessage } = useSubmitSearch();

  return (
    <PageContainer>
      <Stack spacing={2} sx={{ minHeight: '70vh', justifyContent: 'space-between' }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Чат-опросник
          </Typography>

          <ResultPanel messages={messages} status={status} errorMessage={errorMessage} />
        </Stack>

        <SearchForm
          value={inputValue}
          status={status}
          finished={finished}
          onValueChange={setInputValue}
          onSubmit={sendUserMessage}
        />
      </Stack>
    </PageContainer>
  );
}
