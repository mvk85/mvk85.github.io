import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';

import { App } from '@/app/App';
import { AppThemeProvider } from '@/app/providers/theme/ui/ThemeProvider';
import '@/app/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <App />
    </AppThemeProvider>
  </React.StrictMode>,
);
