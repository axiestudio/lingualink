import { sanitizationPatterns, fileUploadConfig } from '../config/security.config.js';

/**
 * Sanitize text input to prevent XSS and injection attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(sanitizationPatterns.htmlTags, '') // Remove HTML tags
    .replace(sanitizationPatterns.scriptTags, '') // Remove script tags
    .replace(sanitizationPatterns.xssPatterns, '') // Remove XSS patterns
    .trim();
};

/**
 * Sanitize message text while preserving basic formatting
 * @param {string} text - The message text to sanitize
 * @returns {string} - Sanitized message text
 */
export const sanitizeMessageText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Allow basic text but remove dangerous patterns
  return text
    .replace(sanitizationPatterns.scriptTags, '')
    .replace(sanitizationPatterns.xssPatterns, '')
    .replace(sanitizationPatterns.sqlInjection, '')
    .trim()
    .substring(0, 2000); // Enforce max length
};

/**
 * Validate and sanitize email addresses
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : null;
};

/**
 * Validate image data and extract metadata
 * @param {string} imageData - Base64 image data
 * @returns {object} - Validation result with metadata
 */
export const validateImageData = (imageData) => {
  if (!imageData || typeof imageData !== 'string') {
    return { valid: false, error: 'Invalid image data' };
  }

  // Check if it's a valid base64 image
  const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { valid: false, error: 'Invalid image format' };
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Check if mime type is allowed
  if (!fileUploadConfig.allowedImageTypes.includes(mimeType)) {
    return { valid: false, error: 'Image type not allowed' };
  }

  // Check file size (base64 is ~4/3 of original size)
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > fileUploadConfig.maxFileSize) {
    return { valid: false, error: 'Image size too large' };
  }

  return {
    valid: true,
    mimeType,
    sizeInBytes,
    base64Data
  };
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
export const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if password meets security requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
};

/**
 * Escape special characters for safe database queries
 * @param {string} input - Input to escape
 * @returns {string} - Escaped string
 */
export const escapeForDatabase = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\0/g, '\\0') // Escape null bytes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\x1a/g, '\\Z'); // Escape ctrl+Z
};
