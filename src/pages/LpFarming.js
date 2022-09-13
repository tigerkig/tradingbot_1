import { Stack, Typography, Card, Divider, Container, Box, styled } from '@mui/material';
import React from 'react';
import Page from '../components/Page';

const CardContainer = styled(Box)(({ theme }) => ({
  transition: 'all .5s',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '860px',
  marginLeft: 'auto',
  marginRight: 'auto'
}));

export default function LpFarming() {
  return (
    <Page title="Lp Farming">
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
            <Typography variant="h4">Lp Farming</Typography>
            <Divider />
            <Stack
              sx={{ mt: 5, mb: 2, ml: 3, mr: 3 }}
              alignItems="center"
              spacing={10}
              // margin={3}
              padding={2}
              border={1}
              borderRadius={2}
            >
              <Typography variant="h6">Coming Soon</Typography>
            </Stack>
          </Card>
        </CardContainer>
      </Container>
    </Page>
  );
}
