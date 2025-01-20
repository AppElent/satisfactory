import '@/libs/i18n';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <HelmetProvider>
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <App />
    </BrowserRouter>
    {/* <RouterProvider router={router} /> */}
    {/* <App /> */}
  </HelmetProvider>
  // </StrictMode>,
);
