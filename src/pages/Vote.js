/* eslint-disable no-nested-ternary */
import { Stack, Typography, Card, Divider, Container, Box, styled, TextField, Button } from '@mui/material';
// import MUIRichTextEditor from 'mui-rte';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import HashLoader from 'react-spinners/HashLoader';
import { useSnackbar } from 'notistack';
import { formatUnits, parseUnits } from '@ethersproject/units';
import Page from '../components/Page';
import { useTokenContract, useGovernorContract } from '../hooks/useContract';
import { TOKEN_ADDRESS } from '../config/constants';
import useAuth from '../hooks/useAuth';

const CardContainer = styled(Box)(({ theme }) => ({
  transition: 'all .5s',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '860px',
  marginLeft: 'auto',
  marginRight: 'auto'
}));

export default function Vote() {
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const token = TOKEN_ADDRESS[network];
  const tokenContract = useTokenContract(token);
  const [targetAddress, setTargetAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountError, setAmountError] = useState('');
  const governorContract = useGovernorContract();
  const [isParsing, setIsParsing] = useState(false);
  const [isProposing, setIsProposing] = useState(0);
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

  // get token info
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
  }, [account, token, tokenContract]);

  useEffect(() => {
    if (tokenError !== '') {
      enqueueSnackbar(tokenError, {
        variant: 'error'
      });
    }
  }, [enqueueSnackbar, tokenError]);

  const handlePropose = async () => {
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
    if (amount > 0 && isProposing === 0 && !isParsing && amountError === '') {
      setIsProposing(2);
      // check balance
      try {
        const balance = await tokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(amount), tokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsProposing(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsProposing(0);
        return;
      }

      try {
        const tx = await governorContract.propose(
          targetAddress,
          parseUnits(String(amount), tokenInfo.decimals),
          'Ox',
          description
        );
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setAmount(0);
          enqueueSnackbar('Proposed successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Proposed failed!', {
            variant: 'error'
          });
        }
        setIsProposing(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Proposing!');
        setIsProposing(0);
      }
    }
  };

  return (
    <Page title="Vote">
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
            <Typography variant="h4">Vote</Typography>
            <Divider />
            <Stack sx={{ mt: 5 }} spacing={3}>
              <TextField
                fullWidth
                label="Target wallet address"
                type="text"
                value={targetAddress}
                onChange={(e) => {
                  setTargetAddress(e.target.value);
                }}
                sx={{
                  width: 1
                }}
                placeholder="Enter the target address..."
              />
            </Stack>
            <Stack sx={{ mt: 5 }} spacing={3}>
              <TextField
                fullWidth
                label="Title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                sx={{
                  width: 1
                }}
                placeholder="Enter the tile of your proposal..."
              />
            </Stack>
            <Stack sx={{ mt: 5 }} spacing={3}>
              <TextField
                fullWidth
                label="Description"
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                sx={{
                  width: 1
                }}
                placeholder="Enter the description of your proposal..."
              />
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
            <Stack sx={{ mt: 3 }} alignItems="center" spacing={1}>
              {/* <Typography>You will pay: 0.1BNB</Typography> */}
              <Button
                size="large"
                variant="contained"
                sx={{ bgcolor: 'primary.dark', width: 200 }}
                onClick={handlePropose}
              >
                {isProposing === 2 ? (
                  <>
                    Proposing ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : isProposing === 1 ? (
                  <>
                    Approving ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : (
                  'Propose'
                )}
              </Button>
            </Stack>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
