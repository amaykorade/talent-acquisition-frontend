import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus } from 'lucide-react';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function Register() {
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<RegisterForm>();
  const navigate = useNavigate();
  const signUp = useAuthStore(state => state.register);
  const checkEmailExists = useAuthStore(state => state.checkEmailExists);
  const [error, setError] = useState<string>('');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      const exists = await checkEmailExists(data.email);
      if (exists) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }
      
      await signUp(data.email, data.password, data.name, data.phone);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^\+?[1-9]\d{1,14}$/,
                    message: 'Invalid phone number'
                  }
                })}
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}