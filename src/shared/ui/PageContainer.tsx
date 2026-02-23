import type { PropsWithChildren } from 'react';
import { Container, Paper } from '@mui/material';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 6 } }}>
      <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        {children}
      </Paper>
    </Container>
  );
}
