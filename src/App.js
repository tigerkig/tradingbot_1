import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
// routes
import Router from './routes';
// theme
import ThemeConfig from './theme';

// components
import Settings from './components/settings';
import RtlLayout from './components/RtlLayout';
import ScrollToTop from './components/ScrollToTop';
import NotistackProvider from './components/NotistackProvider';
import ThemePrimaryColor from './components/ThemePrimaryColor';
import ThemeLocalization from './components/ThemeLocalization';

// ----------------------------------------------------------------------
import { switchNetwork } from './redux/slices/network';
import { setupNetwork } from './utils/wallet';
import useEagerConnect from './hooks/useEagerConnect';

export default function App() {
  const dispatch = useDispatch();
  useEagerConnect();
  const { search } = useLocation();
  const chainId = new URLSearchParams(search).get('chainId');
  // console.log(chainId);
  const provider = window.ethereum;

  useEffect(() => {
    if (provider) {
      (async () => {
        if (chainId) setupNetwork(chainId);
        // eslint-disable-next-line camelcase
        const provider_chainId = await provider.request({
          method: 'eth_chainId'
        });
        console.log(provider_chainId);
        dispatch(switchNetwork(provider_chainId));
      })();

      provider.on('chainChanged', (id) => {
        dispatch(switchNetwork(id));
      });
    }
  }, [dispatch, chainId, provider]);

  return (
    <ThemeConfig>
      <ThemePrimaryColor>
        <ThemeLocalization>
          <RtlLayout>
            <NotistackProvider>
              <Settings />
              <ScrollToTop />
              <Router />
            </NotistackProvider>
          </RtlLayout>
        </ThemeLocalization>
      </ThemePrimaryColor>
    </ThemeConfig>
  );
}
