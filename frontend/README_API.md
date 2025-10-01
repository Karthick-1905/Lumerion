# Frontend API Integration

This document describes the API integration setup for the ADL LMS frontend application.

## Overview

The frontend now includes a complete API integration layer using React Query for state management and HTTP requests to the backend.

## Architecture

### API Layer Structure

```
src/
├── api/
│   ├── config.ts          # API configuration and endpoints
│   ├── types.ts           # TypeScript types for API requests/responses
│   ├── client.ts          # Generic HTTP client with error handling
│   ├── auth.ts            # Authentication API methods
│   └── index.ts           # Exports all API utilities
├── hooks/
│   └── useAuth.ts         # React Query hooks for authentication
└── utils/
    └── validation.ts      # Form validation utilities
```

### Key Components

#### 1. API Client (`src/api/client.ts`)
- Generic HTTP client built on top of fetch API
- Handles base URL configuration
- Automatic error handling and response parsing
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)

#### 2. API Configuration (`src/api/config.ts`)
- Centralized endpoint definitions
- Base URL configuration
- Environment-specific settings

#### 3. React Query Hooks (`src/hooks/useAuth.ts`)
- `useRegisterMutation` - Handles user registration
- `useLoginMutation` - Handles user login
- `useVerifyEmailMutation` - Handles email verification
- `useResendOTPMutation` - Handles OTP resending
- `useForgotPasswordMutation` - Handles password reset requests
- `useResetPasswordMutation` - Handles password reset

## Usage Examples

### User Registration

The Register component now uses the React Query mutation:

```tsx
import { useRegisterMutation } from '../../hooks/useAuth';
import { validateForm } from '../../utils/validation';
import { toast } from 'react-toastify';

const Register = () => {
  const registerMutation = useRegisterMutation();
  
  const handleSubmit = async (formData) => {
    const validation = validateForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    try {
      await registerMutation.mutateAsync({
        user_name: formData.username.trim(),
        user_email: formData.email.trim().toLowerCase(),
        user_password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.response?.message || 'Registration failed');
    }
  };
};
```

### API Client Usage

Direct API calls (if needed outside of React Query):

```tsx
import { authApi } from '../api/auth';

// Register user
const registerUser = async (userData) => {
  try {
    const response = await authApi.register(userData);
    console.log('Registration successful:', response);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Update `src/api/config.ts` to use environment variables:

```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  // ... rest of config
};
```

## Error Handling

### API Client Errors
- Network errors (status: 0)
- HTTP errors (status: 400, 401, 404, 500, etc.)
- Automatic error response parsing

### React Query Error Handling
- Automatic retry configuration
- Error boundaries support
- Loading and error states

### Toast Notifications
- Success messages for completed operations
- Error messages for failed operations
- Validation error messages

## Backend Integration

### Expected Backend Response Format

The API client expects responses in this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": { ... }
}
```

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

## Development

### Running the Frontend

```bash
cd frontend
npm run dev
```

### Testing API Integration

1. Start the backend server on `http://localhost:8000`
2. Start the frontend development server
3. Navigate to `/register` to test the registration flow

## Features

### Form Validation
- Client-side validation using custom validation utilities
- Real-time error feedback
- Server-side validation error display

### Loading States
- Button loading states during API calls
- Disabled form controls during submission

### Navigation
- Automatic navigation after successful operations
- State preservation between routes

### Error Recovery
- Automatic retry for failed requests
- User-friendly error messages
- Graceful error handling

## Next Steps

1. Implement remaining authentication flows (login, verify email, etc.)
2. Add authentication context for managing user state
3. Implement protected routes
4. Add refresh token handling
5. Implement logout functionality
