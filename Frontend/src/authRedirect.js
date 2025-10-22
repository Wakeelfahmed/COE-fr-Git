import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useUser } from './context/UserContext';

function AuthRedirect({ onAuthChecked }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();

  console.log('AuthRedirect: Component rendered, starting auth listener');

  useEffect(() => {
    console.log('AuthRedirect: useEffect running, setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthRedirect: Auth state changed', firebaseUser ? 'User logged in' : 'User not logged in');
      if (firebaseUser) {
        // Only set Firebase user if we don't already have a complete user object with backend data
        setUser(prevUser => {
          // Check if previous user has backend data (MongoDB _id) or if it's already a complete merged object
          if (prevUser && (prevUser._id || prevUser.id || (prevUser.uid && prevUser.role))) {
            console.log('AuthRedirect: User already has backend data or complete merged data, not overwriting');
            console.log('Previous user has:', {
              id: prevUser.id,
              _id: prevUser._id,
              uid: prevUser.uid,
              role: prevUser.role,
              email: prevUser.email
            });
            return prevUser;
          }

          console.log('AuthRedirect: Setting Firebase user data');
          console.log('Firebase user:', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            hasRole: !!firebaseUser.role
          });
          return firebaseUser;
        });

        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/');
        }
      } else {
        setUser(null);
        if (!['/login', '/signup'].includes(location.pathname)) {
          navigate('/login');
        }
      }
      console.log('AuthRedirect: Calling onAuthChecked');
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