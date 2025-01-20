import { usePopover } from '@/hooks/use-popover';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import { t } from 'i18next';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import CustomPopover from '../custom-popover';

interface LanguageOptions {
  [key: string]: {
    icon: string;
    label: string;
    translationKey: string;
  };
}

const languageOptions: LanguageOptions = {
  en: {
    icon: '/assets/flags/flag-uk.svg',
    translationKey: 'common:language.english',
    label: 'English',
  },
  // de: {
  //   icon: '/assets/flags/flag-de.svg',
  //   label: 'German',
  // },
  // es: {
  //   icon: '/assets/flags/flag-es.svg',
  //   label: 'Spanish',
  // },
  nl: {
    icon: '/assets/flags/flag-nl.webp',
    translationKey: 'common:language.dutch',
    label: 'Nederlands',
  },
};

const LanguageSwitch = () => {
  const { i18n } = useTranslation();
  const popover = usePopover();

  const flag = languageOptions[i18n.language].icon;

  const handleClick = useCallback(
    async (language: string) => {
      popover?.handleClose();
      await i18n.changeLanguage(language);
      const message = t('misc.languageChanged');
      toast(message);
    },
    [popover, i18n]
  );

  const options = Object.keys(languageOptions).map((key) => ({
    id: key,
    label: languageOptions[key].label,
    translationKey: languageOptions[key].translationKey,
    icon: languageOptions[key].icon,
  }));

  return (
    <>
      <Tooltip title="Language">
        <IconButton
          onClick={popover.handleOpen}
          ref={popover.anchorRef}
        >
          <Box
            sx={{
              width: 28,
              '& img': {
                width: '100%',
              },
            }}
          >
            <img src={flag} />
          </Box>
        </IconButton>
      </Tooltip>
      {/* <LanguagePopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      /> */}
      <CustomPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
        // onClick={handleClick}
        // options={Object.keys(languageOptions).map((key) => ({
        //   id: key,
        //   label: languageOptions[key].label,
        //   translationKey: languageOptions[key].translationKey,
        //   icon: languageOptions[key].icon,
        // }))}
      >
        {options.map((option) => {
          return (
            <MenuItem
              onClick={() => handleClick(option.id)}
              key={option.id}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 28,
                    '& img': {
                      width: '100%',
                    },
                  }}
                >
                  <img
                    alt={option.label}
                    src={option.icon}
                  />
                </Box>
              </ListItemIcon>
              <ListItemText primary={<Typography variant="subtitle2">{option.label}</Typography>} />
            </MenuItem>
          );
        })}
      </CustomPopover>
    </>
  );
};

export default LanguageSwitch;
