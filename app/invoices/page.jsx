'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Tooltip,
  Fab,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Snackbar,
  Drawer,
} from '@mui/material';
import {
  Add,
  Visibility,
  PictureAsPdf,
  Delete,
  Search,
  QrCodeScanner,
  FilterList,
  Download,
  CalendarToday,
  Close,
  ContentCopy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import toast from 'react-hot-toast';

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Memoized filters for better performance
  const debouncedFilters = useMemo(() => ({
    ...filters,
    search: filters.search.trim()
  }), [filters]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500));
  }, [debouncedFilters]);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/api/invoices?page=${pagination.page}&limit=${pagination.limit}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (error) {
      console.error('Fetch invoices error:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // FIXED & ENHANCED Barcode Search Functions
  const handleBarcodeScan = useCallback(async (barcodeData) => {
    if (!barcodeData || barcodeData.trim() === '') {
      toast.error('No barcode data detected');
      return;
    }

    const cleanBarcode = barcodeData.trim();
    console.log('Barcode scanned:', cleanBarcode); // Debug log

    try {
      setBarcodeLoading(true);
      setShowScanner(false);

      // Try multiple barcode formats
      const searchPromises = [
        // Direct barcode lookup
        fetch(`/api/invoices/scan?barcode=${encodeURIComponent(cleanBarcode)}`),
        // Invoice number lookup (in case barcode contains invoice number)
        fetch(`/api/invoices/search?query=${encodeURIComponent(cleanBarcode)}`),
        // Partial match
        fetch(`/api/invoices?search=${encodeURIComponent(cleanBarcode)}&limit=1`)
      ];

      const responses = await Promise.allSettled(searchPromises);
      
      let foundInvoice = null;

      // Check first API (dedicated scan endpoint)
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        const data = await responses[0].value.json();
        foundInvoice = data.invoice || data;
      }

      // If not found, check search endpoints
      if (!foundInvoice) {
        for (let i = 1; i < responses.length; i++) {
          if (responses[i].status === 'fulfilled' && responses[i].value.ok) {
            const data = await responses[i].value.json();
            if (data.invoices && data.invoices.length > 0) {
              foundInvoice = data.invoices[0];
              break;
            }
          }
        }
      }

      if (foundInvoice && foundInvoice._id) {
        toast.success(`Found invoice: ${foundInvoice.invoiceNumber}`);
        setBarcodeResult(foundInvoice);
        router.push(`/invoices/${foundInvoice._id}`);
      } else {
        // Show search drawer with possible matches
        setBarcodeResult({ searchTerm: cleanBarcode, noExactMatch: true });
        toast.error('Invoice not found. Showing similar results...');
      }

    } catch (error) {
      console.error('Barcode scan error:', error);
      toast.error(`Invoice not found for barcode: ${cleanBarcode}`);
    } finally {
      setBarcodeLoading(false);
    }
  }, [router]);

  // Manual barcode search
  const handleManualBarcodeSearch = async () => {
    if (filters.search.trim()) {
      await handleBarcodeScan(filters.search.trim());
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete invoice');

      toast.success('Invoice deleted successfully');
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleExport = async (format) => {
    try {
      let url = `/api/export/${format}?`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.startDate) url += `startDate=${filters.startDate}&`;
      if (filters.endDate) url += `endDate=${filters.endDate}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to export ${format}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoices-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Invoice History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all your invoices
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeScanner />}
              onClick={() => setShowScanner(true)}
              disabled={barcodeLoading}
            >
              {barcodeLoading ? <CircularProgress size={20} /> : <QrCodeScanner />}
              {barcodeLoading ? 'Scanning...' : 'Scan Barcode'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              component={Link}
              href="/invoices/create"
            >
              Create Invoice
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Search by invoice number, customer or barcode..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleManualBarcodeSearch}
                    disabled={!filters.search.trim() || barcodeLoading}
                    startIcon={barcodeLoading ? <CircularProgress size={20} /> : <QrCodeScanner />}
                  >
                    Scan
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant={showFilters ? 'contained' : 'outlined'}
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('csv')}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleExport('excel')}
                  >
                    Export Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Payment Status"
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                          <MenuItem value="">All Statuses</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Partial">Partial</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="From Date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="To Date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Barcode Search Results Drawer */}
        <Drawer
          anchor="bottom"
          open={!!barcodeResult}
          onClose={() => setBarcodeResult(null)}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Barcode Search Results
            </Typography>
            {barcodeResult?.noExactMatch && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No exact match found for "{barcodeResult.searchTerm}". Try searching manually.
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => {
                navigator.clipboard.writeText(barcodeResult.searchTerm);
                toast.success('Barcode copied!');
              }}
              sx={{ mb: 2 }}
            >
              Copy Barcode: {barcodeResult?.searchTerm}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setBarcodeResult(null)}
            >
              Close
            </Button>
          </Box>
        </Drawer>

        {/* Invoices List/Table */}
        <Card>
          {isMobile ? (
            // Mobile List View
            <Box>
              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>
              ) : invoices.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No invoices found
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    component={Link}
                    href="/invoices/create"
                    sx={{ mt: 2 }}
                  >
                    Create Your First Invoice
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {invoices.map((invoice, index) => (
                    <motion.div
                      key={invoice._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItemButton
                        component={Link}
                        href={`/invoices/${invoice._id}`}
                        sx={{
                          borderBottom: index < invoices.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" fontWeight={600} fontFamily="monospace">
                                {invoice.invoiceNumber}
                              </Typography>
                              <Chip
                                label={invoice.paymentStatus}
                                size="small"
                                color={
                                  invoice.paymentStatus === 'Paid'
                                    ? 'success'
                                    : invoice.paymentStatus === 'Pending'
                                    ? 'warning'
                                    : 'default'
                                }
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {invoice.customer.name}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </motion.div>
                  ))}
                </List>
              )}
              {/* Pagination */}
              {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={(e, page) => setPagination({ ...pagination, page })}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          ) : (
            // Desktop Table View
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                          No invoices found
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          component={Link}
                          href="/invoices/create"
                          sx={{ mt: 2 }}
                        >
                          Create Your First Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600} fontFamily="monospace">
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {invoice.customer?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.customer?.phone || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={600}>
                            {formatCurrency(invoice.total)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={invoice.paymentStatus}
                            size="small"