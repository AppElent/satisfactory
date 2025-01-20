import { createContext } from 'react';
import Tabs from './tabs';

// Tabs data
export interface TabData {
  label: string;
  value: string;
  component?: JSX.Element;
}

// Context to share current tab information
interface CurrentTabContextProps {
  tabs: TabData[];
  currentTab: string;
  handleTabChange: (event: React.ChangeEvent<any>, newValue: string) => void;
  setTab: (tab: string) => void;
}
export const CurrentTabContext = createContext<CurrentTabContextProps | undefined>(undefined);

export { default as useCurrentTab } from './use-current-tab';
export { default as useTabs } from './use-tabs';

export default Tabs;
