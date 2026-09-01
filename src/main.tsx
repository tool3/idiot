import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyDesign, startingDesign } from './theme/designs';
import { applyTheme, startingTheme } from './theme/themes';
import './styles/global.scss';
import './styles/deep.scss';

applyTheme(startingTheme());
applyDesign(startingDesign());

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
