import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import Logger from '../utils/logger';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

export class ValidationMiddleware {
  private static instance: ValidationMiddleware;
  private logger: typeof Logger;

  private constructor() {
    this.logger = Logger;
  }

  public static getInstance(): ValidationMiddleware {
    if (!ValidationMiddleware.instance) {
      ValidationMiddleware.instance = new ValidationMiddleware();
    }
    return ValidationMiddleware.instance;
  }

  /**
   * Validate request body against Joi schema
   */
  public validateBody = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        this.logger.validationEvent('body', false, errors);
        
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors
        });
        return;
      }

      req.body = value;
      this.logger.validationEvent('body', true);
      next();
    };
  };

  /**
   * Validate request query parameters against Joi schema
   */
  public validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        this.logger.validationEvent('query', false, errors);
        
        res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: errors
        });
        return;
      }

      req.query = value;
      this.logger.validationEvent('query', true);
      next();
    };
  };

  /**
   * Validate request parameters against Joi schema
   */
  public validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        this.logger.validationEvent('params', false, errors);
        
        res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: errors
        });
        return;
      }

      req.params = value;
      this.logger.validationEvent('params', true);
      next();
    };
  };

  /**
   * Validate headers against Joi schema
   */
  public validateHeaders = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.headers, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        this.logger.validationEvent('headers', false, errors);
        
        res.status(400).json({
          success: false,
          message: 'Header validation failed',
          errors: errors
        });
        return;
      }

      req.headers = value;
      this.logger.validationEvent('headers', true);
      next();
    };
  };

  /**
   * Validate file upload
   */
  public validateFile = (options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const file = req.file;
      
      if (options.required && !file) {
        this.logger.validationEvent('file', false, [{ field: 'file', message: 'File is required' }]);
        res.status(400).json({
          success: false,
          message: 'File is required',
          errors: [{ field: 'file', message: 'File is required' }]
        });
        return;
      }

      if (file) {
        // Check file size
        if (options.maxSize && file && file.size > options.maxSize) {
          this.logger.validationEvent('file', false, [{ 
            field: 'file', 
            message: `File size exceeds maximum allowed size of ${options.maxSize} bytes` 
          }]);
          res.status(400).json({
            success: false,
            message: 'File size too large',
            errors: [{ field: 'file', message: `File size exceeds maximum allowed size of ${options.maxSize} bytes` }]
          });
          return;
        }

        // Check file type
        if (options.allowedTypes && file && !options.allowedTypes.includes(file.mimetype)) {
          this.logger.validationEvent('file', false, [{ 
            field: 'file', 
            message: `File type ${file.mimetype} is not allowed` 
          }]);
          res.status(400).json({
            success: false,
            message: 'Invalid file type',
            errors: [{ field: 'file', message: `File type ${file.mimetype} is not allowed` }]
          });
          return;
        }
      }

      this.logger.validationEvent('file', true);
      next();
    };
  };

  /**
   * Validate multiple files
   */
  public validateFiles = (options: {
    maxFiles?: number;
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  }) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const files = req.files as Express.Multer.File[];
      
      if (options.required && (!files || files.length === 0)) {
        this.logger.validationEvent('files', false, [{ field: 'files', message: 'Files are required' }]);
        res.status(400).json({
          success: false,
          message: 'Files are required',
          errors: [{ field: 'files', message: 'Files are required' }]
        });
        return;
      }

      if (files && files.length > 0) {
        // Check number of files
        if (options.maxFiles && files.length > options.maxFiles) {
          this.logger.validationEvent('files', false, [{ 
            field: 'files', 
            message: `Maximum ${options.maxFiles} files allowed` 
          }]);
          res.status(400).json({
            success: false,
            message: 'Too many files',
            errors: [{ field: 'files', message: `Maximum ${options.maxFiles} files allowed` }]
          });
          return;
        }

        // Check each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Check file size
          if (options.maxSize && file && file.size > options.maxSize) {
            this.logger.validationEvent('files', false, [{ 
              field: `files[${i}]`, 
              message: `File size exceeds maximum allowed size of ${options.maxSize} bytes` 
            }]);
            res.status(400).json({
              success: false,
              message: 'File size too large',
              errors: [{ field: `files[${i}]`, message: `File size exceeds maximum allowed size of ${options.maxSize} bytes` }]
            });
            return;
          }

          // Check file type
          if (options.allowedTypes && file && !options.allowedTypes.includes(file.mimetype)) {
            this.logger.validationEvent('files', false, [{ 
              field: `files[${i}]`, 
              message: `File type ${file.mimetype} is not allowed` 
            }]);
            res.status(400).json({
              success: false,
              message: 'Invalid file type',
              errors: [{ field: `files[${i}]`, message: `File type ${file.mimetype} is not allowed` }]
            });
            return;
          }
        }
      }

      this.logger.validationEvent('files', true);
      next();
    };
  };

  /**
   * Sanitize input data
   */
  public sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  };

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  /**
   * Validate pagination parameters
   */
  public validatePagination = (req: Request, res: Response, next: NextFunction): void => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid page number',
        errors: [{ field: 'page', message: 'Page must be greater than 0' }]
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid limit',
        errors: [{ field: 'limit', message: 'Limit must be between 1 and 100' }]
      });
      return;
    }

    req.query.page = page.toString();
    req.query.limit = limit.toString();
    next();
  };

  /**
   * Validate UUID parameters
   */
  public validateUUID = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const uuid = req.params[paramName];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuid || !uuidRegex.test(uuid)) {
        this.logger.validationEvent('uuid', false, [{ field: paramName, message: 'Invalid UUID format' }]);
        res.status(400).json({
          success: false,
          message: 'Invalid UUID format',
          errors: [{ field: paramName, message: 'Invalid UUID format' }]
        });
        return;
      }

      this.logger.validationEvent('uuid', true);
      next();
    };
  };

  /**
   * Validate email format
   */
  public validateEmail = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const email = req.body[fieldName] || req.query[fieldName];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && !emailRegex.test(email)) {
        this.logger.validationEvent('email', false, [{ field: fieldName, message: 'Invalid email format' }]);
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: [{ field: fieldName, message: 'Invalid email format' }]
        });
        return;
      }

      this.logger.validationEvent('email', true);
      next();
    };
  };

  /**
   * Validate phone number format - basic validation only
   */
  public validatePhoneNumber = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const phone = req.body[fieldName] || req.query[fieldName];

      // Only validate that phone exists and is not empty
      if (phone && typeof phone === 'string' && phone.trim().length === 0) {
        this.logger.validationEvent('phone', false, [{ field: fieldName, message: 'Phone number cannot be empty' }]);
        res.status(400).json({
          success: false,
          message: 'Phone number cannot be empty',
          errors: [{ field: fieldName, message: 'Phone number cannot be empty' }]
        });
        return;
      }

      this.logger.validationEvent('phone', true);
      next();
    };
  };
}

export default ValidationMiddleware;
