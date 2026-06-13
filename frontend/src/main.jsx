import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/react';
import { setClerkTokenGetter } from './lib/api';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function TokenInitializer({ children }) {
  const { getToken } = useAuth();
  React.useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <TokenInitializer>
          <App />
        </TokenInitializer>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
