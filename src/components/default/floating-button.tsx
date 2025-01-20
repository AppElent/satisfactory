import AddIcon from '@mui/icons-material/Add'; // Import AddIcon
import { Fab, FabProps, Tooltip } from '@mui/material';

interface FloatingButtonProps {
  handleAdd: () => void;
  muiFabProps?: FabProps;
  children?: React.ReactNode;
}

const FloatingButton = ({ handleAdd, muiFabProps, children }: FloatingButtonProps) => {
  return (
    <Fab
      color="primary"
      aria-label="add"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      onClick={handleAdd}
      {...muiFabProps}
    >
      {children ? (
        children
      ) : (
        <Tooltip
          title="Add"
          placement="left"
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 14],
                  },
                },
              ],
            },
          }}
        >
          <AddIcon />
        </Tooltip>
      )}
    </Fab>
  );
};

export default FloatingButton;
