// @ts-nocheck

import {
  AccountCircle,
  RssFeed as BlogIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Book as RecipeIcon,
  Star as TopIcon,
  CalendarToday as WeeklyMenuIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemIcon,
  List as MUIList,
  ListItemText as MUIListItemText,
  Menu,
  MenuItem,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import theme from './theme';

const Layout = ({ children }: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMenuCollapsed = useMediaQuery(theme.breakpoints.down('menu'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    handleClose();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    handleClose();
  };

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: 'center' }}
    >
      <Typography
        variant="h6"
        sx={{ my: 2 }}
      >
        Leuke Recepten
      </Typography>
      <Divider />
      <MUIList>
        {['Home', 'Recipes', 'Weekly Menu', 'Top 10', 'Blogs'].map((text, index) => (
          <ListItemButton
            key={text}
            sx={{ textAlign: 'center' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', mr: 3 }}>
              {index === 0 && <HomeIcon />}
              {index === 1 && <RecipeIcon />}
              {index === 2 && <WeeklyMenuIcon />}
              {index === 3 && <TopIcon />}
              {index === 4 && <BlogIcon />}
            </ListItemIcon>
            <MUIListItemText primary={text} />
          </ListItemButton>
        ))}
      </MUIList>
    </Box>
  );

  return (
    <>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar
            position="sticky"
            color="primary"
          >
            <Toolbar>
              {isMenuCollapsed && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <img
                  src="https://public.blob.vercel-storage.com/OoYC9GRxQKLLyYtdkQwzSMun6zzHb5/leuke-recepten-logo-2TDhRUGXzZoOZZi2oRxnqrVIBCeaAd.png"
                  alt="Leuke Recepten Logo"
                  style={{ width: '40px', height: '40px', marginRight: '10px' }}
                />
                <Typography
                  variant="h6"
                  component="div"
                >
                  Leuke Recepten
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {['Home', 'Recipes', 'Weekly Menu', 'Top 10', 'Blogs'].map((item) => (
                  <Button
                    key={item}
                    sx={{ color: '#fff' }}
                  >
                    {item}
                  </Button>
                ))}
              </Box>
              {/* <Select
            value={language}
            onChange={handleLanguageChange}
            sx={{
              color: 'white',
              '&:before': { borderColor: 'white' },
              '&:after': { borderColor: 'white' },
              '& .MuiSvgIcon-root': { color: 'white' },
              mr: 2,
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
            IconComponent={LanguageIcon}
          >
            {languages.map((lang) => (
              <MenuItem
                key={lang.code}
                value={lang.code}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img
                    src={lang.flag}
                    alt={`${lang.name} flag`}
                    style={{ width: 24, height: 16, objectFit: 'cover' }}
                  />
                  {lang.name}
                </Box>
              </MenuItem>
            ))}
          </Select> */}
              <div>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  {isLoggedIn ? (
                    [
                      <MenuItem
                        key="account"
                        onClick={handleClose}
                      >
                        Account
                      </MenuItem>,
                      <MenuItem
                        key="profile"
                        onClick={handleClose}
                      >
                        Profile
                      </MenuItem>,
                      <MenuItem
                        key="logout"
                        onClick={handleLogout}
                      >
                        Logout
                      </MenuItem>,
                    ]
                  ) : (
                    <MenuItem onClick={handleLogin}>Login</MenuItem>
                  )}
                </Menu>
              </div>
            </Toolbar>
          </AppBar>
          <Box component="nav">
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
          {children}
        </Box>
      </ThemeProvider>
    </>
  );
};

export default Layout;
