import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for deployment debugging
window.onerror = (message, source, lineno, colno, error) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red;">
      <h2>Fatal Error</h2>
      <p>${message}</p>
      <pre>${error?.stack || ''}</pre>
    </div>`;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
