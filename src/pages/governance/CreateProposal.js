/* eslint-disable consistent-return */
/* eslint-disable react/no-this-in-sfc */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/accessible-emoji */
/* eslint-disable no-nested-ternary */
import {
  Stack,
  Typography,
  Card,
  Divider,
  Container,
  Box,
  styled,
  TextField,
  Button,
  Paper,
  FormControl
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import MUIRichTextEditor from 'mui-rte';
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWalletModal } from 'redrum-pancake-uikit';
import { useWeb3React } from '@web3-react/core';
import HashLoader from 'react-spinners/HashLoader';
import { useSnackbar } from 'notistack';
// import { formatUnits, parseUnits } from '@ethersproject/units';
import { Interface } from '@ethersproject/abi';
// eslint-disable-next-line import/named
import { UploadSingleFile } from '../../components/upload';
import Page from '../../components/Page';
import { useGovernorContract } from '../../hooks/useContract';
// import { GOVERNOR_ADDRESS, TOKEN_ADDRESS } from '../../config/constants';
import useAuth from '../../hooks/useAuth';

const CardContainer = styled(Box)(({ theme }) => ({
  transition: 'all .5s',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '860px',
  marginLeft: 'auto',
  marginRight: 'auto'
}));

export default function CreateProposal() {
  const navigate = useNavigate();
  const { account } = useWeb3React();
  const network = useSelector((state) => state.network.chainId);
  const auth = useAuth(network);
  const { onPresentConnectModal } = useWalletModal(auth.login, auth.logout, (t) => t, account, Number(network));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const governorContract = useGovernorContract();
  const [isProposing, setIsProposing] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [actions, setActions] = useState([]);
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [actionCount, setActionCount] = useState(false);

  const handleRemoveAction = (_event, id) => {
    const actionList = actions.filter((value) => value.id !== id);
    setActions(actionList);
  };

  const handleAddAction = () => {
    setIsAddingAction(true);
    const actionList = actions;
    let lastIndex = 0;
    if (actions.length > 0) {
      lastIndex = actions[actions.length - 1].index;
    }
    actionList.push({
      id: `action_${lastIndex + 1}`,
      index: lastIndex + 1,
      targetAddress: '',
      abi: null,
      method: '',
      calldatas: null
    });
    setActions(actionList);
    setIsAddingAction(false);
    setActionCount(actions.length);
  };

  const handleSetTargetAddress = (id, value) => {
    const actionList = actions.map((action) =>
      action.id === id ? Object.assign(action, { targetAddress: value }) : action
    );
    setActions(actionList);
  };

  const handleChangeMethod = (id, value) => {
    const action = actions.find((val) => val.id === id);
    const newData = { method: value };
    if (action.abi !== null) {
      const { abi } = action;
      const func = abi.find((val) => val.type === 'function' && val.name === value);
      if (func) {
        newData.calldatas = func.inputs.map((val) => Object.assign(val, { value: '' }));
      }
    }
    const actionList = actions.map((action) => (action.id === id ? Object.assign(action, newData) : action));
    setActions(actionList);
  };

  const handleSetCalldata = (id, key, value) => {
    const action = actions.find((val) => val.id === id);
    let calldatas = null;
    if (action.calldatas) {
      calldatas = action.calldatas.map((val) => (val.name === key ? Object.assign(val, { value }) : val));
    }
    const actionList = actions.map((action) => (action.id === id ? Object.assign(action, { calldatas }) : action));
    setActions(actionList);
  };

  const handleDrop = useCallback((id, acceptedFiles) => {
    const file = acceptedFiles[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file, 'UTF-8');
    fileReader.onload = (e) => {
      try {
        const abiObj = JSON.parse(e.target.result);
        const actionList = actions.map((action) =>
          action.id === id ? Object.assign(action, { abi: abiObj }) : action
        );
        setActions(actionList);
      } catch (err) {
        console.log(err);
        enqueueSnackbar('Invalid Json data imported', {
          variant: 'error'
        });
      }
    };
  });

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
    if (isProposing === 0) {
      setIsProposing(2);
      const targetAddresses = actions.map((val) => val.targetAddress);
      // eslint-disable-next-line no-unused-vars
      const values = actions.map((_val) => 0);
      const calldatas = actions.map((val) => {
        const params = val.calldatas.map((val) => `${val.type} ${val.name}`);
        const values = val.calldatas.map((val) => val.value);
        const iface = new Interface([`function ${val.method}(${params.join(', ')})`]);
        return iface.encodeFunctionData(val.method, values);
      });
      const desc = JSON.stringify({ title, description });
      const abis = JSON.stringify(
        actions.map((val) => {
          const params = val.calldatas.map((val) => `${val.type} ${val.name}`);
          return {
            abi: `function ${val.method}(${params.join(', ')})`,
            id: val.id,
            index: val.index,
            targetAddress: val.targetAddress,
            // abi: val.abi,
            method: val.method,
            calldatas: val.calldatas
          };
        })
      );

      try {
        // console.log(targetAddresses, values, calldatas, desc);
        // const name = await governorContract.name();
        // console.log(name);
        const tx = await governorContract.propose(targetAddresses, values, calldatas, desc, abis);
        const receipt = await tx.wait();
        console.log(receipt);
        if (receipt.status === 1) {
          enqueueSnackbar('Proposed successufully!', {
            variant: 'success'
          });
          setActions([]);
          const { proposalId } = receipt.events[0].args;
          // <Redirect to={`/governance/proposal/${proposalId}`} />;
          navigate(`/governance/proposal/${proposalId}`);
        } else {
          enqueueSnackbar('Proposed failed!', {
            variant: 'error'
          });
        }
        setIsProposing(0);
      } catch (err) {
        console.log(err);
        enqueueSnackbar('Propose failed!', {
          variant: 'error'
        });
        setIsProposing(0);
      }
    }
  };

  return (
    <Page title="Vote">
      <Container maxWidth="lg">
        <Typography variant="h4" textAlign="center">
          Create a new proposal
        </Typography>
        <CardContainer>
          <Card
            sx={{
              width: 1,
              p: 3,
              transition: 'all .3s'
            }}
          >
            <Stack direction="row" spacing={1}>
              <CheckCircleIcon />
              <Typography variant="body2">
                You have 100K voting power. You’ve reached the proposal threshold! 😊
              </Typography>
            </Stack>
          </Card>
        </CardContainer>
        <CardContainer>
          <Card
            sx={{
              width: 1,
              p: 3,
              transition: 'all .3s'
            }}
          >
            <Typography sx={{ mb: 2 }} variant="h5" textAlign="left">
              Name Your Proposal
            </Typography>
            {/* <Divider /> */}
            <Typography variant="body2">
              Give your proposal a title and a description. They will be public when your proposal goes live!
            </Typography>
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="h6">Title</Typography>
              <TextField
                fullWidth
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
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="h6">Description</Typography>
              <TextField
                fullWidth
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
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="h6">Preview Image (Optional)</Typography>
              <TextField
                fullWidth
                type="text"
                value={previewImage}
                onChange={(e) => {
                  setPreviewImage(e.target.value);
                }}
                sx={{
                  width: 1
                }}
                placeholder="Enter the preview image link..."
              />
            </Stack>
          </Card>
        </CardContainer>
        <CardContainer>
          <Card
            sx={{
              width: 1,
              p: 3,
              transition: 'all .3s'
            }}
          >
            <Typography sx={{ mb: 2 }} variant="h5" textAlign="left">
              Add Action
            </Typography>
            {actions.map((action) => {
              const _id = action.id;
              const { targetAddress, abi, method, calldatas } = action;
              // console.log(abi, method, calldatas);
              let funcs = [];
              if (abi !== null) {
                funcs = abi.filter((val) => val.type === 'function');
              }

              return (
                <Box key={_id}>
                  <Stack sx={{ mt: 3 }} spacing={1}>
                    <Typography variant="h6">Target contract address</Typography>
                    <TextField
                      fullWidth
                      type="text"
                      value={targetAddress}
                      onChange={(e) => {
                        handleSetTargetAddress(_id, e.target.value);
                      }}
                      sx={{
                        width: 1
                      }}
                      placeholder="Enter the target address..."
                    />
                  </Stack>
                  <Stack sx={{ mt: 3 }} spacing={1}>
                    <Typography variant="h6">Contract ABI file</Typography>
                    <UploadSingleFile maxSize={3145728} onDrop={(value) => handleDrop(_id, value)} />
                  </Stack>
                  {abi !== null && (
                    <Stack direction="row" sx={{ mt: 1 }} spacing={1}>
                      <CheckCircleIcon />
                      <Typography variant="body2">ABI file uploaded</Typography>
                    </Stack>
                  )}
                  <Stack sx={{ mt: 3 }} spacing={1}>
                    <FormControl disabled={abi === null}>
                      <Typography variant="h6">Contract Method</Typography>
                      <Select
                        value={method}
                        onChange={(e) => {
                          handleChangeMethod(_id, e.target.value);
                        }}
                        labelId="contract-method-select-label"
                        id="contract-method-label"
                      >
                        <MenuItem value="">Select the contract method...</MenuItem>
                        {funcs.map((func) => {
                          const funcName = func.name;
                          return (
                            <MenuItem key={funcName} value={funcName}>
                              {funcName}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Stack>
                  {calldatas !== null && (
                    <Stack sx={{ mt: 3 }} spacing={1}>
                      <Typography variant="h6">Calldatas</Typography>
                      <Typography sx={{ mt: 2 }} variant="body2">
                        The data for the function arguments you wish to send when the action executes
                      </Typography>
                      {calldatas.map((calldata) => (
                        <Stack direction="row" sx={{ mt: 2 }} key={calldata.name} alignItems="center">
                          <Typography
                            variant="h6"
                            sx={{ border: 1, borderRadius: 1, mr: 3, p: 1, textAlign: 'center' }}
                            minWidth={200}
                            alignItems="center"
                          >
                            {calldata.name}
                          </Typography>
                          <TextField
                            fullWidth
                            type="text"
                            value={calldata.value}
                            onChange={(e) => {
                              handleSetCalldata(_id, calldata.name, e.target.value);
                            }}
                            sx={{
                              width: 1
                            }}
                            placeholder={calldata.type}
                          />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ mt: 3 }} spacing={1}>
                    <Button variant="outlined" onClick={(event) => handleRemoveAction(event, _id)}>
                      Remove Action
                    </Button>
                  </Stack>
                  <Divider sx={{ mt: 3 }} />
                </Box>
              );
            })}
            <Stack direction="row" sx={{ mt: 3 }} alignItems="end">
              <Button variant="contained" onClick={(event) => handleAddAction(event)}>
                {isAddingAction ? (
                  <>
                    Adding Action ... <HashLoader color="#59f1f6" size={30} />
                  </>
                ) : (
                  'Add Action'
                )}
              </Button>
              <Paper sx={{ display: 'none' }}>{actionCount}</Paper>
            </Stack>
          </Card>
        </CardContainer>
        <CardContainer>
          <Card
            sx={{
              width: 1,
              p: 3,
              transition: 'all .3s'
            }}
          >
            <Typography sx={{ mb: 2 }} variant="h5" textAlign="left">
              Preview Proposal
            </Typography>
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="h5" textAlign="center">
                {title}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ mt: 3 }} spacing={1}>
              <Typography sx={{ mr: 3 }} variant="body2" textAlign="left">
                Posted by:
              </Typography>
              <Typography variant="body1" textAlign="left">
                {account}
              </Typography>
            </Stack>
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="subtitle1" textAlign="left">
                Description
              </Typography>
              <Typography sx={{ mt: 2 }} variant="body1" textAlign="left">
                {description}
              </Typography>
            </Stack>
            <Stack sx={{ mt: 3 }} spacing={1}>
              <Typography variant="subtitle1" textAlign="left">
                Actions
              </Typography>
            </Stack>
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
            <Stack sx={{ mt: 3 }} alignItems="center" spacing={1}>
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
