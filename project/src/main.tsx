import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initZipkin } from './utils/zipkin';
import { setupGlobalTracing } from './utils/tracedApi';

// Initialiser Zipkin
initZipkin();

// Activer le tracing global pour toutes les requêtes fetch
setupGlobalTracing();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
