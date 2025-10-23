import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useUser } from '../context/UserContext';

axios.defaults.withCredentials = true;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { setUser } = useUser();

  const validateForm = () => {
    let newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Step 1: Authenticate with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        // console.log('Firebase login successful:', firebaseUser.email);

        // Step 2: Authenticate with backend to get JWT token
        // console.log('Attempting backend login...');
        let response;
        try {
          response = await axios.post(`${process.env.REACT_APP_BACKEND}/auth/login`, {
            email: formData.email,
            password: formData.password,
          });
          // console.log('Backend login successful');
        } catch (loginError) {
          if (loginError.response?.status === 401 && loginError.response?.data?.error?.includes('User not found')) {
            console.log('User not found in backend, attempting to sync Firebase user...');

            // Try to sync Firebase user with backend
            try {
              response = await axios.post(`${process.env.REACT_APP_BACKEND}/auth/sync-firebase-user`, {
                email: firebaseUser.email,
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName
              });
              console.log('Firebase user synced successfully');
            } catch (syncError) {
              console.error('Failed to sync Firebase user:', syncError);
              throw new Error('User not found in system. Please contact administrator.');
            }
          } else {
            throw loginError;
          }
        }

        // console.log('Backend login response:', response.data);

        // Step 3: Check if we got user data from backend
        if (!response.data || !response.data.user) {
          throw new Error('Backend login failed - no user data returned');
        }

        // console.log('Backend user data received:', response.data.user.email);

        // Step 4: Merge Firebase user with backend user data
        const completeUser = {
          ...firebaseUser,
          ...response.data.user,
          // Ensure we have the MongoDB _id as id for consistency
          id: response.data.user._id || response.data.user.id
        };

        // console.log('Login successful, navigating to projects');
        setUser(completeUser);
        navigate('/projects');
      } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error details:', error);

        if (error.response) {
          console.error('Backend error status:', error.response.status);
          console.error('Backend error data:', error.response.data);
          setErrors({
            submit: `Login failed: ${error.response.data.error || 'Server error'}`
          });
        } else if (error.message) {
          console.error('Firebase/Network error:', error.message);
          setErrors({
            submit: `Login failed: ${error.message}`
          });
        } else {
          setErrors({
            submit: 'Login failed. Please check your credentials and try again.'
          });
        }
      }
    }
  };

  // Removed: useEffect that was setting user to null on every login page visit
  // useEffect(()=>{
  //   setUser(null)
  // },[])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CENTER OF EXCELLENCE
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please log in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <InputField
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <InputField
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
          </div>
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errors.submit}</span>
            </div>
          )}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Log In
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
            New User? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ name, type, placeholder, value, onChange, error }) => (
  <div>
    <input
      name={name}
      type={type}
      required
      className={`appearance-none rounded-none mt-5 relative block w-full px-3 py-2 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
    {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
  </div>
);

const SelectField = ({ name, value, onChange, error, options }) => (
  <div>
    <select
      name={name}
      required
      className={`appearance-none rounded-none mt-5 relative block w-full px-3 py-2 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
      value={value}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
  </div>
);

export default Login;