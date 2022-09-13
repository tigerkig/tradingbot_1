/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
/* eslint-disable no-nested-ternary */
import {
  Stack,
  Typography,
  Container,
  Button,
  Grid,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Link,
  Chip
} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
// import MUIRichTextEditor from 'mui-rte';
import React, { useState, useEffect } from 'react';
import { NavLink as RouterLink } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { HashLoader, BeatLoader } from 'react-spinners';
import { useSnackbar } from 'notistack';
import { formatUnits } from '@ethersproject/units';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Page from '../components/Page';
import { useGtokenContract, useGovernorContract } from '../hooks/useContract';
import { GOVERNOR_ADDRESS, GTOKEN_ADDRESS, BLOCK_SEC } from '../config/constants';
import DelegateDialog from './governance/DelegateDialog';
import DelegateToAddressDialog from './governance/DelegateToAddressDialog';
import { useDispatch, useSelector } from '../redux/store';
import {
  initialized,
  setProposalNum,
  setProposalThreshold,
  setProposalDelay,
  setQuorumNeeded,
  setVotingPeriod,
  setProposals,
  setManageProposals
} from '../redux/slices/governance';

export default function Governance() {
  const dispatch = useDispatch();
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const token = GTOKEN_ADDRESS[network];
  const gtokenContract = useGtokenContract(token);
  const governorContract = useGovernorContract();
  const [isParsing, setIsParsing] = useState(false);
  const [isDelegating, setIsDelegating] = useState(0);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isLoadingParams, setIsLoadingParams] = useState(false);
  const {
    isInitialized,
    proposalNum,
    proposalThreshold,
    proposalDelay,
    quorumNeeded,
    votingPeriod,
    proposals,
    manageProposals
  } = useSelector((state) => state.governance);
  const [openDelegateDialog, setOpenDelegateDialog] = useState(false);
  const [openDelegateToAddressDialog, setOpenDelegateToAddressDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
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
    let manageProposalList = [];
    if (proposals.length > 0) {
      manageProposalList = proposals.filter(
        (proposal) =>
          [ProposalState.Pending, ProposalState.Active, ProposalState.Succeeded, ProposalState.Queued].indexOf(
            proposal.state
          ) > -1
      );
    }
    dispatch(setManageProposals(manageProposalList));
  }, [proposals]);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      if (governorContract) {
        if (!unmounted) {
          setIsParsing(true);
        }
        try {
          // setVoterNum(0);
          // setHolderNum(0);
          setIsLoadingParams(true);
          await loadProposals();
          dispatch(setProposalThreshold(formatUnits(await governorContract.proposalThreshold(), 0)));
          dispatch(setProposalDelay(formatTimeSec(BLOCK_SEC * formatUnits(await governorContract.votingDelay(), 0))));
          dispatch(setQuorumNeeded(formatUnits(await governorContract.quorumVotes(), 0)));
          dispatch(setVotingPeriod(formatTimeSec(BLOCK_SEC * formatUnits(await governorContract.votingPeriod(), 0))));
          setIsLoadingParams(false);
        } catch (err) {
          console.log(err);
          enqueueSnackbar('govenor contract error!', {
            variant: 'error'
          });
        }
        dispatch(initialized());
      }
      if (!unmounted) {
        setIsParsing(false);
      }
      console.log(isParsing);
    })();
    return () => {
      unmounted = true;
    };
  }, [enqueueSnackbar, governorContract]);

  // listen event
  useEffect(() => {
    if (governorContract) {
      governorContract.on('ProposalCanceled', (proposalId) => {
        console.log('ProposalCanceled', proposalId, String(proposalId));
        updateProposal(String(proposalId), { state: ProposalState.Canceled });
      });
      governorContract.on(
        'ProposalCreated',
        (proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description) => {
          // add proposal
          console.log(
            'ProposalCreated',
            proposalId,
            proposer,
            targets,
            values,
            signatures,
            calldatas,
            startBlock,
            endBlock,
            description
          );

          createProposal(String(proposalId), description);
        }
      );
      governorContract.on('ProposalQueued', (proposalId, eta) => {
        console.log('ProposalQueued', proposalId, eta);
        updateProposal(String(proposalId), { state: ProposalState.Queued });
      });
      governorContract.on('ProposalExecuted', (proposalId) => {
        console.log('ProposalExecuted', proposalId);
        updateProposal(String(proposalId), { state: ProposalState.Executed });
      });
      governorContract.on('ProposalThresholdSet', (oldProposalThreshold, newProposalThreshold) => {
        console.log('ProposalThresholdSet', oldProposalThreshold, newProposalThreshold);
        dispatch(setProposalThreshold(newProposalThreshold));
      });
      governorContract.on('QuorumNumeratorUpdated', (oldQuorumNumerator, newQuorumNumerator) => {
        console.log('QuorumNumeratorUpdated', oldQuorumNumerator, newQuorumNumerator);
        dispatch(setQuorumNeeded(newQuorumNumerator));
      });
      governorContract.on('VotingDelaySet', (oldVotingDelay, newVotingDelay) => {
        console.log('VotingDelaySet', oldVotingDelay, newVotingDelay);
        dispatch(setProposalDelay(newVotingDelay));
      });
      governorContract.on('VotingPeriodSet', (oldVotingPeriod, newVotingPeriod) => {
        console.log('VotingPeriodSet', oldVotingPeriod, newVotingPeriod);
        dispatch(setVotingPeriod(newVotingPeriod));
      });
      governorContract.on('TimelockChange', (oldTimelock, newTimelock) => {
        // time lock change event
        console.log('TimelockChange', oldTimelock, newTimelock);
      });
      governorContract.on('VoteCast', (voter, proposalId, support, weight, reason) => {
        // listen vote cast
        console.log('VoteCast', voter, proposalId, support, weight, reason);
      });
    }
    return () => {
      if (governorContract) governorContract.removeAllListeners();
    };
  }, [governorContract, proposals]);

  // const formatTimeNum = (time) => {
  //   if (time < 10) {
  //     time = `0${time}`;
  //   }
  //   return time;
  // };

  const formatTimeSec = (sec_num) => {
    const hours = Math.floor(sec_num / 3600);
    const minutes = Math.floor((sec_num - hours * 3600) / 60);
    const seconds = sec_num - hours * 3600 - minutes * 60;

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  const handleDelegateVote = () => {
    setOpenDelegateDialog(true);
  };

  const handleCloseDelegateDlg = () => {
    setOpenDelegateDialog(false);
  };

  const delegateVote = async (address) => {
    if (isDelegating === 0) {
      setIsDelegating(1);
      try {
        const tx = await gtokenContract.delegate(address);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          setIsDelegating(0);
          enqueueSnackbar('Voting delegated successufully!', {
            variant: 'success'
          });
        } else {
          enqueueSnackbar('Voting delegated failed!', {
            variant: 'error'
          });
        }
        setIsDelegating(0);
      } catch (err) {
        console.log(err);
        enqueueSnackbar('Failed in Voting delegate!', {
          variant: 'error'
        });
        setIsDelegating(0);
      }
    }
  };

  const loadProposals = async () => {
    setIsLoadingProposals(true);
    const proposalLength = formatUnits(await governorContract.proposalIdsLength(), 0);
    const proposalList = [];
    for (let i = 0; i < proposalLength; i++) {
      const proposalId = await governorContract.proposalIds(i);
      let description = await governorContract.descriptionsForPropose(proposalId);
      let proposalTitle = '';
      let proposalDescription = '';
      if (description) {
        description = JSON.parse(description);
        proposalTitle = description.title;
        proposalDescription = description.description;
      }
      const state = await governorContract.state(proposalId);
      const proposalDetail = await governorContract.proposals(proposalId);
      proposalList.push({
        id: String(proposalId),
        title: proposalTitle,
        description: proposalDescription,
        state,
        isQueuing: 0,
        isExecuting: 0,
        isCanceling: 0,
        detail: proposalDetail
      });
    }
    dispatch(setProposals(proposalList));
    dispatch(setProposalNum(proposalLength));
    setIsLoadingProposals(false);
  };

  const updateProposal = async (id, obj) => {
    const proposalList = proposals.map((proposal) => (proposal.id === id ? Object.assign(proposal, obj) : proposal));
    console.log(proposalList);
    dispatch(setProposals(proposalList));
  };

  const createProposal = async (proposalId, description) => {
    const proposalList = proposals.map((proposal) => proposal);
    console.log(proposalList);
    let proposalTitle = '';
    let proposalDescription = '';
    if (description) {
      description = JSON.parse(description);
      proposalTitle = description.title;
      proposalDescription = description.description;
    }
    const state = await governorContract.state(proposalId);
    const proposalDetail = await governorContract.proposals(proposalId);
    proposalList.push({
      id: String(proposalId),
      title: proposalTitle,
      description: proposalDescription,
      state,
      isQueuing: 0,
      isExecuting: 0,
      isCanceling: 0,
      detail: proposalDetail
    });
    dispatch(setProposals(proposalList));
    dispatch(setProposalNum(proposalList.length));
  };

  const handleCancelProposal = async (id) => {
    try {
      updateProposal(id, { isCanceling: 1 });
      const tx = await governorContract.cancel(id);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        enqueueSnackbar('Proposal canceled successufully!', {
          variant: 'success'
        });
      } else {
        enqueueSnackbar('Proposal canceled failed!', {
          variant: 'error'
        });
      }
    } catch (err) {
      console.log(err);
      enqueueSnackbar('Failed in cancel proposal', {
        variant: 'error'
      });
    }
    updateProposal(id, { isCanceling: 0 });
  };

  const handleQueueProposal = async (id) => {
    try {
      updateProposal(id, { isQueuing: 1 });
      const tx = await governorContract.queue(id);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        enqueueSnackbar('Proposal queue successufully!', {
          variant: 'success'
        });
      } else {
        enqueueSnackbar('Proposal queue failed!', {
          variant: 'error'
        });
      }
    } catch (err) {
      console.log(err);
      enqueueSnackbar('Failed in queue proposal', {
        variant: 'error'
      });
    }
    updateProposal(id, { isQueuing: 0 });
  };

  const handleExecuteProposal = async (id) => {
    try {
      updateProposal(id, { isExecuting: 1 });
      const tx = await governorContract.execute(id);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        enqueueSnackbar('Proposal execute successufully!', {
          variant: 'success'
        });
      } else {
        enqueueSnackbar('Proposal execute failed!', {
          variant: 'error'
        });
      }
    } catch (err) {
      console.log(err);
      enqueueSnackbar('Failed in execute proposal', {
        variant: 'error'
      });
    }
    updateProposal(id, { isExecuting: 0 });
  };

  const handleDelegate = (r) => {
    setOpenDelegateDialog(false);
    if (r === 1) {
      delegateVote(account);
    } else {
      setOpenDelegateToAddressDialog(true);
    }
  };

  const handleCloseDelegateToAddressDlg = () => {
    setOpenDelegateToAddressDialog(false);
  };

  const handleDelegateToAddress = (address) => {
    setOpenDelegateToAddressDialog(false);
    delegateVote(address);
  };

  const handleBackToDelegate = () => {
    setOpenDelegateToAddressDialog(false);
    setOpenDelegateDialog(true);
  };

  return (
    <Page title="Vote">
      <Container maxWidth="lg">
        <Typography variant="h4">Governance</Typography>
        {/* <Divider /> */}
        <Stack direction="row" sx={{ mt: 3 }} alignItems="end" style={{ float: 'right' }} spacing={1}>
          <Button
            variant="contained"
            component={RouterLink}
            to="/governance/create-proposal"
            sx={{ bgcolor: 'primary.dark' }}
          >
            Create New Proposal
          </Button>
          <Button variant="outlined" color="success" onClick={handleDelegateVote}>
            {isDelegating ? (
              <>
                Delegating Vote... <HashLoader color="#59f1f6" size={30} />
              </>
            ) : (
              'Delegate Vote'
            )}
          </Button>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Stack sx={{ mt: 2 }} spacing={1} alignItems="center">
              {/* <Typography variant="subtitle2">{voterNum}</Typography>
              <Typography variant="body2">Voters</Typography> */}
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack sx={{ mt: 2 }} spacing={1} alignItems="center">
              {/* <Typography variant="subtitle2">{holderNum}</Typography>
              <Typography variant="body2">Holders</Typography> */}
            </Stack>
          </Grid>
          <Grid item xs={4}>
            <Stack sx={{ mt: 2 }} spacing={1} alignItems="center">
              <Typography variant="subtitle2">{proposalNum}</Typography>
              <Typography variant="body2">Proposals</Typography>
            </Stack>
          </Grid>
        </Grid>
        <Stack sx={{ mt: 3 }} spacing={2}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="contact-parameters"
              id="contact-parameters"
            >
              <Typography variant="subtitle2" sx={{ width: '33%', flexShrink: 0 }}>
                Contract Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {!isInitialized && isLoadingParams ? (
                <Stack alignItems="center" spacing={3}>
                  <BeatLoader size={20} />
                </Stack>
              ) : (
                <Grid container spacing={5}>
                  <Grid item xs={5}>
                    <Typography sx={{ mb: 1 }} variant="subtitle1">
                      Parameters
                    </Typography>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Proposal threshold</Typography>
                      <Typography variant="body2">{proposalThreshold}</Typography>
                    </Stack>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Quorum needed</Typography>
                      <Typography variant="body2">{quorumNeeded}</Typography>
                    </Stack>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Proposal delay</Typography>
                      <Typography variant="body2">{proposalDelay}</Typography>
                    </Stack>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Voting period</Typography>
                      <Typography variant="body2">{votingPeriod}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={7}>
                    <Typography sx={{ mb: 1 }} variant="subtitle1">
                      Contract Addresses
                    </Typography>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Governor</Typography>
                      <Typography variant="body2">{GOVERNOR_ADDRESS[network]}</Typography>
                    </Stack>
                    <Stack sx={{ mt: 1 }} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2">Token</Typography>
                      <Typography variant="body2">{token}</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </Stack>
        <Stack sx={{ mt: 3 }} spacing={2}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="manage-proposals" id="manage-proposals">
              <Typography variant="h6" sx={{ width: '33%', flexShrink: 0 }}>
                Manage Proposals
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                When proposals are ready to be queued into the timelock, or need to be cancelled because of a drop below
                the support threshold they will be listed below.
              </Typography>
              <TableContainer sx={{ mt: 2 }} component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="proposal table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Proposal</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manageProposals.length > 0 ? (
                      manageProposals.map((proposal, index) => {
                        const { id, title, state, isQueuing, isExecuting, isCanceling } = proposal;
                        const isEnableQueue = state === ProposalState.Succeeded;
                        const isEnableExecute = state === ProposalState.Queued;

                        return (
                          <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                              <Stack>
                                <Link component={RouterLink} to={`/governance/proposal/${id}`} underline="none">
                                  <Typography variant="h6" color="default">
                                    {title}
                                  </Typography>
                                </Link>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  {state === ProposalState.Pending ? (
                                    <Chip label="Pending" color="primary" size="small" />
                                  ) : state === ProposalState.Active ? (
                                    <Chip label="Active" color="success" size="small" />
                                  ) : state === ProposalState.Canceled ? (
                                    <Chip label="Canceled" color="error" size="small" />
                                  ) : state === ProposalState.Defeated ? (
                                    <Chip label="Defeated" color="error" size="small" />
                                  ) : state === ProposalState.Executed ? (
                                    <Chip label="Executed" color="success" size="small" />
                                  ) : state === ProposalState.Expired ? (
                                    <Chip label="Expired" color="secondary" size="small" />
                                  ) : state === ProposalState.Queued ? (
                                    <Chip label="Queued" color="primary" size="small" />
                                  ) : state === ProposalState.Succeeded ? (
                                    <Chip label="Succeeded" color="success" size="small" />
                                  ) : (
                                    <></>
                                  )}
                                  <Typography variant="subtitle2">
                                    ID: {`${id.substr(0, 6)}...${id.substr(id.length - 4, 4)}`}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              {/* <Stack direction="row" align="right" spacing={2}> */}
                              <Button
                                variant="outlined"
                                color="primary"
                                disabled={!isEnableQueue}
                                onClick={() => handleQueueProposal(id)}
                              >
                                {isQueuing ? (
                                  <>
                                    Queuing... <HashLoader color="#59f1f6" size={25} />
                                  </>
                                ) : (
                                  'Queue'
                                )}
                              </Button>
                              <Button
                                sx={{ ml: 2 }}
                                variant="outlined"
                                color="success"
                                disabled={!isEnableExecute}
                                onClick={() => handleExecuteProposal(id)}
                              >
                                {isExecuting ? (
                                  <>
                                    Executing... <HashLoader color="#59f1f6" size={25} />
                                  </>
                                ) : (
                                  'Execute'
                                )}
                              </Button>
                              <Button
                                sx={{ ml: 2 }}
                                variant="outlined"
                                color="error"
                                onClick={() => handleCancelProposal(id)}
                              >
                                {isCanceling ? (
                                  <>
                                    Canceling... <HashLoader color="#59f1f6" size={25} />
                                  </>
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                              {/* </Stack> */}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : !isInitialized && isLoadingProposals ? (
                      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell colSpan={2} align="center">
                          <BeatLoader size={20} />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell colSpan={2} align="center">
                          Empty
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Stack>
        <Stack sx={{ mt: 5 }} spacing={2}>
          <Typography variant="h4">Proposals</Typography>
          <TableContainer sx={{ mt: 2 }} component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="proposal table">
              <TableHead>
                <TableRow>
                  <TableCell>Proposal</TableCell>
                  <TableCell>Votes for</TableCell>
                  <TableCell>Votes against</TableCell>
                  <TableCell align="right">Total votes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposals.length > 0 ? (
                  proposals.map((proposal, index) => {
                    const { id, title, state, detail } = proposal;
                    const forVotes = formatUnits(detail.forVotes, 0);
                    const againstVotes = formatUnits(detail.againstVotes, 0);
                    const totalVotes = formatUnits(detail.forVotes.add(detail.againstVotes), 0);

                    return (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack>
                            <Link component={RouterLink} to={`/governance/proposal/${id}`} underline="none">
                              <Typography variant="h6" color="default">
                                {title}
                              </Typography>
                            </Link>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              {state === ProposalState.Pending ? (
                                <Chip label="Pending" color="primary" size="small" />
                              ) : state === ProposalState.Active ? (
                                <Chip label="Active" color="success" size="small" />
                              ) : state === ProposalState.Canceled ? (
                                <Chip label="Canceled" color="error" size="small" />
                              ) : state === ProposalState.Defeated ? (
                                <Chip label="Defeated" color="error" size="small" />
                              ) : state === ProposalState.Executed ? (
                                <Chip label="Executed" color="success" size="small" />
                              ) : state === ProposalState.Expired ? (
                                <Chip label="Expired" color="secondary" size="small" />
                              ) : state === ProposalState.Queued ? (
                                <Chip label="Queued" color="primary" size="small" />
                              ) : state === ProposalState.Succeeded ? (
                                <Chip label="Succeeded" color="success" size="small" />
                              ) : (
                                <></>
                              )}
                              <Typography variant="subtitle2">
                                ID: {`${id.substr(0, 6)}...${id.substr(id.length - 4, 4)}`}
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography color="primary">{forVotes}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color="error">{againstVotes}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography color="default">{totalVotes}</Typography>
                          {/* <Typography color="default">0 addresses</Typography> */}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : !isInitialized && isLoadingProposals ? (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell colSpan={4} align="center">
                      <BeatLoader size={20} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell colSpan={4} align="center">
                      Empty
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
        {/* <Stack sx={{ mt: 5 }} spacing={2}>
          <Typography variant="h4">Top Voters</Typography>
          <TableContainer sx={{ mt: 2 }} component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="proposal table">
              <TableHead>
                <TableRow>
                  <TableCell>Voter</TableCell>
                  <TableCell align="right">Proposals voted</TableCell>
                  <TableCell align="right">Total votes</TableCell>
                  <TableCell align="right">Voting power</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell colSpan={5} align="center">
                    Empty
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Stack> */}
        {openDelegateDialog && <DelegateDialog onDelegate={handleDelegate} onClose={handleCloseDelegateDlg} />}
        {openDelegateToAddressDialog && (
          <DelegateToAddressDialog
            onDelegate={handleDelegateToAddress}
            onClose={handleCloseDelegateToAddressDlg}
            onBack={handleBackToDelegate}
          />
        )}
      </Container>
    </Page>
  );
}
