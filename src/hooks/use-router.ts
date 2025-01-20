import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Router {
  back: () => void;
  forward: () => void;
  refresh: () => void;
  push: (href: string) => void;
  replace: (href: string) => void;
  prefetch: () => void;
}

/**
 * This is a wrapper over `react-router/useNavigate` hook.
 * We use this to help us maintain consistency between CRA and Next.js
 */
const useRouter = (): Router => {
  const navigate = useNavigate();

  return useMemo(() => {
    return {
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      prefetch: () => {},
    };
  }, [navigate]);
};

export default useRouter;
