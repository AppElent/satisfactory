import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useFormik } from 'formik';
import * as Yup from 'yup';

function ForgotPassword({ open, handleClose }) {
  const validationSchema = Yup.object({
    email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
  });

  const formik = useFormik({
    initialValues: {},
    validationSchema,
    onSubmit: async (values) => {
      alert(values);
    },
  });
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          formik.handleSubmit();
          handleClose();
        },
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to reset your
          password.
        </DialogContentText>
        <OutlinedInput
          error={!!(formik.touched.email && formik.errors.email)}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
          value={formik.values.email}
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          type="submit"
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
