import { useRef, useState } from 'react';
// material
import { Box, MenuItem, Button, Stack, Typography, Hidden } from '@mui/material';
// components
import { useDispatch, useSelector } from 'react-redux';
import MenuPopover from '../../components/MenuPopover';
import { setupNetwork } from '../../utils/wallet';
import { switchNetwork } from '../../redux/slices/network';
// ----------------------------------------------------------------------

const CHAINS = [
  {
    value: Number(process.env.REACT_APP_BSC_CHAINID),
    label: 'Binance Smart Chain',
    short: 'BSC',
    icon: '/chains/bsc.png'
  },
  {
    value: Number(process.env.REACT_APP_ETHEREUM_CHAINID),
    label: 'Ethereum',
    short: 'ETH',
    icon: '/chains/eth.png'
  }
];

const TEST_CHAINS = [
  {
    value: Number(process.env.REACT_APP_BSC_CHAINID),
    label: 'BSC Testnet',
    short: 'BSC Testnet',
    icon: '/chains/bsc.png'
  },
  {
    value: Number(process.env.REACT_APP_ETHEREUM_CHAINID),
    label: 'Ropsten Testnet',
    short: 'Ropsten Testnet',
    icon: '/chains/eth.png'
  },
  {
    value: Number(process.env.REACT_APP_RINKEBY_CHAINID),
    label: 'Rinkeby Testnet',
    short: 'Rinkeby Testnet',
    icon: '/chains/eth.png'
  }
];

// ----------------------------------------------------------------------

export default function NetworkPopover() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const network = useSelector((state) => state.network.chainId);
  const dispatch = useDispatch();
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = async (id) => {
    console.log(id);
    setOpen(false);

    const result = await setupNetwork(id);
    if (result === -1) dispatch(switchNetwork(id));
  };

  return (
    <>
      <Hidden smDown>
        <Button
          variant="outlined"
          ref={anchorRef}
          onClick={handleOpen}
          sx={{ color: 'primary.dark', borderColor: 'primary.dark' }}
        >
          {(process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).find(
            (ele) => ele.value === Number(network)
          )
            ? (process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).find(
                (ele) => ele.value === Number(network)
              ).label
            : 'Not Supported'}
        </Button>
      </Hidden>

      <Hidden smUp>
        <Button
          variant="outlined"
          ref={anchorRef}
          onClick={handleOpen}
          sx={{ color: 'primary.dark', borderColor: 'primary.dark' }}
        >
          {(process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).find(
            (ele) => ele.value === Number(network)
          )
            ? (process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).find(
                (ele) => ele.value === Number(network)
              ).short
            : 'Not Supported'}
        </Button>
      </Hidden>

      <MenuPopover open={open} onClose={handleClose} anchorEl={anchorRef.current}>
        <Box sx={{ py: 1 }}>
          {(process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === network}
              onClick={() => handleClose(option.value)}
              sx={{ py: 1, px: 2.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box component="img" alt={option.label} src={option.icon} sx={{ width: 20 }} />
                <Typography variant="body2">{option.label}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Box>
      </MenuPopover>
    </>
  );
}
