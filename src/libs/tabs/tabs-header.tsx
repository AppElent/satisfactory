import { Tab, TabProps, Tabs, TabsProps } from '@mui/material';
import { TabData } from '.';

interface TabsHeaderProps {
  currentTab: string;
  handleTabChange: (_e: any, newValue: any) => void;
  muiTabsProps?: TabsProps;
  muiTabProps?: TabProps;
  tabs: TabData[];
}

const TabsHeader = (props: TabsHeaderProps) => {
  const { currentTab, handleTabChange, tabs, muiTabsProps, muiTabProps } = props;
  return (
    <Tabs
      value={currentTab}
      onChange={handleTabChange}
      indicatorColor="secondary"
      textColor="primary"
      aria-label="full width tabs example"
      //centered
      variant="scrollable"
      scrollButtons="auto"
      {...muiTabsProps}
    >
      {tabs?.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          value={tab.value}
          {...muiTabProps}
        />
      ))}
    </Tabs>
  );
};

export default TabsHeader;
