import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useUser } from '../context/UserContext';

axios.defaults.withCredentials = true;

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    contactNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const currentDate = new Date();
      const inputDate = new Date(formData.dateOfBirth);
      if (inputDate > currentDate) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    // Contact number validation
    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prevState => ({
        ...prevState,
        address: {
          ...prevState.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;

        if (firebaseUser.uid) {
          const response = await axios.post(`${process.env.REACT_APP_BACKEND}/auth/signup`, {
            ...formData,
            uid: firebaseUser.uid
          });
          
          setUser({ ...firebaseUser, ...response.data.user });
          navigate('/projects');
        }
      } catch (error) {
        console.error('Signup error', error);
        setErrors({ submit: error.message || 'An error occurred during signup. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CENTER OF EXCELLENCE
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our team of excellence
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
            <SelectField
              name="role"
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              options={[
                { value: "", label: "Select Role" },
                { value: "department head", label: "Department Head" },
                { value: "wing head", label: "Wing Head" },
                { value: "RO/Dev", label: "RO/Dev" }
              ]}
            />
            <InputField
              name="firstName"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
            />
            <InputField
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />
            <InputField
              name="dateOfBirth"
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              error={errors.dateOfBirth}
            />
            <InputField
              name="contactNumber"
              type="tel"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={handleChange}
              error={errors.contactNumber}
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
              Sign Up
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
            Already a User? Login
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

export default Signup;