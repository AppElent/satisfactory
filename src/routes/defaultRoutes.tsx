import AuthGuard from '@/guards/auth-guard';
import Layout from '@/layouts/simple/layout';
import SignIn from '@/pages/default/SignIn';
import { Suspense } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

const defaultRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AuthGuard options={{ shouldBeAuthenticated: true, login: '/login' }}>
        <Layout>
          <Suspense>
            <Outlet />
          </Suspense>
        </Layout>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <div>Index</div>,
      },
      {
        path: 'terms',
        element: <div>Terms and conditions</div>,
      },
      {
        path: 'privacy',
        element: <div>Privacy</div>,
      },
      {
        path: 'login',
        element: <SignIn mode="signin" />,
      },
      {
        path: 'signup',
        element: <SignIn mode="signup" />,
      },
    ],
  },
  {
    path: '/',
    element: <div>Index</div>,
  },
  {
    path: 'terms',
    element: <div>Terms and conditions</div>,
  },
  {
    path: 'privacy',
    element: <div>Privacy</div>,
  },
  {
    path: 'login',
    element: <SignIn mode="signin" />,
  },
  {
    path: 'signup',
    element: <SignIn mode="signup" />,
  },
];

export default defaultRoutes;
