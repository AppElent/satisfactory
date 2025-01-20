import { useSearchParams as _useSearchParams } from 'react-router-dom';

/**
 * Returns ReadOnly search params
 */
const useSearchParams = (): URLSearchParams => {
  const [searchParams] = _useSearchParams();

  return searchParams;
};

export default useSearchParams;
