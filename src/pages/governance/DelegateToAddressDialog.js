/* eslint-disable jsx-a11y/accessible-emoji */
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
  Divider,
  TextField
} from '@material-ui/core';
import { Close, ArrowBack } from '@material-ui/icons';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}));

const BootstrapDialogTitle = (props) => {
  const { children, onClose, onBack, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {onBack ? (
        <IconButton
          aria-label="back"
          onClick={onBack}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <ArrowBack />
        </IconButton>
      ) : null}
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
  onClose: PropTypes.func.isRequired,
  onBack: PropTypes.func
};

DelegateToAddressDialog.propTypes = {
  onDelegate: PropTypes.func,
  onClose: PropTypes.func,
  onBack: PropTypes.func
};

export default function DelegateToAddressDialog({ onDelegate, onClose, onBack }) {
  const [delegateAddress, setDelegateAddress] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const handleDelegate = () => {
    if (delegateAddress === '') {
      enqueueSnackbar('Please input delegate address!', {
        variant: 'error'
      });
      return;
    }
    onDelegate(delegateAddress);
  };

  return (
    // so it will close the dialog, if we pass it to the onClose attribute.
    <BootstrapDialog onClose={onClose} aria-labelledby="customized-dialog-title" open={true} maxWidth="xs" fullWidth>
      <BootstrapDialogTitle id="customized-dialog-title" onClose={onClose} onBack={onBack} textAlign="center">
        Delegate vote
      </BootstrapDialogTitle>
      <DialogContent>
        <Divider />
        <Stack direction="row" sx={{ mt: 2, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="body2">
            👀 Delegate all your voting power to this address.You can always re-delegate to yourself or someone else.
          </Typography>
        </Stack>
        <Stack sx={{ mt: 3, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="subtitle2">Delegate Address</Typography>
          <TextField
            fullWidth
            type="text"
            value={delegateAddress}
            onChange={(e) => {
              setDelegateAddress(e.target.value);
            }}
            sx={{
              width: 1
            }}
            placeholder="Enter an address..."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" variant="contained" type="submit" onClick={() => handleDelegate()} fullWidth>
          Delegate votes
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
