/* eslint-disable no-useless-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
/* eslint-disable no-empty */
import { Stack, Typography, Button, Card, Divider, TextField, Container, Box, styled } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import HashLoader from 'react-spinners/HashLoader';
import { useSnackbar } from 'notistack';
import { formatUnits, parseUnits } from '@ethersproject/units';
import Page from '../components/Page';
import { useTokenContract, useWrapperContract } from '../hooks/useContract';
import { WRAPPER_ADDRESS, OLD_TOKEN_ADDRESS } from '../config/constants';
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

export default function ExchangeToken() {
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const [tokenError, setTokenError] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountError, setAmountError] = useState('');
  const fromToken = OLD_TOKEN_ADDRESS[network];
  const tokenContract = useTokenContract(fromToken);
  const exchangeContract = useWrapperContract();
  const [isParsing, setIsParsing] = useState(false);
  const [isExchanging, setIsExchanging] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  });

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
      if (fromToken !== '' && tokenContract !== null) {
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
            setTokenError('Invalid token address');
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
  }, [account, fromToken, tokenContract]);

  useEffect(() => {
    if (tokenError !== '') {
      enqueueSnackbar(tokenError, {
        variant: 'error'
      });
    }
  }, [enqueueSnackbar, tokenError]);

  const handleExchange = async () => {
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
    if (amount > 0 && isExchanging === 0 && !isParsing && amountError === '') {
      setIsExchanging(1);
      // check balance
      try {
        const balance = await tokenContract.balanceOf(account);
        console.log(balance);
        if (balance.lt(parseUnits(String(amount), tokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsExchanging(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsExchanging(0);
        return;
      }

      // approve token
      try {
        const allowance = await tokenContract.allowance(account, WRAPPER_ADDRESS[network]);
        console.log(formatUnits(allowance, tokenInfo.decimals));
        console.log(tokenInfo.decimals);
        if (allowance.lt(parseUnits(String(amount), tokenInfo.decimals))) {
          const tx = await tokenContract.approve(
            WRAPPER_ADDRESS[network],
            parseUnits(String(amount), tokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsExchanging(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsExchanging(0);
        return;
      }

      try {
        const tx = await exchangeContract.exchange(parseUnits(String(amount), tokenInfo.decimals));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setAmount(0);
          enqueueSnackbar('Exchanged successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Exchanged failed!', {
            variant: 'error'
          });
        }
        setIsExchanging(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Exchanging!');
        setIsExchanging(0);
      }
    }
  };
  return (
    <Page title="Exchange Token">
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
            <Typography variant="h4">Exchange Token</Typography>
            <Divider />
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
            <Stack sx={{ mt: 3 }} alignItems="center" spacing={1}>
              {/* <Typography>You will pay: 0.1BNB</Typography> */}
              <Button
                size="large"
                variant="contained"
                sx={{ bgcolor: 'primary.dark', width: 200 }}
                onClick={handleExchange}
              >
                {isExchanging === 2 ? (
                  <>
                    Exchanging ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : isExchanging === 1 ? (
                  <>
                    Approving ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : (
                  'Exchange'
                )}
              </Button>
            </Stack>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
