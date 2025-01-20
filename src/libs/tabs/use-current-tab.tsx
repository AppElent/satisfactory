import { useContext } from 'react';
import { CurrentTabContext } from '.';

// Custom hook to use the current tab context
const useCurrentTab = () => {
  const context = useContext(CurrentTabContext);
  if (!context) {
    throw new Error('useCurrentTab must be used within a Tabs component');
  }
  return context;
};

export default useCurrentTab;
