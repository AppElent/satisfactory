import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import Account from '@/pages/default/account';
import FileUploads from '@/pages/default/test/file-uploads';

import { CustomRouteObject } from '@/config/routing';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';

const appRoutes: CustomRouteObject[] = [
  {
    id: 'account',
    label: 'Account',
    Icon: <PeopleIcon fontSize="inherit" />,
    category: 'settings',
    path: 'account',
    element: <Account />,
  },
  {
    id: 'profile',
    label: 'Profile',
    Icon: <PeopleIcon fontSize="inherit" />,
    category: 'settings',
    path: 'profile',
    element: <div>Profile</div>,
  },
  {
    id: 'testPages',
    label: 'Test pages',
    Icon: <QuizIcon />,
    path: 'test',
    element: (
      <Suspense>
        <Outlet />
      </Suspense>
    ),
    children: [
      { id: 'testPagesIndex', index: true, element: <div>Test pages</div> },
      {
        id: 'testDataSources',
        label: 'Data sources',
        Icon: <QuizIcon />,
        category: 'test',
        path: 'data-sources',
        // element: <DataSources />,
      },
      {
        id: 'testFileUploads',
        label: 'File uploads',
        Icon: <QuizIcon />,
        category: 'test',
        path: 'file-uploads',
        element: <FileUploads />,
      },
      {
        id: 'testAuthProviders',
        label: 'Auth providers',
        Icon: <QuizIcon />,
        category: 'test',
        path: 'auth-providers',
        // element: <TestAuthProviders />,
      },
      {
        id: 'testForms',
        label: 'Forms',
        Icon: <QuizIcon />,
        category: 'test',
        path: 'forms',
        // element: <Forms />,
      },
      {
        id: 'testTranslations',
        label: 'Translations',
        Icon: <QuizIcon />,
        category: 'test',
        path: 'translations',
        // element: <Translations />,
      },
    ],
  },
  {
    id: 'terms',
    label: 'Terms and conditions',
    Icon: <PeopleIcon fontSize="inherit" />,
    path: 'terms',
    // element: <div>Terms and conditions</div>,
  },
  {
    id: 'privacy',
    label: 'Privacy statement',
    Icon: <PeopleIcon fontSize="inherit" />,
    path: 'privacy',
    // element: <div>Privacy</div>,
  },
  {
    id: 'login',
    label: 'Login',
    Icon: <PeopleIcon fontSize="inherit" />,
    path: 'login',
    // element: <SignIn mode="signin" />,
  },
  {
    id: 'signup',
    label: 'Signup',
    Icon: <PeopleIcon fontSize="inherit" />,
    path: 'signup',
    // element: <SignIn mode="signup" />,
  },
  {
    id: '404',
    label: '404',
    Icon: <PeopleIcon fontSize="inherit" />,
    path: '*',
    // element: <NotFound />,
  },
];

export default appRoutes;
