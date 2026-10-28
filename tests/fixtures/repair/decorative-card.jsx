import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import GeneratedButton from './GeneratedButton';

export default function DecorativeCard() {
  return <Paper variant="outlined" sx={{ p: 5 }}>
    <Stack spacing={3}>
      <Box>
        <img data-bar-decorative="true" width="48" height="48"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Ccircle cx='24' cy='24' r='20' fill='%23155eef'/%3E%3C/svg%3E" />
      </Box>
      <Typography variant="h5" component="h2">Your next great idea</Typography>
      <Typography>This circle is decoration, not information. Its intent was explicitly declared by the fixture author.</Typography>
      <Box><GeneratedButton /></Box>
    </Stack>
  </Paper>;
}
