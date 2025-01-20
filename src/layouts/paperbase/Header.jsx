import LanguageSwitch from '@/components/default/layout/language-switch';
import UserMenu from '@/components/default/layout/user-menu';
import useRouter from '@/hooks/use-router';
import { useAuth } from '@/libs/auth';
import IssueDialog from '@/sections/default/issue-dialog';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AppBar from '@mui/material/AppBar';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import * as React from 'react';

function Header(props) {
  const { onDrawerToggle } = props;
  const auth = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (link) => () => {
    router.push(`/app/${link}`);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      <AppBar
        color="primary"
        position="sticky"
        elevation={0}
      >
        <Toolbar>
          <Grid
            container
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Grid
              sx={{ display: { sm: 'none', xs: 'block' } }}
              item
            >
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={onDrawerToggle}
                edge="start"
              >
                <MenuIcon />
              </IconButton>
            </Grid>
            <Grid
              item
              xs
            />
            <Grid item>
              <IssueDialog />
            </Grid>
            <Grid item>
              <LanguageSwitch />
            </Grid>
            <Grid item>
              <Tooltip title="Alerts • No alerts">
                <IconButton color="inherit">
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <UserMenu />
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
}

Header.propTypes = {
  onDrawerToggle: PropTypes.func.isRequired,
};

export default Header;
