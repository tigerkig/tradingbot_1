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
  Box,
  styled,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import HashLoader from 'react-spinners/HashLoader';
import { useSnackbar } from 'notistack';
import { formatUnits, commify, parseUnits } from '@ethersproject/units';
import Page from '../components/Page';
import { useTokenContract, useGtokenContract } from '../hooks/useContract';
import { GTOKEN_ADDRESS, STOKEN_ADDRESS } from '../config/constants';
import useAuth from '../hooks/useAuth';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const CardContainer = styled(Box)(({ theme }) => ({
  transition: 'all .5s',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '860px',
  marginLeft: 'auto',
  marginRight: 'auto'
}));

export default function Wrap() {
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const [tokenError, setTokenError] = useState('');
  const [tabId, setTabId] = useState(0);
  const [wrapAmount, setWrapAmount] = useState(0);
  const [wrapAmountError, setWrapAmountError] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState(0);
  const [unwrapAmountError, setUnwrapAmountError] = useState('');
  const token = STOKEN_ADDRESS[network];
  const tokenContract = useTokenContract(token);
  const gtoken = GTOKEN_ADDRESS[network];
  const gtokenContract = useGtokenContract(gtoken);
  const [isParsing, setIsParsing] = useState(false);
  const [isWraping, setIsWraping] = useState(0);
  const [isUnwraping, setIsUnwraping] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  });
  const [gtokenInfo, setGtokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  });
  const [tokenBalance, setTokenBalance] = useState(0);
  const [gtokenBalance, setGtokenBalance] = useState(0);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (account && tokenContract && gtokenContract) {
        if (!unmounted) setIsParsing(true);
        let tmpDecimals;
        try {
          tmpDecimals = await tokenContract.decimals();
          const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tmpDecimals);
          if (!unmounted) setTokenBalance(tmpTokenBalance);
        } catch (err) {}
        try {
          tmpDecimals = await gtokenContract.decimals();
          const tmpGtokenBalance = formatUnits(await gtokenContract.balanceOf(account), tmpDecimals);
          if (!unmounted) setGtokenBalance(tmpGtokenBalance);
        } catch (err) {}

        gtokenContract.on('Transfer', (from, to, amount) => {
          console.log(from, to, amount);
          (async () => {
            if (account === from) {
              const tmpGtokenBalance = formatUnits(await gtokenContract.balanceOf(account), tmpDecimals);
              setGtokenBalance(tmpGtokenBalance);
              const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tmpDecimals);
              setTokenBalance(tmpTokenBalance);
            }
          })();
        });
      }
      if (!unmounted) {
        setIsParsing(false);
        if (gtokenContract) gtokenContract.removeAllListeners();
      }
    })();
    return () => {
      unmounted = true;
    };
  }, [account, tokenContract, gtokenContract]);

  // wrap amount balance check
  useEffect(() => {
    if (tokenBalance) {
      if (Number(wrapAmount) > Number(tokenBalance)) {
        setWrapAmountError('More than balance!');
      } else setWrapAmountError('');
    } else {
      setWrapAmountError('');
    }
  }, [wrapAmount, tokenBalance, enqueueSnackbar]);

  // unwrap amount balance check
  useEffect(() => {
    if (gtokenBalance) {
      if (Number(unwrapAmount) > Number(gtokenBalance)) {
        setUnwrapAmountError('More than balance!');
      } else setUnwrapAmountError('');
    } else {
      setUnwrapAmountError('');
    }
  }, [unwrapAmount, gtokenBalance, gtokenInfo, enqueueSnackbar]);

  // amount banlance check
  useEffect(() => {
    if (
      tokenInfo.name &&
      tokenInfo.symbol &&
      tokenInfo.decimals > 0 &&
      tokenInfo.totalSupply > 0 &&
      tokenInfo.balanceOf > 0
    ) {
      if (wrapAmount > Number(formatUnits(tokenInfo.balanceOf, tokenInfo.decimals))) {
        setWrapAmountError('More than balance!');
      } else setWrapAmountError('');
    } else {
      setWrapAmountError('');
    }
  }, [wrapAmount, tokenInfo, enqueueSnackbar]);

  useEffect(() => {
    if (
      gtokenInfo.name &&
      gtokenInfo.symbol &&
      gtokenInfo.decimals > 0 &&
      gtokenInfo.totalSupply > 0 &&
      gtokenInfo.balanceOf > 0
    ) {
      if (unwrapAmount > Number(formatUnits(gtokenInfo.balanceOf, gtokenInfo.decimals))) {
        setUnwrapAmountError('More than balance!');
      } else setUnwrapAmountError('');
    } else {
      setUnwrapAmountError('');
    }
  }, [unwrapAmount, gtokenInfo, enqueueSnackbar]);

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
    let unmounted = false;

    setIsParsing(true);
    setTokenError('');
    (async () => {
      if (gtoken !== '' && gtokenContract !== null) {
        let name;
        let symbol;
        let decimals;
        let totalSupply;
        let balanceOf;
        try {
          name = await gtokenContract.name();
          symbol = await gtokenContract.symbol();
          decimals = await gtokenContract.decimals();
          totalSupply = await gtokenContract.totalSupply();
          balanceOf = await gtokenContract.balanceOf(account);
        } catch (err) {
          if (!unmounted) {
            setGtokenInfo({
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
          setGtokenInfo({ name, symbol, totalSupply, decimals, balanceOf });
        }
      } else if (!unmounted) {
        setGtokenInfo({
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
  }, [account, gtoken, gtokenContract]);

  useEffect(() => {
    if (tokenError !== '') {
      enqueueSnackbar(tokenError, {
        variant: 'error'
      });
    }
  }, [enqueueSnackbar, tokenError]);

  const handleChangeTab = async (_event, value) => {
    setTabId(value);
  };

  const checkAccountConnect = async () => {
    if (account === undefined) {
      enqueueSnackbar('Please connect your wallet!', {
        variant: 'warning',
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'top'
        }
      });
      onPresentConnectModal();
      return false;
    }
    return true;
  };

  const handleWrap = async () => {
    if (!checkAccountConnect()) {
      return;
    }
    if (wrapAmount === 0) {
      setWrapAmountError('Please input amount of token!');
      return;
    }
    if (wrapAmount > 0 && isWraping === 0 && !isParsing && wrapAmountError === '') {
      setIsWraping(1);
      // check balance
      try {
        const balance = await tokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(wrapAmount), tokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsWraping(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsWraping(0);
        return;
      }

      // approve token
      try {
        const allowance = await tokenContract.allowance(account, GTOKEN_ADDRESS[network]);
        if (allowance.lt(parseUnits(String(wrapAmount), tokenInfo.decimals))) {
          const tx = await tokenContract.approve(
            GTOKEN_ADDRESS[network],
            parseUnits(String(wrapAmount), tokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsWraping(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsWraping(0);
        return;
      }

      // wrap token
      try {
        const tx = await gtokenContract.depositFor(account, parseUnits(String(wrapAmount), tokenInfo.decimals));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setWrapAmount(0);
          const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tokenInfo.decimals);
          setTokenBalance(tmpTokenBalance);
          const tmpGtokenBalance = formatUnits(await gtokenContract.balanceOf(account), gtokenInfo.decimals);
          setGtokenBalance(tmpGtokenBalance);
          enqueueSnackbar('Wrapped successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Wrapped failed!', {
            variant: 'error'
          });
        }
        setIsWraping(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Wraping!');
        setIsWraping(0);
      }
    }
  };

  const handleUnwrap = async () => {
    if (!checkAccountConnect()) {
      return;
    }
    if (unwrapAmount === 0) {
      setWrapAmountError('Please input amount of token!');
      return;
    }
    if (unwrapAmount > 0 && isUnwraping === 0 && !isParsing && unwrapAmountError === '') {
      setIsUnwraping(1);
      // check balance
      try {
        const balance = await gtokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(unwrapAmount), gtokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsUnwraping(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsUnwraping(0);
        return;
      }

      // approve token
      try {
        const allowance = await gtokenContract.allowance(account, GTOKEN_ADDRESS[network]);
        if (allowance.lt(parseUnits(String(unwrapAmount), gtokenInfo.decimals))) {
          const tx = await gtokenContract.approve(
            GTOKEN_ADDRESS[network],
            parseUnits(String(unwrapAmount), gtokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsUnwraping(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsUnwraping(0);
        return;
      }

      // unwrap token
      try {
        const tx = await gtokenContract.withdrawTo(account, parseUnits(String(unwrapAmount), gtokenInfo.decimals));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setUnwrapAmount(0);
          const tmpGtokenBalance = formatUnits(await gtokenContract.balanceOf(account), gtokenInfo.decimals);
          setGtokenBalance(tmpGtokenBalance);
          const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tokenInfo.decimals);
          setTokenBalance(tmpTokenBalance);
          enqueueSnackbar('Unwrapped successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Unwrapped failed!', {
            variant: 'error'
          });
        }
        setIsUnwraping(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Unwrapping!');
        setIsUnwraping(0);
      }
    }
  };

  return (
    <Page title="Wrap Token for Vote">
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
            <Typography variant="h4">Wrap Token for Vote</Typography>
            <Divider />
            <Box sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
              {/* <AppBar position="static"> */}
              <Tabs value={tabId} onChange={handleChangeTab} aria-label="Wrap / Unwrap" variant="fullWidth">
                <Tab label="Wrap" {...a11yProps(0)} />
                <Tab label="Unwrap" {...a11yProps(1)} />
              </Tabs>
              {/* </AppBar> */}
            </Box>
            <TabPanel value={tabId} index={0}>
              <Stack sx={{ mt: 5 }} spacing={3}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  error={Boolean(wrapAmountError)}
                  helperText={wrapAmountError}
                  value={wrapAmount}
                  onChange={(e) => {
                    setWrapAmount(e.target.value);
                  }}
                  sx={{
                    width: 1
                  }}
                />
              </Stack>
              <Stack sx={{ mt: 3 }} alignItems="center" spacing={1}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{ bgcolor: 'primary.dark', width: 200 }}
                  onClick={handleWrap}
                >
                  {isWraping === 2 ? (
                    <>
                      Wraping ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : isWraping === 1 ? (
                    <>
                      Approving ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : (
                    'Wrap'
                  )}
                </Button>
              </Stack>
            </TabPanel>
            <TabPanel value={tabId} index={1}>
              <Stack sx={{ mt: 5 }} spacing={3}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  error={Boolean(unwrapAmountError)}
                  helperText={unwrapAmountError}
                  value={unwrapAmount}
                  onChange={(e) => {
                    setUnwrapAmount(e.target.value);
                  }}
                  sx={{
                    width: 1
                  }}
                />
              </Stack>
              <Stack sx={{ mt: 3 }} direction="row" justifyContent="center" spacing={1}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{ bgcolor: 'primary.dark', width: 200 }}
                  onClick={handleUnwrap}
                >
                  {isUnwraping === 2 ? (
                    <>
                      Unwraping ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : isUnwraping === 1 ? (
                    <>
                      Approving ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : (
                    'Unwrap'
                  )}
                </Button>
              </Stack>
            </TabPanel>
            <Stack sx={{ mt: 10 }}>
              <Grid
                container
                columnSpacing={4}
                rowSpacing={5}
                sx={{ maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}
              >
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  Staked WGC :
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  {commify(tokenBalance)}
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  Governance WGC :
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  {commify(gtokenBalance)}
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
