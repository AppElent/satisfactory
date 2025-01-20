import { CameraAlt as CameraAltIcon } from '@mui/icons-material';
import { Avatar, Button, Card, CardContent, CardHeader, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';

interface ProfileCardProps {
  profile: any;
  setProfile: (profile: any) => void;
}

const ProfileCard = ({ profile, setProfile }: ProfileCardProps) => {
  const formik = useFormik({
    initialValues: {
      name: profile?.name,
      email: profile?.email,
      avatarUrl: profile?.avatarUrl,
    },
    onSubmit: async (values: any) => {
      setProfile(values);
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        formik.setFieldValue('avatarUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader title="Profile Settings" />
      <CardContent>
        <Grid
          container
          spacing={2}
          alignItems="center"
        >
          <Grid item>
            <Avatar
              src={formik.values?.avatarUrl}
              alt="Profile Avatar"
              sx={{ width: 100, height: 100 }}
            />
          </Grid>
          <Grid item>
            <input
              accept="image/*"
              id="avatar-upload"
              type="file"
              hidden
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CameraAltIcon />}
              >
                Change Avatar
              </Button>
            </label>
          </Grid>
        </Grid>
        <TextField
          fullWidth
          label="Name"
          variant="outlined"
          {...formik.getFieldProps('name')}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          {...formik.getFieldProps('email')}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={(_e) => formik.handleSubmit()}
          disabled={formik.isSubmitting || !formik.dirty || !formik.isValid}
        >
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
