'use client';

import { useEffect, useState, useCallback } from 'react';
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
  useTheme,
  useMediaQuery,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Visibility,
  Delete,
  Search,
  QrCodeScanner,
  FilterList,
  Download,
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
  const [scanning, setScanning] = useState(false); // New state for scanner feedback
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Memoized fetch to prevent unnecessary re-renders
  const fetchInvoices = useCallback(async () => {
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
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters, pagination.limit]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format}`);
    }
  };

  // FIXED: Improved Scan Handler
  const handleBarcodeScan = async (barcode) => {
    if (!barcode || scanning) return;
    
    setScanning(true);
    const loadingToast = toast.loading('Searching for invoice...');
    
    try {
      const response = await fetch(`/api/invoices/scan?barcode=${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        throw new Error('Invoice not found');
      }
      
      const invoice = await response.json();
      toast.success('Invoice Found!', { id: loadingToast });
      setShowScanner(false);
      router.push(`/invoices/${invoice._id}`);
    } catch (error) {
      toast.error(error.message || 'Invalid barcode', { id: loadingToast });
    } finally {
      setScanning(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
              startIcon={scanning ? <CircularProgress size={20} /> : <QrCodeScanner />}
              onClick={() => setShowScanner(true)}
              disabled={scanning}
            >
              Scan Barcode
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by invoice number or customer..."
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
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant={showFilters ? 'contained' : 'outlined'}
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                  </Button>
                  <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('csv')}>
                    CSV
                  </Button>
                  <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('excel')}>
                    Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Status"
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="Paid">Paid</MenuItem>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Partial">Partial</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth size="small" type="date" label="From"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth size="small" type="date" label="To"
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

        {/* Desktop and Mobile Views */}
        <Card>
          {isMobile ? (
            <List>
              {loading ? <Box p={3} textAlign="center">Loading...</Box> : 
               invoices.map((inv, idx) => (
                <ListItemButton key={inv._id} component={Link} href={`/invoices/${inv._id}`} divider>
                  <ListItemText 
                    primary={`${inv.invoiceNumber} - ${inv.customer.name}`} 
                    secondary={`${formatCurrency(inv.total)} | ${inv.paymentStatus}`} 
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
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
                    <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                  ) : (
                    invoices.map((invoice, index) => (
                      <TableRow key={invoice._id}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customer.name}</TableCell>
                        <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={invoice.paymentStatus} 
                            color={invoice.paymentStatus === 'Paid' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell align="center">
                          <IconButton component={Link} href={`/invoices/${invoice._id}`} size="small">
                            <Visibility />
                          </IconButton>
                          <IconButton color="error" onClick={() => setDeleteConfirm(invoice)} size="small">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(e, page) => setPagination({ ...pagination, page })}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* Modals */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>Delete Invoice?</DialogTitle>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm._id)} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />
      </Box>
    </MainLayout>
  );
}
