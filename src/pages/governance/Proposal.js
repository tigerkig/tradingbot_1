/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
import { Stack, Typography, Divider, Container, Box, Button, Grid, Tabs, Tab } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import MUIRichTextEditor from 'mui-rte';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import { useSnackbar } from 'notistack';
import { HashLoader } from 'react-spinners';
import Page from '../../components/Page';
import { useGovernorContract } from '../../hooks/useContract';
// import { GOVERNOR_ADDRESS, TOKEN_ADDRESS } from '../../config/constants';
import useAuth from '../../hooks/useAuth';
import VoteDialog from './VoteDialog';

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

export default function Proposal() {
  const { proposalId } = useParams();
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const governorContract = useGovernorContract();
  const [isParsing, setIsParsing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposer, setProposer] = useState('');
  const [proposalInfo, setProposalInfo] = useState(null);
  const [tabId, setTabId] = useState(0);
  const [actions, setActions] = useState([]);
  const [openVoteDialog, setOpenVoteDialog] = useState(false);
  const [votingStatus, setVotingStatus] = useState(0);
  const [proposalStatus, setProposalStatus] = useState(-1);
  const [hasVoted, setHasVoted] = useState(false);
  const ProposalState = {
    Pending: 0,
    Active: 1,
    Canceled: 2,
    Defeated: 3,
    Succeeded: 4,
    Queued: 5,
    Expired: 6,
    Executed: 7
  };

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (governorContract) {
        if (!unmounted) setIsParsing(true);
        try {
          const result = await governorContract.proposals(proposalId);
          setProposalInfo(result);
          console.log(proposalInfo);
          setProposer(result.proposer);
          // const actionsData = await governorContract.getActions(proposalId);
          // console.log(actionsData);
          const state = await governorContract.state(proposalId);
          setProposalStatus(state);
          setHasVoted(await governorContract.hasVoted(proposalId, account));
          let description = await governorContract.descriptionsForPropose(proposalId);
          if (description) {
            description = JSON.parse(description);
            setTitle(description.title);
            setDescription(description.description);
          }
          let abis = await governorContract.abisForPropose(proposalId);
          if (abis) {
            abis = JSON.parse(abis);
            const actionList = abis.map((val) => ({
              id: val.id,
              index: val.index,
              targetAddress: val.targetAddress,
              // abi: val.abi,
              method: val.method,
              calldatas: val.calldatas
            }));
            setActions(actionList);
          }
        } catch (err) {
          console.log(err);
          enqueueSnackbar('Proposal Invalid!', {
            variant: 'error'
          });
        }
      }
    })();
    return () => {
      unmounted = true;
    };
  }, [enqueueSnackbar, governorContract, proposalId]);

  const handleVote = () => {
    setOpenVoteDialog(true);
  };

  const handleSubmitVote = async (support, comment) => {
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
    setOpenVoteDialog(false);
    console.log(isParsing);
    if (votingStatus === 0) {
      setVotingStatus(1);
      try {
        let tx;
        if (comment === '') {
          tx = await governorContract.castVote(proposalId, support);
        } else {
          tx = await governorContract.castVoteWithReason(proposalId, support, comment);
        }
        const receipt = await tx.wait();
        console.log(receipt);
        if (receipt.status === 1) {
          enqueueSnackbar('Voted successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Voted failed!', {
            variant: 'error'
          });
        }
        setVotingStatus(0);
      } catch (err) {
        console.log(err);
        enqueueSnackbar('Voting failed: Error occured!', {
          variant: 'error'
        });
        setVotingStatus(0);
      }
    }
  };

  const handleCloseVoteDlg = () => {
    setOpenVoteDialog(false);
  };

  const handleChangeTab = async (_event, value) => {
    setTabId(value);
  };

  return (
    <Page title="Vote">
      <Container maxWidth="lg">
        {/* <Typography variant="h4" textAlign="center">
          Vote Page ({proposalId})
        </Typography> */}
        {proposalStatus === ProposalState.Canceled ? (
          <Typography variant="subtitle1" color="error" textAlign="center">
            Canceled
          </Typography>
        ) : proposalStatus === ProposalState.Defeated ? (
          <Typography variant="subtitle1" color="error" textAlign="center">
            Defeated
          </Typography>
        ) : proposalStatus === ProposalState.Executed ? (
          <Typography variant="subtitle1" color="success" textAlign="center">
            Executed
          </Typography>
        ) : proposalStatus === ProposalState.Expired ? (
          <Typography variant="subtitle1" color="error" textAlign="center">
            Expired
          </Typography>
        ) : proposalStatus === ProposalState.Queued ? (
          <Typography variant="subtitle1" color="success" textAlign="center">
            Queued
          </Typography>
        ) : proposalStatus === ProposalState.Succeeded ? (
          <Typography variant="subtitle1" color="success" textAlign="center">
            Succeeded
          </Typography>
        ) : (
          <></>
        )}
        {hasVoted && (
          <Typography variant="subtitle1" color="success" textAlign="center">
            You have already voted this proposal!
          </Typography>
        )}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }} spacing={1}>
          <Typography variant="h4" textAlign="center">
            {title}
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: 'primary.dark', minWidth: 200 }}
            disabled={proposalStatus !== ProposalState.Active || hasVoted}
            onClick={handleVote}
          >
            {proposalStatus === ProposalState.Pending ? (
              'Voting starts soon'
            ) : proposalStatus !== -1 && proposalStatus !== ProposalState.Active ? (
              'Voting has ended'
            ) : proposalStatus === ProposalState.Active && votingStatus === 1 ? (
              <>
                Voting ... <HashLoader color="#59f1f6" size={30} />
              </>
            ) : (
              'Vote'
            )}
          </Button>
        </Stack>
        <Stack direction="row" sx={{ mt: 3, mb: 3 }} spacing={3}>
          <Typography variant="subtitle2" textAlign="center">
            ID {`${proposalId.substr(0, 6)}...${proposalId.substr(proposalId.length - 4, 4)}`}
          </Typography>
          <Typography variant="subtitle2" textAlign="center">
            Proposed by: {proposer}
          </Typography>
          <Typography variant="subtitle2" textAlign="center">
            Created by: {account}
          </Typography>
        </Stack>
        <Divider />
        <Stack sx={{ mt: 3 }} spacing={1}>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <Typography variant="h6">Details</Typography>
              <Stack sx={{ mt: 3, border: 1, borderRadius: 1, borderColor: '#cdcdcd', minHeight: 200 }} spacing={3}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabId} onChange={handleChangeTab} aria-label="details" variant="standard">
                    <Tab sx={{ pl: 3, pr: 3 }} label="Description" {...a11yProps(0)} />
                    <Tab sx={{ pl: 3, pr: 3 }} label="Excutable code" {...a11yProps(1)} />
                  </Tabs>
                  {/* </AppBar> */}
                </Box>
                <TabPanel value={tabId} index={0}>
                  <Stack sx={{ pl: 3, pr: 3, pb: 3 }}>
                    <Typography variant="body1">{description}</Typography>
                  </Stack>
                </TabPanel>
                <TabPanel value={tabId} index={1}>
                  {actions.length > 0 && (
                    <Stack sx={{ pl: 3, pr: 3, pb: 3 }}>
                      {actions.map((action, index) => {
                        const _id = action.id;
                        const { targetAddress, method, calldatas } = action;
                        let signature = '';
                        if (method && calldatas !== null) {
                          const inputTypes = calldatas.map((val) => val.type);
                          signature = `${method}(${inputTypes.join(',')})`;
                        }

                        return (
                          <Box key={_id}>
                            <Stack sx={{ mt: 2 }} spacing={1}>
                              <Typography variant="subtitle2">Function {index + 1}</Typography>
                            </Stack>
                            <Stack sx={{ mt: 2, border: 1, borderRadius: 1, p: 5 }} spacing={3}>
                              <Stack>
                                <Typography variant="subtitle2">Signature:</Typography>
                                <Typography variant="body2">{signature}</Typography>
                              </Stack>
                              {calldatas !== null && (
                                <Stack>
                                  <Typography variant="subtitle2">Calldatas:</Typography>
                                  {calldatas.map((val) => {
                                    const { type, value } = val;
                                    return (
                                      <Stack direction="row" key={val.name}>
                                        <Typography sx={{ mr: 3 }} variant="body1">
                                          {type}:{' '}
                                        </Typography>
                                        <Typography variant="body2">{value}</Typography>
                                      </Stack>
                                    );
                                  })}
                                </Stack>
                              )}
                              <Stack>
                                <Typography variant="subtitle2">Target:</Typography>
                                <Typography variant="body2">{targetAddress}</Typography>
                              </Stack>
                              <Stack>
                                <Typography variant="subtitle2">Value:</Typography>
                                <Typography variant="body2">{0}</Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </TabPanel>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6">Status history</Typography>
              <Stack
                sx={{ mt: 3, p: 3, border: 1, borderRadius: 1, borderColor: '#cdcdcd', minHeight: 100 }}
                spacing={3}
              >
                {proposalStatus >= ProposalState.Pending && (
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <CheckCircleIcon color="success" />
                    <Stack>
                      <Typography variant="subtitle1">Pending</Typography>
                    </Stack>
                  </Stack>
                )}
                {proposalStatus >= ProposalState.Active && (
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <CheckCircleIcon color="success" />
                    <Stack>
                      <Typography variant="subtitle1">Active</Typography>
                    </Stack>
                  </Stack>
                )}
                {proposalStatus > ProposalState.Active && (
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <CheckCircleIcon color="success" />
                    <Stack>
                      <Typography variant="subtitle1">
                        {proposalStatus === ProposalState.Canceled ? (
                          'Canceled'
                        ) : proposalStatus === ProposalState.Defeated ? (
                          'Defeated'
                        ) : proposalStatus === ProposalState.Executed ? (
                          'Executed'
                        ) : proposalStatus === ProposalState.Expired ? (
                          'Expired'
                        ) : proposalStatus === ProposalState.Queued ? (
                          'Queued'
                        ) : proposalStatus === ProposalState.Succeeded ? (
                          'Succeeded'
                        ) : (
                          <></>
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
        {openVoteDialog && (
          <VoteDialog proposalId={proposalId} onSubmit={handleSubmitVote} onClose={handleCloseVoteDlg} />
        )}
      </Container>
    </Page>
  );
}
