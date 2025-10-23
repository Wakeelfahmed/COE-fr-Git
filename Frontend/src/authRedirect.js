import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useUser } from './context/UserContext';
import axios from 'axios';

axios.defaults.withCredentials = true;

function AuthRedirect({ onAuthChecked }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();

  // console.log('AuthRedirect: Component rendered, starting auth listener');

  useEffect(() => {
    // console.log('AuthRedirect: useEffect running, setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // console.log('AuthRedirect: Auth state changed', firebaseUser ? 'User logged in' : 'User not logged in');

      try {
        if (firebaseUser) {
          // console.log('AuthRedirect: Firebase user detected:', firebaseUser.email);

          // Check if we need to sync with backend
          let backendUser = null;
          try {
            // Try to get backend authentication status
            const response = await axios.get(`${process.env.REACT_APP_BACKEND}/auth/check`);
            if (response.data.authenticated && response.data.user) {
              backendUser = response.data.user;
              // console.log('AuthRedirect: Backend user found:', backendUser.email);
            }
          } catch (error) {
            console.log('AuthRedirect: Backend check failed, user may need backend sync');
          }

          // If we have backend user data, use it; otherwise sync Firebase user
          if (backendUser) {
            // Merge Firebase and backend user data
            const completeUser = {
              ...firebaseUser,
              ...backendUser,
              id: backendUser._id || backendUser.id
            };
            // console.log('AuthRedirect: Setting complete user with backend data');
            setUser(completeUser);
          } else {
            // No backend user found, try to sync Firebase user
            // console.log('AuthRedirect: No backend user found, attempting sync...');
            try {
              const syncResponse = await axios.post(`${process.env.REACT_APP_BACKEND}/auth/sync-firebase-user`, {
                email: firebaseUser.email,
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName
              });

              if (syncResponse.data && syncResponse.data.user) {
                const syncedUser = {
                  ...firebaseUser,
                  ...syncResponse.data.user,
                  id: syncResponse.data.user._id || syncResponse.data.user.id
                };
                // console.log('AuthRedirect: Firebase user synced successfully');
                setUser(syncedUser);
              } else {
                // console.log('AuthRedirect: Sync failed, setting Firebase user only');
                setUser(firebaseUser);
              }
            } catch (syncError) {
              console.error('AuthRedirect: Sync failed:', syncError);
              // Still set Firebase user so the app works
              setUser(firebaseUser);
            }
          }

          // Navigate away from login/signup if we're on those pages
          if (location.pathname === '/login' || location.pathname === '/signup') {
            navigate('/');
          }
        } else {
          // console.log('AuthRedirect: No Firebase user, clearing state');
          setUser(null);
          if (!['/login', '/signup'].includes(location.pathname)) {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('AuthRedirect: Error in auth state change handler:', error);
        setUser(null);
      }

      // console.log('AuthRedirect: Calling onAuthChecked');
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