import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useRegisterMutation } from '../../hooks/useAuth';
import { validateForm } from '../../utils/validation';
import type { RegisterRequest } from '../../api/types';
import RegisterHero from '../../components/auth/RegisterHero';
import RegisterForm from '../../components/auth/RegisterForm';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const registerMutation = useRegisterMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept the Terms & Conditions to continue.');
      return;
    }

    const registerData: RegisterRequest = {
      user_name: formData.username.trim(),
      user_email: formData.email.trim().toLowerCase(),
      user_password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      await registerMutation.mutateAsync(registerData);
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#050507] via-[#0F1015] to-[#15161D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-[36px] overflow-hidden shadow-[0_38px_86px_rgba(3,3,6,0.65)]">
        <RegisterHero />
        <RegisterForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onTogglePassword={() => setShowPassword(prev => !prev)}
          onToggleConfirmPassword={() => setShowConfirmPassword(prev => !prev)}
          onAcceptTerms={checked => setAcceptTerms(checked)}
          onMarketingOptIn={checked => console.log('marketing opt-in:', checked)}
          isSubmitting={registerMutation.isPending}
        />
      </div>
    </div>
  );
}


