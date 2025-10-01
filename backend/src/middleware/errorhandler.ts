import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ZodError } from 'zod'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  let message = 'Internal server error'
  let errors: any[] = []

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST
    message = 'Validation failed'
    errors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }))
  } else if (error.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST
    message = 'Validation error'
  } else if (error.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST
    message = 'Invalid data format'
  }
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
  }

  // Send error response
  const response: any = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  }

  res.status(statusCode).json(response)
}


