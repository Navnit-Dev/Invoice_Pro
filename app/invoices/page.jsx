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
  Paper,
  Fade,
} from '@mui/material';
import {
  Add,
  Visibility,
  Delete,
  Search,
  QrCodeScanner,
  FilterList,
  Download,
  RestartAlt,
  ReceiptLong,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

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
    const delayDebounceFn = setTimeout(() => {
      fetchInvoices();
    }, 400); // Debounce search to prevent excessive API calls

    return () => clearTimeout(delayDebounceFn);
  }, [fetchInvoices]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      toast.success('Invoice removed');
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (error) {
      toast.error('Error deleting invoice');
    }
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', startDate: '', endDate: '' });
  };

  // FIXED SCANNER: Puts value in search box and triggers fetch
  const handleBarcodeScan = (barcode) => {
    if (!barcode) return;
    setFilters((prev) => ({ ...prev, search: barcode }));
    setShowScanner(false);
    toast.success(`Scanned: ${barcode}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <Box sx={{ pb: 5 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReceiptLong color="primary" fontSize="large" /> Invoice History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your business transactions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<QrCodeScanner />}
              onClick={() => setShowScanner(true)}
              sx={{ borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Scan
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              component={Link}
              href="/invoices/create"
              sx={{ borderRadius: 2, boxShadow: theme.shadows[4] }}
            >
              New Invoice
            </Button>
          </Box>
        </Box>

        {/* Search & Filter Bar */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search invoice number, customer name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="primary" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5, bgcolor: 'grey.50' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                  <Button
                    variant={showFilters ? 'contained' : 'text'}
                    startIcon={<FilterList />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters
                  </Button>
                  <Button variant="text" color="error" startIcon={<RestartAlt />} onClick={resetFilters}>
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={filters.status}
                            label="Status"
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            sx={{ borderRadius: 2 }}
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
                          fullWidth size="small" type="date" label="From Date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" type="date" label="To Date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {isMobile ? (
            <List disablePadding>
              {loading ? <Box p={4} textAlign="center">Loading...</Box> : 
               invoices.map((inv) => (
                <ListItemButton key={inv._id} component={Link} href={`/invoices/${inv._id}`} sx={{ borderBottom: '1px solid #eee' }}>
                  <ListItemText 
                    primary={<Typography fontWeight="bold">{inv.invoiceNumber}</Typography>} 
                    secondary={`${inv.customer.name} • ${formatCurrency(inv.total)}`} 
                  />
                  <Chip label={inv.paymentStatus} size="small" color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>Loading...</TableCell></TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}>No invoices found</TableCell></TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">{invoice.customer.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{invoice.customer.phone}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(invoice.total)}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={invoice.paymentStatus} 
                            size="small"
                            variant="soft"
                            color={invoice.paymentStatus === 'Paid' ? 'success' : 'warning'} 
                            sx={{ fontWeight: 'bold', borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton component={Link} href={`/invoices/${invoice._id}`} color="primary">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => setDeleteConfirm(invoice)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #eee' }}>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={(e, p) => setPagination({ ...pagination, page: p })}
              color="primary"
              shape="rounded"
            />
          </Box>
        </Paper>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>Delete Invoice?</DialogTitle>
          <DialogContent>This action is permanent and cannot be reversed.</DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm._id)} variant="contained" color="error" sx={{ borderRadius: 2 }}>
              Delete Invoice
            </Button>
          </DialogActions>
        </Dialog>

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />
      </Box>
    </MainLayout>
  );
}
