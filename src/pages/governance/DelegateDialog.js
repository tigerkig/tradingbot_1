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
  Divider
} from '@material-ui/core';
import { Close } from '@material-ui/icons';

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

DelegateDialog.propTypes = {
  onDelegate: PropTypes.func,
  onClose: PropTypes.func
};

export default function DelegateDialog({ onDelegate, onClose }) {
  return (
    // so it will close the dialog, if we pass it to the onClose attribute.
    <BootstrapDialog onClose={onClose} aria-labelledby="customized-dialog-title" open={true} maxWidth="xs" fullWidth>
      <BootstrapDialogTitle id="customized-dialog-title" onClose={onClose} textAlign="center">
        Delegate vote
      </BootstrapDialogTitle>
      <DialogContent>
        <Divider />
        <Stack direction="row" sx={{ mt: 2, pl: 2, pr: 2 }} spacing={2}>
          <Typography variant="body2">
            To activate your voting power in the DAO, you must delegate your tokens to yourself or someone else.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        {/* <Stack spacing={2} fullWidth> */}
        <Button color="secondary" variant="contained" type="submit" onClick={() => onDelegate(1)} fullWidth>
          Delegate to self
        </Button>
        <Button color="secondary" variant="outlined" type="submit" onClick={() => onDelegate(2)} fullWidth>
          Delegate to an address
        </Button>
        {/* </Stack> */}
      </DialogActions>
    </BootstrapDialog>
  );
}
