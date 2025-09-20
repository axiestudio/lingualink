import { body, param, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for user signup
export const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

// Validation rules for user login
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Validation rules for sending messages
export const validateMessage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message text cannot exceed 2000 characters'),
  body('image')
    .optional()
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }
      // Check image size (base64 encoded, roughly 4/3 of original size)
      if (value && value.length > 5 * 1024 * 1024) { // ~3.75MB original
        throw new Error('Image size too large (max 3MB)');
      }
      return true;
    }),
  body()
    .custom((value) => {
      if (!value.text && !value.image) {
        throw new Error('Either text or image is required');
      }
      return true;
    }),
  handleValidationErrors
];

// Validation rules for profile update
export const validateProfileUpdate = [
  body('profilePic')
    .custom((value) => {
      if (value && !value.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }
      // Check image size
      if (value && value.length > 2 * 1024 * 1024) { // ~1.5MB original
        throw new Error('Profile picture size too large (max 1.5MB)');
      }
      return true;
    }),
  handleValidationErrors
];

// Validation rules for getting messages
export const validateGetMessages = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  handleValidationErrors
];

// Validation rules for getting message image
export const validateGetImage = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Invalid message ID'),
  handleValidationErrors
];
