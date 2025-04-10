import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn, Briefcase, Users } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);
  const [error, setError] = useState('');

  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn(data.email, data.password);
      // Redirect based on email
      if (data.email.includes('hr@')) {
        navigate('/dashboard');
      } else {
        navigate('/applicant');
      }
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 border rounded-lg text-center hover:bg-gray-50">
            <Briefcase className="mx-auto h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">HR Portal</h3>
            <p className="text-sm text-gray-500 mt-1">Use hr@company.com</p>
          </div>
          <div className="p-4 border rounded-lg text-center hover:bg-gray-50">
            <Users className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Job Seeker</h3>
            <p className="text-sm text-gray-500 mt-1">Use your email</p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign in
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;