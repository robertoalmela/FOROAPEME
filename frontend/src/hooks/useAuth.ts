import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  return { user, isAuthenticated, isLoading, logout, refetch: fetchUser };
}
