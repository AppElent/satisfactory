import { useCallback } from 'react';
import { StringParam, useQueryParam } from 'use-query-params';

interface TabData {
  label: string;
  value: string;
}

interface useTabsProps {
  initialData?: any;
  queryParamName: string;
}

interface useTabsReturn {
  tab: string;
  setTab: (value: string) => void;
  handleTabChange: (event: any, newValue: string) => void;
}

/**
 * Custom hook to manage tabs with query parameter support
 * @param {TabData[]} tabsData - Array of tab data
 * @param {Object} options - Options for the hook
 * @param {string} [options.initialData] - Initial data for the tab
 * @param {string} [options.queryParamName='tab'] - Query parameter name
 * @returns {Array} - Current tab and function to set the tab
 */
const useQueryTabs = (tabsData: TabData[], options?: useTabsProps): useTabsReturn => {
  const { initialData, queryParamName = 'tab' } = options || {};
  const [tabQuery, setTabQuery] = useQueryParam(queryParamName, StringParam);

  const getValue = () => {
    if (tabQuery) {
      return tabQuery;
    } else if (initialData) {
      return initialData;
    } else {
      if (tabsData && tabsData.length > 0) {
        return tabsData[0].value;
      }
    }
  };

  const handleTabChange = useCallback(
    (_e: any, newValue: any) => {
      setTabQuery(newValue);
    },
    [setTabQuery]
  );

  return { tab: getValue(), setTab: setTabQuery, handleTabChange };
};

export default useQueryTabs;
