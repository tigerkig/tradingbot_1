import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import { useSelector } from 'react-redux';
// material
import { Button } from '@mui/material';

import useAuth from '../../hooks/useAuth';
// components

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  console.log(network);
  const { onPresentConnectModal, onPresentAccountModal } = useWalletModal(
    auth.login,
    auth.logout,
    (t) => t,
    account,
    Number(network)
  );

  return (
    <>
      {account ? (
        <Button variant="contained" onClick={onPresentAccountModal} sx={{ bgcolor: 'primary.dark' }}>
          {`${account.substr(0, 4)}...${account.substr(account.length - 4, 4)}`}
        </Button>
      ) : (
        <Button variant="contained" onClick={onPresentConnectModal} sx={{ bgcolor: 'primary.dark' }}>
          Login
        </Button>
      )}

      {/* <MenuPopover open={open} onClose={handleClose} anchorEl={anchorRef.current} sx={{ width: 220 }}>
        <Box sx={{ my: 1.5, px: 2.5 }}>
          <Typography variant="subtitle1" noWrap>
            displayName
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            email
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {MENU_OPTIONS.map((option) => (
          <MenuItem
            key={option.label}
            to={option.linkTo}
            component={RouterLink}
            onClick={handleClose}
            sx={{ typography: 'body2', py: 1, px: 2.5 }}
          >
            <Box
              component={Icon}
              icon={option.icon}
              sx={{
                mr: 2,
                width: 24,
                height: 24
              }}
            />

            {option.label}
          </MenuItem>
        ))}

        <Box sx={{ p: 2, pt: 1.5 }}>
          <Button fullWidth color="inherit" variant="outlined">
            Logout
          </Button>
        </Box>
      </MenuPopover> */}
    </>
  );
}
