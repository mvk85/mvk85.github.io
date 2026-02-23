import { Stack, Typography } from '@mui/material';

import { useCompareModels } from '@/features/compare-models/model/useCompareModels';
import { ResultPanel } from '@/widgets/result-panel/ui/ResultPanel';
import { SearchForm } from '@/widgets/search-form/ui/SearchForm';
import { PageContainer } from '@/shared/ui/PageContainer';

export function SearchPage() {
  const { promptText, setPromptText, status, errorMessage, progressMessage, rows, run } = useCompareModels();

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Сравнение моделей
        </Typography>

        <SearchForm promptText={promptText} status={status} onPromptChange={setPromptText} onSubmit={run} />

        <ResultPanel status={status} errorMessage={errorMessage} progressMessage={progressMessage} rows={rows} />
      </Stack>
    </PageContainer>
  );
}
