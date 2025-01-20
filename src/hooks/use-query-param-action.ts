import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseQueryParamActionOptions {
  removeAfterAction?: boolean; // Whether to remove the query param after the callback
}

const useQueryParamAction = (
  queryParamName: string,
  callback: (value: string) => void,
  options: UseQueryParamActionOptions = { removeAfterAction: true }
) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paramValue = searchParams.get(queryParamName);

    if (paramValue) {
      callback(paramValue);

      if (options.removeAfterAction) {
        searchParams.delete(queryParamName);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    }
  }, [location.search, queryParamName, callback, navigate, options.removeAfterAction]);

  const clearQueryParam = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete(queryParamName);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  }, [location.search, queryParamName, navigate]);

  return {
    clearQueryParam, // Provide a function to manually clear the query parameter
  };
};

export default useQueryParamAction;
