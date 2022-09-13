/* eslint-disable react/jsx-boolean-value */
import PropTypes from 'prop-types';
// material ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  styled,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextareaAutosize
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useSnackbar } from 'notistack';
import { useGovernorContract } from '../../hooks/useContract';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}));

const BootstrapDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <Close />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired
};

VoteDialog.propTypes = {
  proposalId: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func
};

export default function VoteDialog({ proposalId, onSubmit, onClose }) {
  const { account } = useWeb3React();
  const governorContract = useGovernorContract();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [support, setSupport] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    (async () => {
      if (governorContract) {
        try {
          let description = await governorContract.descriptionsForPropose(proposalId);
          if (description) {
            description = JSON.parse(description);
            setTitle(description.title);
          }
        } catch (err) {
          console.log(err);
        }
      }
    })();
  }, [governorContract, proposalId]);

  const changeComment = (val) => {
    setComment(val);
  };

  const handleSubmit = () => {
    if (support === null) {
      enqueueSnackbar('Please choose your vote!', {
        variant: 'error'
      });
      return;
    }
    onSubmit(support, comment);
  };

  return (
    // so it will close the dialog, if we pass it to the onClose attribute.
    <BootstrapDialog onClose={onClose} aria-labelledby="customized-dialog-title" open={true} maxWidth="xs" fullWidth>
      <BootstrapDialogTitle id="customized-dialog-title" onClose={onClose} textAlign="center">
        {/* <Typography variant="h2"> */}
        Voting
        {/* </Typography> */}
      </BootstrapDialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          sx={{ mt: 2, pl: 2, pr: 2, pt: 2, pb: 2, background: '#dedede', borderRadius: 1 }}
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="subtitle2">
            {`${account.substr(0, 6)}...${account.substr(account.length - 4, 4)}`}
          </Typography>
          <Typography variant="subtitle2">Voting power: 0</Typography>
        </Stack>
        <Stack direction="row" sx={{ mt: 2, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="subtitle2">
            ID {`${proposalId.substr(0, 6)}...${proposalId.substr(proposalId.length - 4, 4)}`}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ mt: 2, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="h4">{title}</Typography>
        </Stack>
        <Stack sx={{ mt: 3, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="subtitle2">Choose your vote</Typography>
          <FormControl>
            <RadioGroup name="vote" onChange={(e) => setSupport(e.target.value)}>
              <FormControlLabel
                value="1"
                control={<Radio size="small" color="success" />}
                label="For"
                labelPlacement="end"
              />
              <FormControlLabel
                value="0"
                control={<Radio size="small" color="error" />}
                label="Against"
                labelPlacement="end"
              />
              <FormControlLabel
                value="2"
                control={<Radio size="small" color="default" />}
                label="Abstain"
                labelPlacement="end"
              />
            </RadioGroup>
          </FormControl>
        </Stack>
        <Stack sx={{ mt: 2, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="subtitle2">Add Comment</Typography>
          <TextareaAutosize
            sx={{ borderRadius: 1 }}
            minRows={5}
            placeholder="Tell the community what are your thoughts"
            onChange={(e) => changeComment(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" variant="contained" type="submit" onClick={handleSubmit} fullWidth>
          Submit
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
