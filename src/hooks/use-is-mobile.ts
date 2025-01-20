import { useMediaQuery, useTheme } from '@mui/material';

const useIsMobile = () => {
  // Theme and media query
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  return fullScreen;
};

export default useIsMobile;
