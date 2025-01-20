import { useCallback, useEffect, useState } from 'react';

import config from '@/config';
import useRouter from '@/hooks/use-router';
import { useAuth } from '@/libs/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  options: {
    login: string;
    shouldBeAuthenticated?: boolean;
  };
}

/**
 * AuthGuard component to protect routes based on authentication status.
 * @param {React.ReactNode} children - The child components to render.
 * @param {Object} options - Options for the AuthGuard.
 * @param {string} options.login - The login route.
 * @param {boolean} [options.shouldBeAuthenticated=true] - Flag indicating if the user should be authenticated.
 * @returns {JSX.Element | null} - The rendered component or null if redirecting.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, options }) => {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const check = useCallback(() => {
    const { shouldBeAuthenticated = true, login } = options;
    if (shouldBeAuthenticated && !isAuthenticated && window.location.pathname !== login) {
      const searchParams = new URLSearchParams({ returnTo: window.location.pathname }).toString();
      const href = login + `?${searchParams}`;
      router.replace(href);
    } else if (!shouldBeAuthenticated && isAuthenticated) {
      router.replace(config.paths.index);
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, router, options]);

  useEffect(() => {
    check();
  }, [isAuthenticated, check]);

  if (!checked) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
