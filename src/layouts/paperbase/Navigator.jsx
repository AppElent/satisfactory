import { ExpandLess, ExpandMore } from '@mui/icons-material';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import HomeIcon from '@mui/icons-material/Home';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import PhonelinkSetupIcon from '@mui/icons-material/PhonelinkSetup';
import PermMediaOutlinedIcon from '@mui/icons-material/PhotoSizeSelectActual';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import TimerIcon from '@mui/icons-material/Timer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

//import { OPTIONS } from '../../App';
import config from '@/config';
import { getPath, menu } from '@/config/paths';
import useRouter from '@/hooks/use-router';
import { useAuth } from '@/libs/auth';
import { Collapse } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const categories = [
  {
    id: 'Build',
    children: [
      {
        id: 'Authentication',
        icon: <PeopleIcon />,
        active: true,
      },
      { id: 'Database', icon: <DnsRoundedIcon /> },
      { id: 'Storage', icon: <PermMediaOutlinedIcon /> },
      { id: 'Hosting', icon: <PublicIcon /> },
      { id: 'Functions', icon: <SettingsEthernetIcon /> },
      {
        id: 'Machine learning',
        icon: <SettingsInputComponentIcon />,
      },
    ],
  },
  {
    id: 'Quality',
    children: [
      { id: 'Analytics', icon: <SettingsIcon /> },
      { id: 'Performance', icon: <TimerIcon /> },
      { id: 'Test Lab', icon: <PhonelinkSetupIcon /> },
    ],
  },
];

const item = {
  py: '2px',
  px: 3,
  color: 'rgba(255, 255, 255, 0.7)',
  '&:hover, &:focus': {
    bgcolor: 'rgba(255, 255, 255, 0.08)',
  },
};

const itemCategory = {
  boxShadow: '0 -1px 0 rgb(255,255,255,0.1) inset',
  py: 1.5,
  px: 3,
};

export default function Navigator(props) {
  const auth = useAuth();
  console.log(auth);
  const handleClick = (id) => {
    setOpen((prevOpen) => ({ ...prevOpen, [id]: !prevOpen[id] }));
  };
  const { closeDrawer, ...other } = props;
  const router = useRouter();
  const mainItems = menu || categories;
  // default value in mainItems[].collapsed
  const [open, setOpen] = useState(
    mainItems.reduce((acc, { id, collapsed }) => ({ ...acc, [id]: collapsed ?? false }), {})
  );

  const title = config?.meta?.title;
  const { t } = useTranslation();

  const homePath = getPath('home');

  const onLinkClick = (href) => {
    router.push(href);
    if (closeDrawer) {
      closeDrawer();
    }
  };

  return (
    <Drawer
      variant="permanent"
      {...other}
    >
      <List disablePadding>
        <ListItem sx={{ ...item, ...itemCategory, fontSize: 22, color: '#fff' }}>{title}</ListItem>
        <ListItem disablePadding>
          <ListItemButton
            selected={(homePath?.to || '/') === window.location.pathname}
            onClick={() => onLinkClick(homePath?.to || '/')}
            sx={item}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText>Home</ListItemText>
          </ListItemButton>
        </ListItem>
        {mainItems.map(({ id, label, translationKey, children, collapsed }) => (
          <Box
            key={id}
            sx={{ bgcolor: '#101F33' }}
          >
            <ListItemButton
              sx={{ py: 2, px: 3 }}
              // button
              onClick={() => handleClick(id)}
            >
              <ListItemText sx={{ color: '#fff' }}>
                {translationKey ? t(translationKey, { defaultValue: label }) : label}
              </ListItemText>
              {open[id] ? <ExpandLess color="primary" /> : <ExpandMore color="primary" />}
            </ListItemButton>
            <Collapse
              in={!open[id]}
              timeout="auto"
              unmountOnExit
            >
              {children.map(
                ({
                  id: childId,
                  label: childLabel,
                  translationKey: childTranslationKey,
                  to,
                  loginRequired,
                  Icon,
                }) => (
                  <ListItem
                    disablePadding
                    key={childId}
                  >
                    <ListItemButton
                      selected={to === window.location.pathname}
                      onClick={() => onLinkClick(to || '/')}
                      sx={item}
                    >
                      <ListItemIcon>{Icon}</ListItemIcon>
                      <ListItemText>
                        {childTranslationKey
                          ? t(childTranslationKey, { defaultValue: childLabel })
                          : childLabel}
                      </ListItemText>
                      {loginRequired && !auth.isAuthenticated && (
                        <LockIcon sx={{ color: '#bbb', fontSize: 18, ml: 1 }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                )
              )}
            </Collapse>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </List>
    </Drawer>
  );
}
