import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AppProvider } from './AppContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <GoogleOAuthProvider clientId="787022946368-rnv4ekle2ql0bhi8qjecp8a8gddemo6e.apps.googleusercontent.com">
    <AppProvider>
      <App />
    </AppProvider>
  // </GoogleOAuthProvider>
);

serviceWorkerRegistration.register();

reportWebVitals();