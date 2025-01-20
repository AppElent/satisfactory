import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Avatar from '@mui/material/Avatar';

import React from 'react';

const GuestAvatar: React.FC = () => {
  return (
    <Avatar sx={{ color: 'white' }}>
      <PersonOutlineIcon />
    </Avatar>
  );
};

export default GuestAvatar;
