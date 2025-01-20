import { getPath } from '@/config/paths';
import { usePopover } from '@/hooks/use-popover';
import useRouter from '@/hooks/use-router';
import { useAuth } from '@/libs/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { Avatar, IconButton, ListItemIcon, MenuItem, Tooltip } from '@mui/material';
import CustomPopover from '../custom-popover';
import GuestAvatar from '../guest-avatar';

const menuItemsAuthenticated = [
  {
    id: 'account',
    label: 'Account',
    icon: AccountCircleIcon,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: SettingsIcon,
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogoutIcon,
  },
];

const menuItemsUnauthenticated = [
  {
    id: 'login',
    label: 'Login',
    icon: AccountCircleIcon,
  },
  {
    id: 'signup',
    label: 'Signup',
    icon: SettingsIcon,
  },
];

const UserMenu = () => {
  const popover = usePopover();
  const auth = useAuth();
  const router = useRouter();

  const handleMenuItemClick = (link: string) => async () => {
    if (link === 'logout') {
      await auth.signOut();
    } else {
      const path = getPath(link);
      if (!path) console.error(`Path with ID ${link} not found`);
      router.push(path?.to || `/${link}`);
    }

    popover.handleClose();
  };

  const items = auth.isAuthenticated ? menuItemsAuthenticated : menuItemsUnauthenticated;

  return (
    <>
      <Tooltip title="User">
        <IconButton
          color="inherit"
          sx={{ p: 0.5 }}
          onClick={popover.handleOpen}
          ref={popover.anchorRef}
        >
          {!auth.user ? (
            <GuestAvatar />
          ) : (
            <Avatar
              src={auth?.user?.avatar || '/static/images/avatar/1.jpg'}
              alt={auth.user?.name || 'A'}
            />
          )}
        </IconButton>
      </Tooltip>

      <CustomPopover
        anchorEl={popover.anchorRef.current}
        open={popover.open}
        onClose={popover.handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {items.map((item) => {
          return (
            <MenuItem
              onClick={handleMenuItemClick(item.id)}
              key={item.id}
            >
              <ListItemIcon>
                <item.icon fontSize="small" />
              </ListItemIcon>
              {item.label}
            </MenuItem>
          );
        })}
        {/* <MenuItem onClick={handleMenuItemClick('account')}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Account
        </MenuItem>
        <MenuItem onClick={handleMenuItemClick('profile')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={auth.signOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem> */}
      </CustomPopover>
    </>
  );
};

export default UserMenu;
