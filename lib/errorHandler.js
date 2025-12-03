/**
 * Centralized error handling utility
 * Provides consistent error messages and handling across the app
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.AUTH_ERROR]: 'Authentication failed. Please sign in again.',
  [ERROR_CODES.PERMISSION_ERROR]: 'You don\'t have permission to perform this action.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.NOT_FOUND]: 'The requested item was not found.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse Appwrite error and return user-friendly message
 */
export function parseAppwriteError(error) {
  if (!error) {
    return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return error.message;
  }

  // Handle Appwrite errors
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR];
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('session')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_ERROR];
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
      return ERROR_MESSAGES[ERROR_CODES.PERMISSION_ERROR];
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_MESSAGES[ERROR_CODES.NOT_FOUND];
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR];
    }
    
    // Server errors
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR];
    }
    
    // Return original message if it's user-friendly
    return error.message;
  }

  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Log error for debugging (in development)
 */
export function logError(error, context = '') {
  if (__DEV__) {
    console.error(`[Error${context ? ` in ${context}` : ''}]`, {
      message: error.message,
      code: error.code,
      originalError: error.originalError,
      timestamp: error.timestamp || new Date().toISOString(),
      stack: error.stack,
    });
  }
  
  // In production, you could send to error tracking service (e.g., Sentry)
  // if (errorTrackingService) {
  //   errorTrackingService.captureException(error, { context });
  // }
}

/**
 * Handle error with user feedback
 */
export function handleError(error, context = '', showAlert = true) {
  const userMessage = parseAppwriteError(error);
  logError(error, context);
  
  if (showAlert && typeof Alert !== 'undefined') {
    const { Alert } = require('react-native');
    Alert.alert('Error', userMessage);
  }
  
  return userMessage;
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling(fn, context = '') {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : new AppError(parseAppwriteError(error), ERROR_CODES.UNKNOWN_ERROR, error);
      
      handleError(appError, context);
      throw appError;
    }
  };
}

