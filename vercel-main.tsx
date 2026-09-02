import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RooxApp from './components/roox-app';
import { resolvePage } from './lib/pages';
import './app/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Roox root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <RooxApp page={resolvePage(window.location.pathname)} />
  </StrictMode>,
);
