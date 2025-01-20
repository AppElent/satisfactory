import { GoogleIcon } from '@/components/default/auth/CustomIcons';
import ForgotPassword from '@/components/default/auth/ForgotPassword';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import * as React from 'react';
//import AppTheme from '@/theme/AppTheme';
import ColorModeSelect from '@/components/default/ColorModeSelect';
import config from '@/config';
import useMounted from '@/hooks/use-mounted';
import useRouter from '@/hooks/use-router';
import useSearchParams from '@/hooks/use-search-params';
import { useAuth, useLoginForm } from '@/libs/auth';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  padding: 20,
  minHeight: '80vhvh',
  //minWidth: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  width: '100%',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const isMounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { /*issuer,*/ signInWithEmailAndPassword, signUp /*, signInWithGoogle*/, provider } =
    useAuth();

  const { mode, paths, ...themeProps } = props;
  const { authProvider, formik, fields, buttons } = useLoginForm(provider, {
    mode,
    redirectAfterLogin: config.paths.auth.redirectAfterLogin,
  });

  const { text: loginButtonText, ...loginButtonProps } = buttons.login;

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    // <AppTheme {...themeProps}>
    <>
      <CssBaseline enableColorScheme />
      <SignInContainer
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <img
            src={'/app/default_logo_transparent.png'}
            style={{ width: '50%', height: 'auto' }}
          />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Typography>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                {...fields.email}
                required
                fullWidth
                variant="outlined"
                autoComplete="email"
              />
            </FormControl>
            {mode === 'signup' && (
              <FormControl>
                <FormLabel htmlFor="email">Confirm e-mail</FormLabel>
                <TextField
                  {...fields.confirmEmail}
                  required
                  fullWidth
                  variant="outlined"
                  autoComplete="email"
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                {...fields.password}
                required
                fullWidth
                variant="outlined"
              />
            </FormControl>
            {mode === 'signin' && (
              <Link
                component="button"
                onClick={handleClickOpen}
                variant="body2"
                sx={{ alignSelf: 'baseline' }}
              >
                Forgot your password?
              </Link>
            )}
            {mode === 'signup' && (
              <FormControl>
                <FormLabel htmlFor="password">Confirm password</FormLabel>
                <TextField
                  {...fields.confirmPassword}
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
            )}

            {/* {mode === 'signin' && (
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    color="primary"
                  />
                }
                label="Remember me"
              />
            )} */}

            <ForgotPassword
              open={open}
              handleClose={handleClose}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              {...loginButtonProps}
            >
              {loginButtonText}
            </Button>
            {mode === 'signin' ? (
              <Typography sx={{ textAlign: 'center' }}>
                Don&apos;t have an account?{' '}
                <span>
                  <Link
                    href="/signup"
                    variant="body2"
                    sx={{ alignSelf: 'center' }}
                  >
                    Sign up
                  </Link>
                </span>
              </Typography>
            ) : (
              <Typography sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <span>
                  <Link
                    href="/login"
                    variant="body2"
                    sx={{ alignSelf: 'center' }}
                  >
                    Sign in
                  </Link>
                </span>
              </Typography>
            )}
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              fullWidth
              disabled
              variant="outlined"
              {...buttons.google}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled
              variant="outlined"
              // spread all props of buttons.facebook except text property
              {...buttons.facebook}
            >
              Sign in with Facebook
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              // spread all props of buttons.facebook except text property
              {...buttons.loginDemoUser}
            >
              Login with demo account
            </Button>
          </Box>
        </Card>
      </SignInContainer>
      {/* </AppTheme> */}
    </>
  );
}

SignIn.propTypes = {
  mode: PropTypes.any,
};
