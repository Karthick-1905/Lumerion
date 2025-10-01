/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique identifier for the user
 *         userName:
 *           type: string
 *           description: User display name
 *         userEmail:
 *           type: string
 *           format: email
 *           description: User email address
 *         isVerified:
 *           type: boolean
 *           description: Email verification status
 *
 *     RegisterRequest:
 *       type: object
 *       required: ['user_name', 'user_email', 'user_password', 'confirmPassword']
 *       properties:
 *         user_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User display name
 *           example: John Doe
 *         user_email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         user_password:
 *           type: string
 *           minLength: 8
 *           description: User password
 *           example: password123
 *         confirmPassword:
 *           type: string
 *           description: Password confirmation
 *           example: password123
 *
 *     LoginRequest:
 *       type: object
 *       required: ['user_email', 'password']
 *       properties:
 *         user_email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           description: User password
 *           example: password123
 *
 *     VerifyEmailRequest:
 *       type: object
 *       required: ['user_email', 'otp_code']
 *       properties:
 *         user_email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *         otp_code:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           description: 6-digit OTP code
 *           example: '123456'
 *
 *     ResendOTPRequest:
 *       type: object
 *       required: ['user_email']
 *       properties:
 *         user_email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required: ['user_email']
 *       properties:
 *         user_email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: john.doe@example.com
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required: ['token', 'new_password']
 *       properties:
 *         token:
 *           type: string
 *           description: Password reset token received via email
 *           example: abc123def456ghi789
 *         new_password:
 *           type: string
 *           minLength: 8
 *           description: New password
 *           example: newpassword123
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation completed successfully
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error message describing what went wrong
 */

// This file contains all Swagger schema definitions for the API
// The schemas are defined using JSDoc comments and will be automatically
// picked up by swagger-jsdoc when this file is included in the APIs array
export {};
