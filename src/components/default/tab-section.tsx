import { AppBar, Box, IconButton, Stack, Tab, Tabs, Tooltip } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Tab data type
 */
interface TabData {
  value: string | number;
  label: string;
}

/**
 * Tabs props type
 */
interface TabsProps {
  tab: string | number;
  tabsData: TabData[];
  handleTabChange: (event: React.SyntheticEvent, newValue: string | number) => void;
}

/**
 * Button props type
 */
interface ButtonProps {
  tooltip: string;
  icon: React.ReactElement;
  onClick: () => void;
}

/**
 * TabSection props type
 */
interface TabSectionProps {
  tabs?: TabsProps;
  buttons?: ButtonProps[];
}

/**
 * TabSection component
 * @param {TabSectionProps} props - The props for the component
 * @returns {JSX.Element} The TabSection component
 */
const TabSection: React.FC<TabSectionProps> = ({ tabs, buttons }) => {
  return (
    <AppBar
      component="div"
      position="static"
      elevation={0}
      sx={{ zIndex: 0 }}
    >
      <Stack
        direction="row"
        justifyContent={'space-between'}
        spacing={1}
      >
        <Box>
          {tabs && (
            <Tabs
              indicatorColor="primary"
              onChange={tabs.handleTabChange}
              scrollButtons="auto"
              textColor="inherit"
              value={tabs.tab}
              variant="scrollable"
            >
              {tabs.tabsData?.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                />
              ))}
            </Tabs>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
        >
          {buttons?.map((button) => {
            return (
              <Tooltip
                title={button.tooltip}
                placement="top"
                key={button.tooltip}
              >
                <IconButton onClick={button.onClick}>{button.icon}</IconButton>
              </Tooltip>
            );
          })}
        </Stack>
      </Stack>
    </AppBar>
  );
};

TabSection.propTypes = {
  tabs: PropTypes.any,
  buttons: PropTypes.array,
};

export default TabSection;
