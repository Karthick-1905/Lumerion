import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useLoginMutation } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import LoginHero from '../../components/auth/LoginHero';
import LoginForm from '../../components/auth/LoginForm';

export default function Login() {
  const [formData, setFormData] = useState({
    email: 'jskarthick399@gmail.com',
    password: 'Kar@0710',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { mutate: login, isPending } = useLoginMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }
    login(
      {
        user_email: formData.email,
        password: formData.password,
      },
      {
        onError: (err: any) => {
          const message = err?.response?.message || err?.message || 'Login failed';
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#050507] via-[#0F1015] to-[#15161D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-[36px] overflow-hidden shadow-[0_38px_86px_rgba(3,3,6,0.65)]">
        <LoginHero />
        <LoginForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(prev => !prev)}
          onForgotPassword={() => setShowForgotPasswordModal(true)}
          isSubmitting={isPending}
        />
      </div>

      <ForgotPasswordModal isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} />
    </div>
  );
}


