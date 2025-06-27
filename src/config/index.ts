import { firebaseConfig as devConfig } from './firebase-dev';
import { firebaseConfig as stagingConfig } from './firebase-staging';
import { firebaseConfig as prodConfig } from './firebase-prod';

// Determine environment from build mode or URL
const getEnvironment = () => {
  // Check if we're in a build process with NODE_ENV
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // Check based on hostname in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('linkedgoals-development') || hostname.includes('development')) {
      return 'development';
    }
    if (hostname.includes('linkedgoals-staging') || hostname.includes('staging')) {
      return 'staging';
    }
    if (hostname.includes('linkedgoals-d7053') || hostname.includes('app.linkedgoals')) {
      return 'production';
    }
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
  }
  
  // Default to production for safety
  return 'production';
};

const environment = getEnvironment();

// Select the correct config based on environment
const getFirebaseConfig = () => {
  switch (environment) {
    case 'development':
      return devConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
    default:
      return prodConfig;
  }
};

export const firebaseConfig = getFirebaseConfig();
export const currentEnvironment = environment;