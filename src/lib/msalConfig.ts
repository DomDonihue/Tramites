import { Configuration, PopupRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId:    'c1f8a6c3-95bd-42c6-a7fd-0be2958f35ae',
    authority:   'https://login.microsoftonline.com/1b037852-4fe3-470f-bb9e-c8ba670e4653',
    redirectUri: window.location.origin + (window.location.pathname.startsWith('/Tramites') ? '/Tramites/' : '/'),
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
}

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
}
