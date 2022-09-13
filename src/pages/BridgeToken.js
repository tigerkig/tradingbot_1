/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-useless-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
/* eslint-disable no-empty */
import {
  Stack,
  Typography,
  Button,
  Card,
  Divider,
  TextField,
  Container,
  Select,
  MenuItem,
  Box,
  Link,
  styled
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import HashLoader from 'react-spinners/HashLoader';
import { useSnackbar } from 'notistack';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from 'ethers';
import Page from '../components/Page';
import { useTokenContract, useBridgeContract } from '../hooks/useContract';
import { BRIDGE_ADDRESS, TOKEN_ADDRESS } from '../config/constants';
import useAuth from '../hooks/useAuth';

const CardContainer = styled(Box)(({ theme }) => ({
  // borderRadius: 12,
  // background: 'rgba(255, 255, 255, 0.2)',
  transition: 'all .5s',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '860px',
  marginLeft: 'auto',
  marginRight: 'auto'
}));

export default function BridgeToken() {
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const [tokenError, setTokenError] = useState('');
  const [amount, setAmount] = useState(0);
  const [receiveAmount, setReceiveAmont] = useState(0);
  const [symbol, setSymbol] = useState('');
  const [amountError, setAmountError] = useState('');
  const token = TOKEN_ADDRESS[network];
  const tokenContract = useTokenContract(TOKEN_ADDRESS[network]);
  const bridgeContract = useBridgeContract();
  const [isParsing, setIsParsing] = useState(false);
  const [isTransfering, setIsTransfering] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  });
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
    }
  ];
  const [toNetwork, setToNetwork] = useState(
    process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS[0].value : CHAINS[0].value
  );

  useEffect(() => {
    const chains = process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS;
    if (network === toNetwork) {
      const selectNetwork = chains.find((chain) => chain.value !== network);
      setToNetwork(selectNetwork.value);
    }
  }, [network]);

  // amount banlance check
  useEffect(() => {
    if (
      tokenInfo.name &&
      tokenInfo.symbol &&
      tokenInfo.decimals > 0 &&
      tokenInfo.totalSupply > 0 &&
      tokenInfo.balanceOf > 0
    ) {
      if (amount > Number(formatUnits(tokenInfo.balanceOf, tokenInfo.decimals))) {
        setAmountError('More than balance!');
      } else setAmountError('');
    } else {
      setAmountError('');
    }
  }, [amount, tokenInfo, enqueueSnackbar]);

  useEffect(() => {
    let unmounted = false;

    setIsParsing(true);
    setTokenError('');
    (async () => {
      if (token !== '' && tokenContract !== null) {
        let name;
        let symbol;
        let decimals;
        let totalSupply;
        let balanceOf;
        try {
          name = await tokenContract.name();
          symbol = await tokenContract.symbol();
          decimals = await tokenContract.decimals();
          totalSupply = await tokenContract.totalSupply();
          balanceOf = await tokenContract.balanceOf(account);
        } catch (err) {
          if (!unmounted) {
            setTokenInfo({
              name: '',
              symbol: '',
              decimals: 0,
              totalSupply: 0,
              balanceOf: 0
            });
            // setTokenError('Invalid token address');
            setIsParsing(false);
            return;
          }
        }

        if (!unmounted) {
          setTokenInfo({ name, symbol, totalSupply, decimals, balanceOf });
        }
      } else if (!unmounted) {
        setTokenInfo({
          name: '',
          symbol: '',
          decimals: 0,
          totalSupply: 0,
          balanceOf: 0
        });
      }

      setIsParsing(false);
    })();
    return () => {
      unmounted = true;
    };
  }, [account, token, tokenContract]);

  useEffect(() => {
    if (tokenError !== '') {
      enqueueSnackbar(tokenError, {
        variant: 'error'
      });
    }
  }, [tokenError]);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      try {
        const fee = await bridgeContract.fee();
        const decimals = await tokenContract.decimals();
        const receiveBalanceTmp = BigNumber.from(amount)
          .mul(100 - Number(fee))
          .div(100);
        if (!unmounted) setReceiveAmont(formatUnits(receiveBalanceTmp, decimals));
      } catch (err) {}
    })();
    return () => {
      unmounted = true;
    };
  }, [amount, bridgeContract, tokenContract]);

  const handleMax = async (e) => {
    e.preventDefault();
    try {
      const balance = await tokenContract.balanceOf(account);
      const decimals = await tokenContract.decimals();
      const symbolTmp = await tokenContract.symbol();
      setAmount(formatUnits(balance, decimals));
      setSymbol(symbolTmp);
    } catch (err) {
      console.log(err);
    }
  };

  const handleTransfer = async () => {
    if (account === undefined) {
      enqueueSnackbar('Please connect your wallet!', {
        variant: 'warning',
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'top'
        }
      });
      onPresentConnectModal();
      return;
    }
    if (amount === 0) {
      setAmountError('Please input amount of token!');
      return;
    }
    if (amount > 0 && isTransfering === 0 && !isParsing && amountError === '') {
      setIsTransfering(1);
      // check balance
      try {
        const balance = await tokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(amount), tokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsTransfering(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsTransfering(0);
        return;
      }

      // approve token
      try {
        const allowance = await tokenContract.allowance(account, BRIDGE_ADDRESS[network]);
        console.log(formatUnits(allowance, tokenInfo.decimals));
        console.log(BRIDGE_ADDRESS[network]);
        if (allowance.lt(parseUnits(String(amount), tokenInfo.decimals))) {
          const tx = await tokenContract.approve(
            BRIDGE_ADDRESS[network],
            parseUnits(String(amount), tokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsTransfering(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsTransfering(0);
        return;
      }

      try {
        const tx = await bridgeContract.deposit(toNetwork, account, parseUnits(String(amount), tokenInfo.decimals));
        await tx.wait();
        enqueueSnackbar('Transfered successufully!', {
          variant: 'success'
        });
        setIsTransfering(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Transfering!');
        setIsTransfering(0);
      }
    }
  };
  return (
    <Page title="Bridge Token">
      <Container maxWidth="lg">
        <CardContainer>
          <Card
            sx={{
              width: 1,
              p: 3,
              transition: 'all .3s',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: (theme) => theme.customShadows.z24
              }
            }}
          >
            <Typography variant="h4">Bridge Token</Typography>
            <Divider />
            <Stack direction="row" alignItems="center" sx={{ mt: 5 }} spacing={3}>
              <Typography variant="h6">To : </Typography>
              <Select
                labelId="network-label"
                id="network-select"
                value={toNetwork}
                onChange={(e) => {
                  if (e.target.value !== network) setToNetwork(Number(e.target.value));
                }}
                inputProps={{
                  sx: {
                    paddingTop: '3px',
                    paddingBottom: '3px',
                    paddingLeft: '20px',
                    paddingRight: '50px !important',
                    width: 1,
                    border: '1px solid white',
                    display: 'flex',
                    variant: 'h6'
                  }
                }}
                MenuProps={{
                  sx: {
                    '& .MuiPaper-root': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(6px)'
                    }
                  }
                }}
              >
                {(process.env.REACT_APP_MODE === 'testnet' ? TEST_CHAINS : CHAINS).map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    selected={option.value === toNetwork}
                    disabled={option.value === network}
                    sx={{ py: 1, px: 2.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box component="img" alt={option.label} src={option.icon} sx={{ width: 28, mr: 2 }} />
                      <Typography variant="body2">{option.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Stack sx={{ mt: 5 }} spacing={3}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                error={Boolean(amountError)}
                helperText={amountError}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                sx={{
                  width: 1
                }}
              />
            </Stack>
            <Stack justifyContent="space-between" direction="row" fontSize="0.85rem">
              <Stack color="#aaa" fontSize="0.75rem">
                {receiveAmount} {symbol} (received)
              </Stack>
              <Link href="" underline="none" onClick={handleMax}>
                max
              </Link>
            </Stack>
            <Stack sx={{ mt: 2 }} alignItems="center" spacing={1}>
              {/* <Typography>You will pay: 0.1BNB</Typography> */}
              <Button
                size="large"
                variant="contained"
                sx={{ bgcolor: 'primary.dark', width: 200 }}
                onClick={handleTransfer}
              >
                {isTransfering === 2 ? (
                  <>
                    Transfering ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : isTransfering === 1 ? (
                  <>
                    Approving ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : (
                  'Transfer'
                )}
              </Button>
            </Stack>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
