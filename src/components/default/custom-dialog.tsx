import Dialog, { DialogProps } from '@mui/material/Dialog';
import React from 'react';

interface CustomDialogProps<T> extends Partial<DialogProps> {
  data: T | undefined;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
  //   children: React.ReactNode;
}

const CustomDialog = <T,>({ data, setData, children }: CustomDialogProps<T>) => {
  const handleClose = () => setData(undefined);

  return (
    <Dialog
      open={Boolean(data)}
      onClose={handleClose}
      fullWidth
    >
      {children}
    </Dialog>
  );
};

export default CustomDialog;
