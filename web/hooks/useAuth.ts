import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/features/auth/authSlice';

export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return {
    user,
    isAuthenticated,
  };
};