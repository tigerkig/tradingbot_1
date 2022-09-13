/* eslint-disable no-restricted-properties */
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
  Box,
  styled,
  Grid,
  // AppBar,
  Tabs,
  Tab
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import { HashLoader, BeatLoader } from 'react-spinners';
import { useSnackbar } from 'notistack';
import { formatUnits, commify, parseUnits } from '@ethersproject/units';
import Page from '../components/Page';
import { useTokenContract, useStakingContract, useTreasuryContract } from '../hooks/useContract';
import { STAKING_ADDRESS, STOKEN_ADDRESS, TOKEN_ADDRESS, BLOCK_TIME } from '../config/constants';
import useAuth from '../hooks/useAuth';
import { useDispatch, useSelector } from '../redux/store';
import {
  initialized,
  setTokenBalance,
  setStokenBalance,
  setRewardRate,
  setTotalStaked,
  setAPY,
  setStakingRewardLastBlock,
  setRoi5,
  setTotalReward,
  setTokenInfo,
  setStokenInfo
} from '../redux/slices/staking';

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

export default function Staking() {
  const { library, account } = useWeb3React();
  const dispatch = useDispatch();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const [tokenError, setTokenError] = useState('');
  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeAmountError, setStakeAmountError] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [unstakeAmountError, setUnstakeAmountError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isStaking, setIsStaking] = useState(0);
  const [isUnstaking, setIsUnstaking] = useState(0);
  const [isRebasing, setIsRebasing] = useState(0);
  const [tabId, setTabId] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const {
    isInitialized,
    tokenBalance,
    stokenBalance,
    rewardRate,
    totalStaked,
    apy,
    stakingRewardLastBlock,
    roi5,
    totalReward,
    tokenInfo,
    stokenInfo
  } = useSelector((state) => state.staking);
  const token = TOKEN_ADDRESS[network];
  const tokenContract = useTokenContract(token);
  const stoken = STOKEN_ADDRESS[network];
  const stokenContract = useTokenContract(stoken);
  const stakingContract = useStakingContract();
  const treasuryContract = useTreasuryContract();

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (library) {
        console.log((await library.getBlock()).number);
      }
      if (stakingContract && stokenContract && tokenContract && treasuryContract) {
        if (!unmounted) setIsParsing(true);
        let tmpDecimals;
        try {
          tmpDecimals = await tokenContract.decimals();
          const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tmpDecimals);
          if (!unmounted) dispatch(setTokenBalance(tmpTokenBalance));
        } catch (err) {}
        try {
          const tmpStokenBalance = formatUnits(await stokenContract.balanceOf(account), tmpDecimals);
          if (!unmounted) dispatch(setStokenBalance(tmpStokenBalance));
        } catch (err) {}
        try {
          const stakingRewardBlocksSetLength = await treasuryContract.stakingRewardBlocksSetLength();
          const stakingRewardPercentPerBlock = await treasuryContract.stakingRewardPercentPerBlock(
            await treasuryContract.stakingRewardBlocksSet(stakingRewardBlocksSetLength - 1)
          );
          const tmpApy = Math.pow(1 + stakingRewardPercentPerBlock / 100000000, 31536000 / BLOCK_TIME[network]);
          const tmpRoi5 = Math.pow(1 + stakingRewardPercentPerBlock / 100000000, 432000 / BLOCK_TIME[network]);
          const tmpStakingRewardLastBlock = await treasuryContract.stakingRewardLastBlock();
          const stakingRewardAmountDistributed = await treasuryContract.stakingRewardAmountDistributed();
          if (!unmounted) {
            dispatch(setRewardRate((stakingRewardPercentPerBlock / 1000000).toFixed(8)));
            dispatch(setAPY((tmpApy * 100 - 100).toFixed(4)));
            dispatch(setRoi5((tmpRoi5 * 100 - 100).toFixed(4)));
            dispatch(setStakingRewardLastBlock(tmpStakingRewardLastBlock));
            dispatch(setTotalReward(formatUnits(stakingRewardAmountDistributed, tmpDecimals)));
          }
        } catch (err) {}
        try {
          const tmpTotalStaked = await stakingContract.totalStaked();
          if (!unmounted) dispatch(setTotalStaked(formatUnits(tmpTotalStaked, tmpDecimals)));
        } catch (err) {
          console.log(err);
        }
        dispatch(initialized());

        stakingContract.on('Rebase', (rewardTotalCount, block, rewardHistory) => {
          console.log('Rebase', rewardTotalCount, block, rewardHistory);
          (async () => {
            try {
              const tmpStokenBalance = formatUnits(await stokenContract.balanceOf(account), stokenInfo.decimals);
              const tmpTotalStaked = await stakingContract.totalStaked();
              const stakingRewardAmountDistributed = await treasuryContract.stakingRewardAmountDistributed();
              const tmpStakingRewardLastBlock = await treasuryContract.stakingRewardLastBlock();
              dispatch(setStokenBalance(tmpStokenBalance));
              dispatch(setTotalStaked(formatUnits(tmpTotalStaked, tokenInfo.decimals)));
              dispatch(setTotalReward(formatUnits(stakingRewardAmountDistributed, tokenInfo.decimals)));
              dispatch(setStakingRewardLastBlock(tmpStakingRewardLastBlock));
            } catch (err) {}
          })();
        });
        stakingContract.on('Stake', (sender, amount) => {
          console.log('Stake', sender, amount);
          (async () => {
            if (account === sender) {
              const tmpStokenBalance = formatUnits(await stokenContract.balanceOf(account), tokenInfo.decimals);
              dispatch(setStokenBalance(tmpStokenBalance));
              const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), stokenInfo.decimals);
              dispatch(setTokenBalance(tmpTokenBalance));
            }
            const tmpTotalStaked = await stakingContract.totalStaked();
            dispatch(setTotalStaked(formatUnits(tmpTotalStaked, tokenInfo.decimals)));
          })();
        });
        stakingContract.on('Unstake', (sender, amount) => {
          console.log('Unstake', sender, amount);
          (async () => {
            if (account === sender) {
              const tmpStokenBalance = formatUnits(await stokenContract.balanceOf(account), stokenInfo.decimals);
              dispatch(setStokenBalance(tmpStokenBalance));
              const tmpTokenBalance = formatUnits(await tokenContract.balanceOf(account), tokenInfo.decimals);
              dispatch(setTokenBalance(tmpTokenBalance));
            }
            const stakingRewardAmountDistributed = await treasuryContract.stakingRewardAmountDistributed();
            dispatch(setTotalReward(formatUnits(stakingRewardAmountDistributed, tokenInfo.decimals)));
            const tmpTotalStaked = await stakingContract.totalStaked();
            dispatch(setTotalStaked(formatUnits(tmpTotalStaked, tokenInfo.decimals)));
            const tmpStakingRewardLastBlock = await treasuryContract.stakingRewardLastBlock();
            dispatch(setStakingRewardLastBlock(tmpStakingRewardLastBlock));
          })();
        });
        treasuryContract.on('SetStakingRewardPercent', (blockNumber, stakingRewardPercentPerBlock) => {
          try {
            dispatch(setRewardRate((stakingRewardPercentPerBlock / 1000000).toFixed(8)));
            const tmpApy = Math.pow(1 + stakingRewardPercentPerBlock / 100000000, 31536000 / BLOCK_TIME[network]);
            const tmpRoi5 = Math.pow(1 + stakingRewardPercentPerBlock / 100000000, 432000 / BLOCK_TIME[network]);
            dispatch(setAPY((tmpApy * 100 - 100).toFixed(4)));
            dispatch(setRoi5((tmpRoi5 * 100 - 100).toFixed(4)));
          } catch (err) {}
        });
      }
    })();
    return () => {
      unmounted = true;
      if (stakingContract) stakingContract.removeAllListeners();
      if (treasuryContract) treasuryContract.removeAllListeners();
    };
  }, [network, stakingContract, account, library, stokenContract, tokenContract, treasuryContract]);

  // stakeAmount balance check
  useEffect(() => {
    if (tokenBalance) {
      if (Number(stakeAmount) > Number(tokenBalance)) {
        setStakeAmountError('More than balance!');
      } else setStakeAmountError('');
    } else {
      setStakeAmountError('');
    }
  }, [stakeAmount, tokenBalance, enqueueSnackbar]);

  // unstakeAmount balance check
  useEffect(() => {
    if (stokenBalance) {
      if (Number(unstakeAmount) > Number(stokenBalance)) {
        setUnstakeAmountError('More than balance!');
      } else setUnstakeAmountError('');
    } else {
      setUnstakeAmountError('');
    }
  }, [unstakeAmount, stokenBalance, stokenInfo, enqueueSnackbar]);

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
            dispatch(
              setTokenInfo({
                name: '',
                symbol: '',
                decimals: 0,
                totalSupply: 0,
                balanceOf: 0
              })
            );
            setTokenError('Invalid token address');
            setIsParsing(false);
            return;
          }
        }

        if (!unmounted) {
          dispatch(setTokenInfo({ name, symbol, totalSupply, decimals, balanceOf }));
        }
      } else if (!unmounted) {
        dispatch(
          setTokenInfo({
            name: '',
            symbol: '',
            decimals: 0,
            totalSupply: 0,
            balanceOf: 0
          })
        );
      }

      setIsParsing(false);
    })();
    return () => {
      unmounted = true;
    };
  }, [account, token, tokenContract]);

  // get stoken info
  useEffect(() => {
    let unmounted = false;

    setIsParsing(true);
    setTokenError('');
    (async () => {
      if (stoken !== '' && stokenContract !== null) {
        let name;
        let symbol;
        let decimals;
        let totalSupply;
        let balanceOf;
        try {
          name = await stokenContract.name();
          symbol = await stokenContract.symbol();
          decimals = await stokenContract.decimals();
          totalSupply = await stokenContract.totalSupply();
          balanceOf = await stokenContract.balanceOf(account);
        } catch (err) {
          if (!unmounted) {
            dispatch(
              setStokenInfo({
                name: '',
                symbol: '',
                decimals: 0,
                totalSupply: 0,
                balanceOf: 0
              })
            );
            setTokenError('Invalid token address');
            setIsParsing(false);
            return;
          }
        }

        if (!unmounted) {
          dispatch(setStokenInfo({ name, symbol, totalSupply, decimals, balanceOf }));
        }
      } else if (!unmounted) {
        dispatch(
          setStokenInfo({
            name: '',
            symbol: '',
            decimals: 0,
            totalSupply: 0,
            balanceOf: 0
          })
        );
      }

      setIsParsing(false);
    })();
    return () => {
      unmounted = true;
    };
  }, [account, stoken, stokenContract]);

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

  const handleRebase = async () => {
    setIsRebasing(1);

    // rebase code
    try {
      const tx = await stakingContract.rebase();
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        enqueueSnackbar('Rebased successufully!', {
          variant: 'success'
        });
      } else {
        enqueueSnackbar('Rebased failed!', {
          variant: 'error'
        });
      }
      setIsRebasing(0);
    } catch (err) {
      console.log(err);
      setTokenError('Failed in Rebasing!');
      setIsRebasing(0);
    }
  };

  const handleStaking = async () => {
    if (!checkAccountConnect()) {
      return;
    }
    if (stakeAmount === 0) {
      setStakeAmountError('Please input amount of token!');
      return;
    }
    if (stakeAmount > 0 && isStaking === 0 && !isParsing && stakeAmountError === '') {
      setIsStaking(1);
      // check balance
      try {
        const balance = await tokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(stakeAmount), tokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsStaking(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsStaking(0);
        return;
      }

      // approve token
      try {
        const allowance = await tokenContract.allowance(account, STAKING_ADDRESS[network]);
        if (allowance.lt(parseUnits(String(stakeAmount), tokenInfo.decimals))) {
          const tx = await tokenContract.approve(
            STAKING_ADDRESS[network],
            parseUnits(String(stakeAmount), tokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsStaking(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsStaking(0);
        return;
      }

      // staking code
      try {
        const tx = await stakingContract.stake(parseUnits(String(stakeAmount), tokenInfo.decimals));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setStakeAmount(0);
          enqueueSnackbar('Staking successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Staking failed!', {
            variant: 'error'
          });
        }
        setIsStaking(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Staking!');
        setIsStaking(0);
      }
    }
  };

  const handleUnstaking = async () => {
    if (!checkAccountConnect()) {
      return;
    }
    if (unstakeAmount === 0) {
      setUnstakeAmountError('Please input amount of token!');
      return;
    }
    if (unstakeAmount > 0 && isUnstaking === 0 && !isParsing && unstakeAmountError === '') {
      setIsUnstaking(1);
      // check balance
      try {
        const balance = await stokenContract.balanceOf(account);
        if (balance.lt(parseUnits(String(unstakeAmount), stokenInfo.decimals))) {
          enqueueSnackbar('You tried with more than balance!', {
            variant: 'error'
          });
          setIsUnstaking(0);
          return;
        }
      } catch (e) {
        setTokenError('Invalid token address');
        setIsUnstaking(0);
        return;
      }

      // approve stoken
      try {
        const allowance = await stokenContract.allowance(account, STAKING_ADDRESS[network]);
        if (allowance.lt(parseUnits(String(unstakeAmount), stokenInfo.decimals))) {
          const tx = await stokenContract.approve(
            STAKING_ADDRESS[network],
            parseUnits(String(unstakeAmount), stokenInfo.decimals)
          );
          await tx.wait();
        }
        setIsUnstaking(2);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Approving!');
        setIsUnstaking(0);
        return;
      }

      // unstaking code
      try {
        const tx = await stakingContract.unstake(parseUnits(String(unstakeAmount), stokenInfo.decimals));
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setUnstakeAmount(0);
          enqueueSnackbar('Unstaking successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Unstaking failed!', {
            variant: 'error'
          });
        }
        setIsUnstaking(0);
      } catch (err) {
        console.log(err);
        setTokenError('Failed in Unstaking!');
        setIsUnstaking(0);
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
            <Typography variant="h4">Staking / Unstaking</Typography>
            <Divider />
            {!isInitialized ? (
              <Stack sx={{ mt: 5 }} alignItems="center" spacing={3}>
                <BeatLoader size={20} />
              </Stack>
            ) : (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Stack sx={{ mt: 3 }} spacing={2} alignItems="center">
                      <Typography variant="h6">APY</Typography>
                      <Typography variant="h6">{commify(apy)} %</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={4}>
                    <Stack sx={{ mt: 3 }} spacing={2} alignItems="center">
                      <Typography variant="h6">Total Staked</Typography>
                      <Typography variant="h6">{commify(totalStaked)}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={4}>
                    <Stack sx={{ mt: 3 }} spacing={2} alignItems="center">
                      <Typography variant="h6">Total Reward</Typography>
                      <Typography variant="h6">{commify(totalReward)}</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </>
            )}
            <Box sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}>
              {/* <AppBar position="static"> */}
              <Tabs value={tabId} onChange={handleChangeTab} aria-label="Staking / Unstaking" variant="fullWidth">
                <Tab label="Staking" {...a11yProps(0)} />
                <Tab label="Unstaking" {...a11yProps(1)} />
              </Tabs>
              {/* </AppBar> */}
            </Box>
            <TabPanel value={tabId} index={0}>
              <Stack sx={{ mt: 5 }} spacing={3}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  error={Boolean(stakeAmountError)}
                  helperText={stakeAmountError}
                  value={stakeAmount}
                  onChange={(e) => {
                    setStakeAmount(e.target.value);
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
                  onClick={handleStaking}
                >
                  {isStaking === 2 ? (
                    <>
                      Staking ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : isStaking === 1 ? (
                    <>
                      Approving ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : (
                    'Stake'
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
                  error={Boolean(unstakeAmountError)}
                  helperText={unstakeAmountError}
                  value={unstakeAmount}
                  onChange={(e) => {
                    setUnstakeAmount(e.target.value);
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
                  onClick={handleUnstaking}
                >
                  {isUnstaking === 2 ? (
                    <>
                      Unstaking ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : isUnstaking === 1 ? (
                    <>
                      Approving ... <HashLoader color="#59f1f6" size={30} />
                    </>
                  ) : (
                    'Unstake'
                  )}
                </Button>
              </Stack>
            </TabPanel>
            <Stack sx={{ mt: 5 }}>
              <Grid
                container
                columnSpacing={4}
                rowSpacing={5}
                sx={{ maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}
              >
                <Grid item xl={12} xs={12} sx={{ paddingTop: '10px !important' }}>
                  <Button
                    variant="outlined"
                    color="success"
                    style={{ marginTop: 20, width: '100%' }}
                    onClick={handleRebase}
                  >
                    {isRebasing ? (
                      <>
                        Rebasing... <HashLoader color="#59f1f6" size={30} />
                      </>
                    ) : (
                      'Rebase'
                    )}
                  </Button>
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  Unstaked balance :
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  {commify(tokenBalance)}
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  Staked balance :
                </Grid>
                <Grid item xl={6} xs={6} sx={{ paddingTop: '10px!important' }}>
                  {commify(stokenBalance)}
                </Grid>
              </Grid>
            </Stack>
            <Box sx={{ mt: 3 }}>
              <Divider />
              {!isInitialized ? (
                <Stack sx={{ mt: 5 }} alignItems="center" spacing={3}>
                  <BeatLoader size={20} />
                </Stack>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }} spacing={2}>
                    <Typography alignItems="left" variant="h6">
                      Reward Rate Per Block :
                    </Typography>
                    <Typography alignItems="right" variant="h6">
                      {commify(rewardRate)} %
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }} spacing={2}>
                    <Typography alignItems="left" variant="h6">
                      ROI (5 - Day Rate) :
                    </Typography>
                    <Typography alignItems="right" variant="h6">
                      {commify(roi5)} %
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }} spacing={2}>
                    <Typography alignItems="left" variant="h6">
                      Last Block Rewarded :
                    </Typography>
                    <Typography alignItems="right" variant="h6">
                      {commify(stakingRewardLastBlock)}
                    </Typography>
                  </Stack>
                </>
              )}
            </Box>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
