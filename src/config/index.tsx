/**
 * Application configuration interface
 */
export interface AppConfig {
  meta: {
    /** Application title */
    title: string;
    /** Application version */
    version?: string;
    /** Copyright information */
    copyright?: string;
    /** Application URL */
    url?: string;
  };
  paths: {
    auth: {
      /** Path to login */
      login: string;
      /** Path to logout */
      logout: string;
      /** Path to signup */
      signup: string;
      /** Path to redirect after login */
      loginRedirect: string;
      /** Path to redirect after login */
      redirectAfterLogin: string;
      /** Path to redirect after logout */
      redirectAfterLogout: string;
    };
    /** Path to index */
    index: string;
    /** Flag to indicate if HTTPS redirection is enabled */
    httpsRedirect: boolean;
    /** Path to redirect from root */
    rootRedirect: string;
  };
  settings: {
    /** Log level setting */
    logLevel: 'info' | 'debug' | 'warn' | 'error';
  };
  /** Issue dialog configuration */
  issueDialog?: {
    [key: string]: any;
  };
  /** Custom configuration */
  custom?: {
    [key: string]: any;
  };
}

/**
 * Application configuration object
 */
const config: AppConfig = {
  meta: {
    title: 'AppElent Template',
    version: 'v0.0.1',
    url: 'www.appelent.nl',
    copyright: 'AppElent',
  },
  paths: {
    auth: {
      login: '/login',
      logout: '/logout',
      signup: '/signup',
      loginRedirect: '/app',
      redirectAfterLogin: '/',
      redirectAfterLogout: '/',
    },
    index: '/app',
    httpsRedirect: !import.meta.env.DEV && window.location.hostname !== 'localhost',
    rootRedirect: '/app',
  },
  settings: {
    logLevel: (localStorage.getItem('logLevel') as AppConfig['settings']['logLevel']) || 'error',
  },
  issueDialog: {
    // The issue dialog needs functions to open and close it
  },
  custom: {
    // All custom elements are optional
  },
};

export const getLogLevel = () => {
  return localStorage.getItem('logLevel') as AppConfig['settings']['logLevel'];
};

export const setLogLevel = (level: AppConfig['settings']['logLevel']) => {
  localStorage.setItem('logLevel', level);
  config.settings.logLevel = level;
};

export default config;
