import { Seo, setPageTitleSuffix } from '@/components/default/seo';
import { SplashScreen } from '@/components/default/splash-screen';
import config from '@/config';
import useHttpsRedirect from '@/hooks/use-https-redirect';
import { AuthConsumer, AuthProvider } from '@/libs/auth';
import '@/libs/i18n';
import defaultRoutes from '@/routes/defaultRoutes';
import { Theme, ThemeProvider } from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { FC, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { Bounce, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import ErrorBoundary from './components/default/error-boundary';
import useRouter from './hooks/use-router';
import { DataProvider, DataSourceObject } from './libs/data-sources';

interface DashboardProps {
  theme: Theme;
  routes?: any[];
  authProvider?: any;
  dataSources?: DataSourceObject;
}

const Dashboard: FC<DashboardProps> = ({ theme, routes, authProvider, dataSources }) => {
  //const { theme, routes, authProvider, dataSources } = props;
  // Redirect to HTTPS
  useHttpsRedirect(config?.paths?.httpsRedirect || false);

  // Issue dialog
  // const dialog = useDialog();
  // config.issueDialog = {
  //   open: dialog.open,
  //   close: dialog.close,
  // };

  // Custom redirect from root page
  const navigate = useRouter();
  useEffect(() => {
    if (config?.paths?.rootRedirect && window.location.pathname === '/')
      navigate.push(config.paths.rootRedirect);
  }, [navigate]);

  // Initialize routes
  const element = useRoutes(routes || defaultRoutes);

  // Set HTML page title suffix
  if (config?.meta?.title) setPageTitleSuffix(config?.meta?.title);
  return (
    <>
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <AuthProvider provider={authProvider}>
            <AuthConsumer>
              {(auth) => {
                // Check if splashscreen should be shown
                const showSlashScreen = !auth.isInitialized;
                if (showSlashScreen) return <SplashScreen />;

                return (
                  <>
                    <DataProvider dataSources={dataSources || {}}>
                      <QueryParamProvider adapter={ReactRouter6Adapter}>
                        <ConfirmProvider>
                          <Seo />
                          {/* <IssueDialog
                          onSave={(values) => console.log(values)}
                          open={dialog.isOpen}
                          onClose={() => dialog.close()}
                        /> */}
                          <ToastContainer
                            position="top-right"
                            autoClose={2500}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="light"
                            transition={Bounce}
                          />
                          {element}
                        </ConfirmProvider>
                      </QueryParamProvider>
                    </DataProvider>
                  </>
                );
              }}
            </AuthConsumer>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </>
  );
};

export default Dashboard;
