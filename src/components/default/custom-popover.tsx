import Popover, { PopoverProps } from '@mui/material/Popover';

// interface CustomPopoverProps extends PopoverProps {
//   children: React.ReactNode;
// }

export const CustomPopover = (props: PopoverProps) => {
  const { children, ...other } = props;
  //const popover = usePopover();

  return (
    <Popover
      //anchorEl={popover.anchorRef.current}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'bottom',
      }}
      disableScrollLock
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
      //onClose={popover.handleClose}
      //open={popover.open}
      //PaperProps={{ sx: { width: 220 } }}
      {...other}
    >
      {children}
      {/* {options.map((option) => {
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
      })} */}
    </Popover>
  );
};

export default CustomPopover;
