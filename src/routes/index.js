import { Suspense, lazy } from 'react';
import { Navigate, useRoutes, useLocation } from 'react-router-dom';
// layouts
import MainLayout from '../layouts/main';
import DashboardLayout from '../layouts/dashboard';
import LogoOnlyLayout from '../layouts/LogoOnlyLayout';
// components
import LoadingScreen from '../components/LoadingScreen';

// ----------------------------------------------------------------------

const Loadable = (Component) => (props) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { pathname } = useLocation();
  const isDashboard = pathname.includes('/dashboard');

  return (
    <Suspense
      fallback={
        <LoadingScreen
          sx={{
            ...(!isDashboard && {
              top: 0,
              left: 0,
              width: 1,
              zIndex: 9999,
              position: 'fixed'
            })
          }}
        />
      }
    >
      <Component {...props} />
    </Suspense>
  );
};

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { path: '/', element: <Navigate to="/exchange" replace /> },
        { path: '/exchange', element: <ExchangeToken /> },
        { path: '/bridge', element: <BridgeToken /> },
        { path: '/staking', element: <Staking /> },
        { path: '/lp-farming', element: <LpFarming /> },
        {
          path: '/governance',
          children: [
            { path: '/', element: <Governance /> },
            { path: 'create-proposal', element: <CreateProposal /> },
            { path: 'proposal/:proposalId', element: <Proposal /> }
          ]
        },
        { path: '/wrap', element: <Wrap /> }
      ]
    },

    // Main Routes
    {
      path: '*',
      element: <LogoOnlyLayout />,
      children: [
        { path: '500', element: <Page500 /> },
        { path: '404', element: <NotFound /> },
        { path: '*', element: <Navigate to="/404" replace /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> },
    {
      path: '/',
      element: <MainLayout />,
      children: [{ path: '/', element: <Navigate to="/exchange" replace /> }]
    }
  ]);
}

// IMPORT COMPONENTS

const ExchangeToken = Loadable(lazy(() => import('../pages/ExchangeToken')));
const BridgeToken = Loadable(lazy(() => import('../pages/BridgeToken')));
const Staking = Loadable(lazy(() => import('../pages/Staking')));
const LpFarming = Loadable(lazy(() => import('../pages/LpFarming')));
const Governance = Loadable(lazy(() => import('../pages/Governance')));
const CreateProposal = Loadable(lazy(() => import('../pages/governance/CreateProposal')));
const Proposal = Loadable(lazy(() => import('../pages/governance/Proposal')));
const Wrap = Loadable(lazy(() => import('../pages/Wrap')));

// Main
const Page500 = Loadable(lazy(() => import('../pages/Page500')));
const NotFound = Loadable(lazy(() => import('../pages/Page404')));
