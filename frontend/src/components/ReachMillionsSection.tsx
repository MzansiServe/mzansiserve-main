import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Container, Button, Stack, alpha, useTheme, Grid, Paper, Avatar } from '@mui/material';
import { TrendingUp, Public, Groups, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ReachMillionsSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Users', value: '2.5M+', icon: <Groups />, color: '#10B981' },
    { label: 'Daily Interactions', value: '150K+', icon: <TrendingUp />, color: '#3B82F6' },
    { label: 'Local Impact', value: '95%', icon: <Public />, color: '#F59E0B' },
  ];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#F7F7F7',
        color: '#222222',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 0,
        mx: 0,
        mb: 8,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: alpha('#000', 0.05)
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={8} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '4.5rem' },
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    mb: 2,
                    color: '#222222'
                  }}
                >
                  Reach millions <br />
                  <Box component="span" sx={{ color: '#FF385C' }}>on MzansiServe</Box>
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#717171',
                    fontWeight: 400,
                    maxWidth: '500px',
                    lineHeight: 1.4,
                    mt: 3
                  }}
                >
                  From verified transport to professional services, join the network that South Africa trusts.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: '#FF385C',
                    color: 'white',
                    fontWeight: 600,
                    px: 4,
                    py: 1.8,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#E31C5F',
                    }
                  }}
                >
                  MzansiServe Setup
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/about')}
                  sx={{
                    borderColor: '#222222',
                    color: '#222222',
                    fontWeight: 600,
                    px: 4,
                    py: 1.8,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#000000',
                      bgcolor: alpha('#000', 0.04)
                    }
                  }}
                >
                  How it works
                </Button>
              </Stack>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box
                sx={{
                  p: 6,
                  borderRadius: 4,
                  bgcolor: 'white',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 900,
                    color: '#FF385C',
                    mb: 1,
                    letterSpacing: '-0.04em'
                  }}
                >
                  mzansi<Box component="span" sx={{ color: '#222222' }}>cover</Box>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    mb: 4,
                    color: '#222222',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  Verified & Protected
                </Typography>

                <Stack spacing={3} sx={{ textAlign: 'left' }}>
                  {[
                    'Guest Identity Verification',
                    'Reservation Screening',
                    'R3M Damage Protection',
                    '24-Hour Safety Line'
                  ].map((text, i) => (
                    <Stack key={i} direction="row" spacing={2} alignItems="center">
                      <Box sx={{ color: '#FF385C', display: 'flex' }}>
                        <Public sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#484848' }}>
                        {text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: alpha('#000', 0.06) }}>
                  <Typography variant="caption" sx={{ color: '#717171', fontStyle: 'italic' }}>
                    Standard on every service booking.
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ReachMillionsSection;
