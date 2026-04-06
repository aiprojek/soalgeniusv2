import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/amiri';
import '@fontsource/aref-ruqaa';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'quill/dist/quill.snow.css';
import './styles.css';

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// The script might be running before the DOM is fully parsed.
// We should wait for the DOMContentLoaded event to ensure the #root element exists.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}
