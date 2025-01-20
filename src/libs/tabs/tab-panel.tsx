interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  currentTab: string;
  value: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, currentTab, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== currentTab}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === currentTab && children}
    </div>
  );
}

export default TabPanel;
