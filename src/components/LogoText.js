import PropTypes from 'prop-types';
// material
import { Box } from '@material-ui/core';

// ----------------------------------------------------------------------

LogoText.propTypes = {
  sx: PropTypes.object
};

export default function LogoText({ sx }) {
  return (
    <Box sx={{ width: 100, height: 40, ...sx }}>
      <img src="/static/logo-text.png" alt="logo text" />
    </Box>
  );
}
