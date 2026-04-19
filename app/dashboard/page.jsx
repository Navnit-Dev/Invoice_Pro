'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  IconButton,
  Button,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Inventory,
  Warning,
  AttachMoney,
  Pending,
  CheckCircle,
  ArrowForward,
  Edit,
  Business,
  Person,
  LocationOn,
  Phone,
  Email,
  Store,
  Language,
  Image,
  Save,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={60} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                  {trend === 'up' ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    color={trend === 'up' ? 'success.main' : 'error.main'}
                    fontWeight={500}
                  >
                    {trendValue}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                background: `${color}15`,
                color: color,
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const steps = ['Company Info', 'Contact Details', 'Branding'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openWizard, setOpenWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    companyName: '',
    ownerName: '',
    address: '',
    gstNumber: '',
    mobileNumber: '',
    email: '',
    website: '',
    invoicePrefix: '',
    logo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const [statsRes, storeRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/store'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);
        setWizardData(storeData);
        // Check if new user (no company name set)
        if (!storeData.companyName) {
          setOpenWizard(true);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardClose = () => {
    // Don't allow closing if profile is incomplete
    if (store?.companyName) {
      setOpenWizard(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleWizardChange = (prop) => (event) => {
    setWizardData({ ...wizardData, [prop]: event.target.value });
  };

  const handleWizardSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      });

      if (response.ok) {
        const data = await response.json();
        setStore(data);
        setOpenWizard(false);
        toast.success('Profile completed successfully!');
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Let&apos;s set up your business information. This will appear on your invoices.
            </Typography>
            <TextField
              fullWidth
              label="Company Name *"
              value={wizardData.companyName}
              onChange={handleWizardChange('companyName')}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Owner Name *"
              value={wizardData.ownerName}
              onChange={handleWizardChange('ownerName')}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Business Address *"
              multiline
              rows={2}
              value={wizardData.address}
              onChange={handleWizardChange('address')}
              required
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add your contact details so customers can reach you.
            </Typography>
            <TextField
              fullWidth
              label="Mobile Number *"
              value={wizardData.mobileNumber}
              onChange={handleWizardChange('mobileNumber')}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Email *"
              value={wizardData.email}
              onChange={handleWizardChange('email')}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="GST Number"
              value={wizardData.gstNumber}
              onChange={handleWizardChange('gstNumber')}
              sx={{ mb: 2 }}
              placeholder="Optional"
            />
            <TextField
              fullWidth
              label="Website"
              value={wizardData.website}
              onChange={handleWizardChange('website')}
              placeholder="Optional"
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customize your invoice branding.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={wizardData.logo}
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                {wizardData.companyName?.[0]?.toUpperCase() || 'S'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Logo URL"
                  value={wizardData.logo}
                  onChange={handleWizardChange('logo')}
                  placeholder="https://example.com/logo.png"
                  helperText="Enter a direct URL to your logo image"
                />
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Invoice Prefix"
              value={wizardData.invoicePrefix}
              onChange={handleWizardChange('invoicePrefix')}
              placeholder="e.g., INV"
              helperText="This will be used in invoice numbers (e.g., INV-0001)"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTrend = (current, previous) => {
    if (!previous) return { trend: 'up', value: '0%' };
    const diff = ((current - previous) / previous) * 100;
    return {
      trend: diff >= 0 ? 'up' : 'down',
      value: `${Math.abs(diff).toFixed(1)}%`,
    };
  };

  if (status === 'loading') {
    return null;
  }

  const revenueTrend = stats ? calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue) : null;

  // Check if profile is incomplete
  const isProfileIncomplete = store && (!store.companyName || !store.address || !store.mobileNumber);

  return (
    <MainLayout>
      <Box>
        {/* Profile Completion Warning */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setOpenWizard(true)}
                  startIcon={<Edit />}
                >
                  Complete Profile
                </Button>
              }
            >
              <AlertTitle>Profile Incomplete</AlertTitle>
              Please complete your store profile to generate professional invoices with your business details.
            </Alert>
          </motion.div>
        )}

        {/* Profile Completion Wizard Dialog */}
        <Dialog
          open={openWizard}
          onClose={handleWizardClose}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown={!store?.companyName}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" />
              <Typography variant="h6" component="span">
                Complete Your Profile
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Welcome! Let&apos;s set up your business profile to get started.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {getStepContent(activeStep)}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }} />
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleWizardSave}
                disabled={saving || !wizardData.companyName || !wizardData.ownerName || !wizardData.address || !wizardData.mobileNumber || !wizardData.email}
                startIcon={<Save />}
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 && (!wizardData.companyName || !wizardData.ownerName || !wizardData.address)}
              >
                Next
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here&apos;s what&apos;s happening with your business today
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={6} sm={6} lg={3}>
            <StatCard
              title="Monthly Revenue"
              value={stats ? formatCurrency(stats.monthlyRevenue) : '₹0'}
              subtitle="This month"
              icon={TrendingUp}
              color="#2563eb"
              trend={revenueTrend?.trend}
              trendValue={revenueTrend?.value}
              loading={loading}
            />
          </Grid>

          <Grid item xs={6} sm={6} lg={3}>
            <StatCard
              title="Total Sales"
              value={stats ? formatCurrency(stats.totalSales) : '₹0'}
              subtitle="All time"
              icon={AttachMoney}
              color="#10b981"
              loading={loading}
            />
          </Grid>

          <Grid item xs={6} sm={6} lg={3}>
            <StatCard
              title="Total Invoices"
              value={stats?.totalInvoices || 0}
              subtitle={`${stats?.pendingAmount > 0 ? formatCurrency(stats.pendingAmount) + ' pending' : 'All paid'}`}
              icon={Receipt}
              color="#f59e0b"
              loading={loading}
            />
          </Grid>

          <Grid item xs={6} sm={6} lg={3}>
            <StatCard
              title="Products"
              value={stats?.totalProducts || 0}
              subtitle={`${stats?.lowStockProducts || 0} low stock alerts`}
              icon={Inventory}
              color="#8b5cf6"
              loading={loading}
            />
          </Grid>
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 1, sm: 2 } }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" fontWeight="bold">
                    Recent Invoices
                  </Typography>
                  <Button
                    component={Link}
                    href="/invoices"
                    endIcon={<ArrowForward />}
                    size="small"
                  >
                    View All
                  </Button>
                </Box>

                {loading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : stats?.recentInvoices?.length > 0 ? (
                  <Box>
                    {stats.recentInvoices.map((invoice, index) => (
                      <motion.div
                        key={invoice._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2,
                            borderBottom: index < stats.recentInvoices.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {invoice.customer.name}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {formatCurrency(invoice.total)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.3,
                                borderRadius: 1,
                                background: invoice.paymentStatus === 'Paid' ? '#10b98120' : '#f59e0b20',
                                color: invoice.paymentStatus === 'Paid' ? '#059669' : '#d97706',
                                fontWeight: 500,
                              }}
                            >
                              {invoice.paymentStatus}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No invoices yet. Create your first invoice!
                    </Typography>
                    <Button
                      component={Link}
                      href="/invoices/create"
                      variant="contained"
                      sx={{ mt: 2 }}
                    >
                      Create Invoice
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Button
                    component={Link}
                    href="/invoices/create"
                    variant="contained"
                    fullWidth
                    startIcon={<Receipt />}
                    size="large"
                  >
                    Create New Invoice
                  </Button>

                  <Button
                    component={Link}
                    href="/inventory"
                    variant="outlined"
                    fullWidth
                    startIcon={<Inventory />}
                    size="large"
                  >
                    Manage Inventory
                  </Button>

                  {stats?.lowStockProducts > 0 && (
                    <Button
                      component={Link}
                      href="/inventory?lowStock=true"
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<Warning />}
                      size="large"
                    >
                      {stats.lowStockProducts} Low Stock Items
                    </Button>
                  )}
                </Box>

                <Box sx={{ mt: 4, p: 2, background: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Payment Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                      <Typography variant="body2">Paid</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {stats ? formatCurrency(stats.paidAmount) : '₹0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Pending sx={{ fontSize: 20, color: 'warning.main' }} />
                      <Typography variant="body2">Pending</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {stats ? formatCurrency(stats.pendingAmount) : '₹0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
