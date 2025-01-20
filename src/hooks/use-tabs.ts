import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface TabData {
  label: string;
  value: string;
}

export interface TabOptions {
  initialData?: string;
  queryParamName?: string;
}

const useTabs = (tabsData: TabData[], options?: TabOptions) => {
  const { initialData, queryParamName } = options || {};

  const [searchParams, setSearchParams] = useSearchParams();

  // Determine the initial tab value
  const initialTab = useMemo(() => {
    if (queryParamName && searchParams.has(queryParamName)) {
      const paramValue = searchParams.get(queryParamName);
      return tabsData.some((tab) => tab.value === paramValue) ? paramValue : initialData;
    }
    return initialData || tabsData[0]?.value;
  }, [queryParamName, searchParams, tabsData, initialData]);

  const [currentTab, setCurrentTab] = useState(initialTab || '');

  // Sync current tab with query param changes
  useEffect(() => {
    if (queryParamName && searchParams.has(queryParamName)) {
      const paramValue = searchParams.get(queryParamName);
      if (
        paramValue &&
        paramValue !== currentTab &&
        tabsData.some((tab) => tab.value === paramValue)
      ) {
        setCurrentTab(paramValue);
      }
    }
  }, [queryParamName, searchParams, currentTab, tabsData]);

  // Update query param on tab change
  const setTab = (newTab: string) => {
    setCurrentTab(newTab);
    if (queryParamName) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set(queryParamName, newTab);
      setSearchParams(newSearchParams);
    }
  };

  const handleTabChange = useCallback((_e: any, newValue: any) => {
    setTab(newValue);
  }, []);

  // const getValue = () => {
  //   if (queryParamName) {
  //     // If there is a query param named tab then set that tab
  //     const urlParams = new URLSearchParams(window.location.search);
  //     return urlParams.get(queryParamName);
  //   } else if (initialData) {
  //     return initialData;
  //   } else {
  //     if (tabsData && tabsData.length > 0) {
  //       return tabsData[0].value;
  //     }
  //   }
  // };
  // const [tab, setTab] = useState(getValue());
  // // TODO: fix this hook
  // const [query, setQuery] = [
  //   '',
  //   (value: any) => {
  //     console.log(value);
  //   },
  // ];

  // useEffect(() => {
  //   if (queryParamName) {
  //     // If there is a query param named tab then set that tab
  //     if (query) {
  //       setTab(query);
  //     }
  //   }
  // }, [queryParamName, query]);

  // const handleTabChange = useCallback((_e: any, newValue: any) => {
  //   if (queryParamName && setQuery) {
  //     setQuery(newValue);
  //   } else {
  //     setTab(newValue);
  //   }
  // }, []);

  return { tab: currentTab, handleTabChange, setTab, tabsData };
};

export default useTabs;
