import useTabs, { TabOptions } from '@/hooks/use-tabs';
import { Box, BoxProps, TabsProps as DTabsProps, TabProps, useTheme } from '@mui/material';
import { CurrentTabContext, TabData } from '.';
import TabPanel from './tab-panel';
import TabsHeader from './tabs-header';

interface TabsProps {
  tabOptions?: TabOptions;
  tabs: TabData[];
  muiBoxProps?: BoxProps;
  muiTabsProps?: DTabsProps;
  muiTabProps?: TabProps;
}

const Tabs = ({ tabs, tabOptions, muiBoxProps, muiTabProps, muiTabsProps }: TabsProps) => {
  const theme = useTheme();
  const { tab: currentTab, handleTabChange, setTab } = useTabs(tabs, tabOptions);
  //   const [value, setValue] = React.useState(0);

  //TODO: version2.....

  return (
    <CurrentTabContext.Provider value={{ tabs, currentTab, handleTabChange, setTab }}>
      <Box
        sx={{ bgcolor: 'background.paper' }}
        {...muiBoxProps}
      >
        <TabsHeader
          currentTab={currentTab}
          handleTabChange={handleTabChange}
          tabs={tabs}
          muiTabsProps={muiTabsProps}
          muiTabProps={muiTabProps}
        />
        {tabs?.map((tab, index) => {
          return (
            <TabPanel
              key={tab.value}
              value={tab.value}
              index={index}
              currentTab={currentTab}
              dir={theme.direction}
            >
              {tab.value === currentTab && tab.component}
            </TabPanel>
          );
        })}
      </Box>
    </CurrentTabContext.Provider>
  );
};

export default Tabs;
