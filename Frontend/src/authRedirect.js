import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useUser } from './context/UserContext';

function AuthRedirect({ onAuthChecked }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  useEffect(() => {
    // console.log('AuthRedirect: Starting auth check');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // console.log('AuthRedirect: Auth state changed', firebaseUser ? 'User logged in' : 'User not logged in');
      if (firebaseUser) {
        setUser(firebaseUser);
        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/');
        }
      } else {
        setUser(null);
        if (!['/login', '/signup'].includes(location.pathname)) {
          navigate('/login');
        }
      }
      onAuthChecked();
    });

    return () => {
      // console.log('AuthRedirect: Unsubscribing from auth listener');
      unsubscribe();
    };
  }, [navigate, location, setUser, onAuthChecked]);

  return null;
}

export default AuthRedirect;