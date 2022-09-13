import { useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
// material
import { Box, MenuItem, Link, Button, Divider, Typography } from '@mui/material';
// components
import { useDispatch } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';
import MenuPopover from '../../components/MenuPopover';
import { setupNetwork } from '../../utils/wallet';
import { switchNetwork } from '../../redux/slices/network';
// ----------------------------------------------------------------------

export default function LanguagePopover() {
  const anchorRef = useRef(null);
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = async (id) => {
    console.log(id);
    setOpen(false);

    const result = await setupNetwork(id);
    if (result === -1) dispatch(switchNetwork(id));
  };

  return (
    <>
      <Button
        variant="outlined"
        color="warning"
        ref={anchorRef}
        onClick={handleOpen}
        sx={{ color: 'primary.dark', borderColor: 'primary.dark' }}
        startIcon={<AddIcon />}
      >
        Create
      </Button>

      <MenuPopover open={open} onClose={handleClose} anchorEl={anchorRef.current}>
        <Box sx={{ py: 1 }}>
          <MenuItem onClick={handleClose} sx={{ py: 1, px: 2.5 }}>
            <Typography
              component={RouterLink}
              to="/create-presale"
              color="default"
              fontSize={16}
              sx={{
                '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                textDecoration: 'none',
                color: palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              Create Normal Presale
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleClose} sx={{ py: 1, px: 2.5 }}>
            <Typography
              component={RouterLink}
              to="/create-fair-launch"
              color="default"
              fontSize={16}
              sx={{
                '&:hover': { textDecoration: 'underline', color: 'primary.main' },
                textDecoration: 'none',
                color: palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              Create Fair Launch
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleClose} sx={{ py: 1, px: 2.5 }}>
            <Link href="https://forms.gle/5D6N5VhBij5KMrmZA" target="_blank" color="primary" fontSize={16}>
              Apply For Exclusive Presale
            </Link>
          </MenuItem>
        </Box>
      </MenuPopover>
    </>
  );
}
