import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import zipkinService from './services/zipkinService';

// Initialiser Zipkin avec le nouveau service
console.log('🚀 Initialisation de Zipkin:', zipkinService.getZipkinConfig());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
