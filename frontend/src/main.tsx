import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/soft.css';
import './styles.css';
import App from './App';
import { applyTheme, initialTheme } from './lib/theme';

// Antes del primer render, para que no haya un destello del otro tema.
applyTheme(initialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
