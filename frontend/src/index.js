import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';


const onRedirectCallback = (appState) => {
  // where to send users after login
  const returnTo = (appState && appState.returnTo) || "/mainmenu" || window.location.pathname;
  // use the History API your Router expects:
  window.history.replaceState({}, "", returnTo);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"   // keeps session after refresh
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

reportWebVitals();