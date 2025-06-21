// Environment detection and configuration loader
const getEnvironment = (): string => {
  // Check for environment variable first
  if (import.meta.env && import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT;
  }
  
  // Check hostname for automatic environment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('linkedgoals-dev') || hostname.includes('localhost')) {
      return 'development';
    }
    
    if (hostname.includes('linkedgoals-staging')) {
      return 'staging';
    }
    
    if (hostname.includes('linkedgoals-d7053')) {
      return 'production';
    }
  }
  
  // Default to development
  return 'development';
};

export const currentEnvironment = getEnvironment();

// Dynamically import configuration based on environment
const loadEnvironmentConfig = async () => {
  switch (currentEnvironment) {
    case 'staging':
      return await import('./firebase-staging');
    case 'production':
      return await import('./firebase-prod');
    case 'development':
    default:
      return await import('./firebase-dev');
  }
};

// Export configuration promise for async loading
export const configPromise = loadEnvironmentConfig();

// For synchronous usage (not recommended for dynamic imports)
export const getConfig = async () => {
  const config = await configPromise;
  return {
    firebaseConfig: config.firebaseConfig,
    environment: config.environment,
  };
};