import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';

interface ImageViewerDialogProps {
  image: string | undefined;
  onClose: () => void;
  actions: [
    {
      label: string;
      onClick: (src?: string) => void;
    },
  ];
}

const ImageViewerDialog = ({ image, onClose, actions }: ImageViewerDialogProps) => {
  return (
    <Dialog
      open={Boolean(image)}
      onClose={onClose}
      maxWidth="md"
    >
      <DialogContent>
        {image && (
          <img
            src={image}
            alt="Full size"
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        {actions.map((action, index) => {
          return (
            <Button
              key={index}
              disabled={!image}
              onClick={() => {
                action.onClick(image);
              }}
              color="primary"
            >
              {action.label}
            </Button>
          );
        })}
        {/* <Button
          disabled={!image}
          onClick={() => onClick(src)}
          color="primary"
        >
          Set as main image
        </Button> */}
      </DialogActions>
    </Dialog>
  );
};

export default ImageViewerDialog;
