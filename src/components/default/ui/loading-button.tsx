import { Button, CircularProgress } from '@mui/material';

function LoadingButton({
  isLoading,
  onClick,
  children = 'Submit',
  ...props
}: {
  isLoading: boolean;
  onClick: () => void;
  children?: any;
  [key: string]: any;
}) {
  return (
    <Button
      variant="contained"
      color="primary"
      disabled={isLoading}
      onClick={onClick}
      {...props}
      startIcon={
        isLoading ? (
          <CircularProgress
            size={20}
            color="inherit"
          />
        ) : null
      }
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  );
}

export default LoadingButton;
