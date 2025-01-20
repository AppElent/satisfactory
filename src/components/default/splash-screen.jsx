import { Backdrop, CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';

export const SplashScreen = () => (
  <Box
    sx={{
      alignItems: 'center',
      backgroundColor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      justifyContent: 'center',
      left: 0,
      p: 3,
      position: 'fixed',
      top: 0,
      width: '100vw',
      zIndex: 1400,
    }}
  >
    {/* <Box
      sx={{
        display: 'inline-flex',
        height: 48,
        width: 48,
      }}
    > */}
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={true}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
    {/* </Box> */}
  </Box>
);
