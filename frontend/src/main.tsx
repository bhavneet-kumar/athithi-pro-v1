import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

// Import main css
import App from './App';
import './index.css';
import { store } from './store';
import { ThemeProvider } from 'next-themes';

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  );
}
