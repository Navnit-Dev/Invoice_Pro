'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Business,
  Person,
  LocationOn,
  Phone,
  Email,
  Language,
  Save,
  Store,
  Receipt,
  Image,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState({
    companyName: '',
    ownerName: '',
    address: '',
    gstNumber: '',
    mobileNumber: '',
    email: '',
    website: '',
    logo: '',
    invoicePrefix: 'INV',
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await fetch('/api/store');
      if (!response.ok) throw new Error('Failed to fetch store');
      const data = await response.json();
      setStore(data);
    } catch (error) {
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setStore({ ...store, [field]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });

      if (!response.ok) throw new Error('Failed to update store');

      toast.success('Store settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Store Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage your store information and preferences
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Avatar
                    src={store?.logo || ''}
                    sx={{
                      width: 100,
                      height: 100,
                      margin: '0 auto',
                      mb: 2,
                      background: 'primary.main',
                      fontSize: '2.5rem',
                    }}
                  >
                    {store?.companyName?.[0]?.toUpperCase() || 'S'}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    {session?.user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {session?.user?.email}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {store?.companyName}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Settings Form */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Store Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Company Name *"
                        value={store.companyName}
                        onChange={handleChange('companyName')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Owner Name *"
                        value={store.ownerName}
                        onChange={handleChange('ownerName')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Address *"
                        multiline
                        rows={2}
                        value={store.address}
                        onChange={handleChange('address')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Mobile Number *"
                        value={store.mobileNumber}
                        onChange={handleChange('mobileNumber')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email *"
                        type="email"
                        value={store.email}
                        onChange={handleChange('email')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GST Number"
                        value={store.gstNumber}
                        onChange={handleChange('gstNumber')}
                        placeholder="Optional"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        value={store.website}
                        onChange={handleChange('website')}
                        placeholder="Optional"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Language color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Invoice Prefix"
                        value={store.invoicePrefix}
                        onChange={handleChange('invoicePrefix')}
                        placeholder="e.g., INV"
                        helperText="This will be used in invoice numbers (e.g., INV-0001)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Receipt color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Logo URL"
                        value={store.logo}
                        onChange={handleChange('logo')}
                        placeholder="https://example.com/logo.png"
                        helperText="Enter a direct URL to your logo image (PNG/JPG). Leave empty to use company initial."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Image color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
