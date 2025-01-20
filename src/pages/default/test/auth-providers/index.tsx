import config from '@/config';
import { FirebaseAuthProvider, useLoginForm } from '@/libs/auth';
import { Button, Card, CardActions, CardContent, CardHeader, Grid, TextField } from '@mui/material';
import DefaultPage from '../../DefaultPage';

const authProviders: { [key: string]: any } = {
  Firebase: new FirebaseAuthProvider({
    login: config.paths.auth.login,
    logout: config.paths.auth.logout,
  }),
  // /Composite: new CompositeAuthProvider(),
};

const AuthProvider = (props: { providerName: string }) => {
  const loginForm = useLoginForm(authProviders[props.providerName], { mode: 'signin' });
  const { providerName } = props;
  console.log(props, providerName, loginForm);
  const user = authProviders[providerName].getCurrentUser();
  return (
    <Card>
      <CardHeader title={providerName} />
      <CardContent>
        Current logged in user: {user?.name} <br />
        <br />
        <TextField
          margin="dense"
          fullWidth
          {...loginForm.fields.email}
        />
        <TextField
          margin="dense"
          fullWidth
          {...loginForm.fields.password}
        />
        <TextField
          margin="dense"
          fullWidth
          {...loginForm.fields.confirmPassword}
        />
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          {...loginForm.buttons.login}
        >
          Login
        </Button>
        <Button
          variant="contained"
          {...loginForm.buttons.loginDemoUser}
        >
          Log in demo user
        </Button>
      </CardActions>
    </Card>
  );
};

const TestAuthProviders = () => {
  return (
    <DefaultPage>
      <Grid
        container
        spacing={3}
      >
        {authProviders &&
          Object.keys(authProviders).map((providerName) => {
            return (
              <Grid
                item
                xs={12}
                md={6}
                key={providerName}
              >
                <AuthProvider providerName={providerName} />
              </Grid>
            );
          })}
      </Grid>
    </DefaultPage>
  );
};

export default TestAuthProviders;
