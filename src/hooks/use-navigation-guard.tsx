import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useNavigationGuard = (when: boolean, message: string) => {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);

  const handleNavigation = useCallback(() => {
    if (nextLocation) {
      setShowDialog(false);
      navigate(nextLocation);
    }
  }, [navigate, nextLocation]);

  const handleBlocker = useCallback(
    (event: BeforeUnloadEvent) => {
      if (when) {
        event.preventDefault();
        event.returnValue = message;
      }
    },
    [when, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBlocker);

    return () => {
      window.removeEventListener('beforeunload', handleBlocker);
    };
  }, [handleBlocker]);

  const confirmNavigation = (path: string) => {
    setNextLocation(path);
    setShowDialog(true);
  };

  return { showDialog, setShowDialog, confirmNavigation, handleNavigation };
};

export default useNavigationGuard;
