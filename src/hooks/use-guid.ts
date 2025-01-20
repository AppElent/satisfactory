import { useMemo } from 'react';

const useGuid = () => {
  const guid = useMemo(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);
  return guid;
};

export default useGuid;
