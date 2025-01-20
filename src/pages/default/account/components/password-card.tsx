import { Button, Card, CardContent, CardHeader, TextField } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface PasswordCardProps {
  setPassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

// Yup validation schema for password
const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required(),
  newPassword: Yup.string().required(),
  confirmPassword: Yup.string().required(),
});

const PasswordCard = ({ setPassword }: PasswordCardProps) => {
  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      if (values.newPassword !== values.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      setPassword(values.currentPassword, values.newPassword);
    },
  });

  return (
    <Card>
      <CardHeader title="Account Settings" />
      <CardContent>
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          variant="outlined"
          {...formik.getFieldProps('currentPassword')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="New Password"
          type="password"
          variant="outlined"
          {...formik.getFieldProps('newPassword')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          variant="outlined"
          {...formik.getFieldProps('confirmPassword')}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
          onClick={() => formik.handleSubmit()}
        >
          Change Password
        </Button>
      </CardContent>
    </Card>
  );
};

export default PasswordCard;
