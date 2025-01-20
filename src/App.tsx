import ScrollToTop from '@/components/default/scroll-to-top';
import '@/config/firebase';
import routes from '@/config/routes';
import { FirebaseAuthProvider } from '@/libs/auth';
import LocalStorageDataSource from '@/libs/data-sources/data-sources/LocalStorageDataSource';

import theme from '@/theme/paperbase/theme';
import './App.css';
import config from './config';
import { getPath } from './config/paths';
import Dashboard from './Dashboard';

const firebaseProvider = new FirebaseAuthProvider({
  login: getPath('login').to,
  logout: '/logout',
});

const dataSources = {
  settings: new LocalStorageDataSource({ target: 'settings', targetMode: 'document' }),
};

function App() {
  console.log('App config', firebaseProvider, dataSources, routes, config);
  return (
    <>
      <ScrollToTop />

      <Dashboard
        theme={theme}
        authProvider={firebaseProvider}
        routes={routes}
        dataSources={dataSources}
      />
    </>
  );
}

export default App;
