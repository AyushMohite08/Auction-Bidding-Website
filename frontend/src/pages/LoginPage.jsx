// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer'); // Default role
    
    // Use the error state and login function from AuthContext
    const { login, error, setError, user } = useAuth();
    const navigate = useNavigate();

    // Clear previous errors when the component loads
    useEffect(() => {
        setError(null);
    }, [setError]);

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            navigate(`/${user.role}`);
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await login({ email, password, role });
            // The useEffect above will handle redirection on successful login
        } catch (err) {
            // Error is already set in the AuthContext, so no extra handling needed here
            console.error("Login attempt failed from page");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg"
            >
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                    Login to Your Account
                </h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selector */}
                    <div className="flex justify-center space-x-4 mb-6">
                        <button type="button" onClick={() => setRole('customer')} className={`px-4 py-2 rounded-md ${role === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            Customer
                        </button>
                        <button type="button" onClick={() => setRole('vendor')} className={`px-4 py-2 rounded-md ${role === 'vendor' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            Vendor
                        </button>
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Sign In
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Register here
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginPage;

/*
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock } from 'lucide-react';

// Assuming this utility file is available in src/utils/apiClient.js
import apiClient from '../api/apiClient'

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer');
    const [error, setError] = useState('');
    const { login } = useAuth(); // Assume login function is updated to take user data/token
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            // 1. POST request to the EC2 Backend API for authentication
            const response = await apiClient(`auth/login/${userType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            // Expected response structure from EC2: { user: { id, email, role, token } }
            
            // 2. Pass the successful user data to the AuthContext login function
            // NOTE: You must implement this logic inside your AuthContext.js!
            const loggedInUser = await login(response.user); 
            
            // 3. Navigate based on the returned role
            navigate(`/${loggedInUser.role}`);

        } catch (err) {
            console.error('Login API Error:', err);
            // Display a generic error for security
            setError('Login failed. Please check your credentials and account type.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full space-y-8"
            >
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Choose your account type and login
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Type
                            </label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="relative mb-4">
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-t-md relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="relative">
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-b-md relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Sign In as {userType.charAt(0).toUpperCase() + userType.slice(1)}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Register here
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p className="mb-2"><strong>Demo Credentials:</strong></p>
                        <p>Customer: customer@demo.com / password</p>
                        <p>Vendor: vendor@demo.com / password</p>
                        <p>Admin: admin@demo.com / password</p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginPage;

*/