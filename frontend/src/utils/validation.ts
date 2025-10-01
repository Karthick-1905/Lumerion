// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  if (username.length < 2) {
    return { isValid: false, message: 'Username must be at least 2 characters long' };
  }
  
  if (username.length > 50) {
    return { isValid: false, message: 'Username must be less than 50 characters' };
  }
  
  // Check for valid characters (letters, numbers, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
};

export const validateForm = (formData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate username
  const usernameValidation = validateUsername(formData.username.trim());
  if (!usernameValidation.isValid) {
    errors.push(usernameValidation.message!);
  }
  
  // Validate email
  if (!validateEmail(formData.email.trim())) {
    errors.push('Please enter a valid email address');
  }
  
  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message!);
  }
  
  // Validate password confirmation
  if (formData.password !== formData.confirmPassword) {
    errors.push("Passwords don't match");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
