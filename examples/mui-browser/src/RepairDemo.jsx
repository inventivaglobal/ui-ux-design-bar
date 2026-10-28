import React, { useState } from 'react';
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import BrokenCard from './BrokenCard';
import RepairedCard from './RepairedCard';
import evidence from './repair-evidence.json';

export default function RepairDemo() {
  const [repaired, setRepaired] = useState(false);
  return <Container component="main" maxWidth="md" sx={{ py: 8 }}>
    <Stack spacing={5}>
      <Box>
        <Chip label="B.A.R · Repair lab" variant="outlined" />
        <Typography component="h1" variant="h3" sx={{ mt: 3, fontSize: { xs: '2rem', sm: '3rem' } }}>Break it. Find it. Fix it.</Typography>
        <Typography sx={{ mt: 3 }}>One real, deliberately bounded BUILD → AUDIT → REPAIR loop. The button comes from BUILD; the decorative image starts with a missing alt attribute.</Typography>
      </Box>
      <Alert severity="info">This is an intentionally broken test fixture, not production content. The repair only adds empty alt text when the author explicitly marks an image as decorative. No files or server data are changed by this demo.</Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="contained" type="button" aria-pressed={repaired} onClick={() => setRepaired(!repaired)}>
          {repaired ? 'Restore broken fixture' : 'Preview safe repair'}
        </Button>
        <Button component="a" href="/">Back to preferences example</Button>
      </Stack>
      <Box role="status" aria-live="polite" aria-atomic="true">
        {repaired ? 'Static re-audit: 0 findings. Browser verification is reported separately by the test suite.' : 'Audit: 1 high-severity finding. Image is missing alt text; explicit decorative intent makes it repairable.'}
      </Box>
      <Box data-testid="repair-fixture">{repaired ? <RepairedCard /> : <BrokenCard />}</Box>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography component="h2" variant="h6">Review the edit</Typography>
        <Typography sx={{ my: 2 }}>Insertion at source line {evidence.diff[0].line}. The rest of the source is unchanged.</Typography>
        <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.875rem' }}>
          {'- <img data-bar-decorative="true" … />\n+ <img alt="" data-bar-decorative="true" … />'}
        </Box>
        <Typography variant="body2">Unknown image intent, spreads, explicit roles and existing labels are left untouched. Automated checks are evidence, not accessibility certification.</Typography>
      </Paper>
    </Stack>
  </Container>;
}
