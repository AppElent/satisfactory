import { getPath } from '@/config/paths';
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface PathRouter {
  back: () => void;
  forward: () => void;
  refresh: () => void;
  push: (id: string, params?: { [key: string]: string | undefined }) => void;
  replace: (id: string, params?: { [key: string]: string | undefined }) => void;
  prefetch: () => void;
}

/**
 * This is a wrapper over `react-router/useNavigate` hook.
 * We use this to help us maintain consistency between CRA and Next.js
 */
const usePathRouter = (): PathRouter => {
  const navigate = useNavigate();
  const params = useParams();
  const push = useCallback(
    (type: 'push' | 'replace') =>
      (id: string, customParams?: { [key: string]: string | undefined }) => {
        const newParams = { ...(params || {}), ...(customParams || {}) };
        const path = getPath(id, newParams);
        if (!path) {
          throw new Error(`Path with id ${id} not found`);
        }
        if (type === 'push') {
          navigate(path.to);
        } else {
          navigate(path.to, { replace: true });
        }
      },
    [navigate, params]
  );

  return useMemo(() => {
    return {
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: push('push'),
      replace: push('replace'),
      prefetch: () => {},
    };
  }, [navigate, push]);
};

export default usePathRouter;
