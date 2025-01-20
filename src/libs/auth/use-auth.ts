import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context';

interface UseAuthOptions {
  redirectUnauthenticated?: boolean;
}

const useAuth = (options?: UseAuthOptions) => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!context.isAuthenticated && options?.redirectUnauthenticated) {
      navigate(context.options?.login);
    }
  }, [context]);

  return context;
};

export default useAuth;
