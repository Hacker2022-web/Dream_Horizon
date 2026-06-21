import { Navigate, Outlet } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import { useEffect, useState } from 'react';

// Replace with the real admin email(s) you want to allow
const ADMIN_EMAIL = 'admin@gmail.com';

export const ProtectedRoute = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  if (checking) return null; // could render a spinner
  const isAdmin = user && user.email === ADMIN_EMAIL;
  return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};
