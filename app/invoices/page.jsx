'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
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
  Avatar,
  Divider,
  Fade,
  Stack,
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
  Receipt,
  BusinessCenter,
  EventNote,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import toast from 'react-hot-toast';

export default function InvoiceHistoryPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  // Fetch Logic
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Connection error: Could not load invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  // FIXED: Scanner integration
  const handleBarcodeScan = (barcodeValue) => {
    // Some scanners return an object, others a string. Handle both.
    const code = typeof barcodeValue === 'object' ? barcodeValue.code : barcodeValue;
    
    if (code) {
      setFilters(prev => ({ ...prev, search: code.trim() }));
      setShowScanner(false);
      toast.success(`Barcode Detected: ${code}`, {
        icon: '🔍',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Invoice deleted');
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const formatCurrency = (val) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <MainLayout>
      <Box sx={{ maxWidth: 1400, margin: '0 auto', px: { xs: 2, md: 4 }, py: 4 }}>
        
        {/* TOP BAR: Title & Primary Actions */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={5}>
          <Box>
            <Typography variant="h3" fontWeight="800" letterSpacing="-0.02em" gutterBottom>
              Invoices
            </Typography>
            <BreadcrumbsSeparator />
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => setShowScanner(true)}
              startIcon={<QrCodeScanner />}
              sx={{ 
                borderRadius: '12px', 
                px: 3, 
                borderColor: 'divider', 
                color: 'text.primary',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: 'primary.main', bgcolor: 'transparent' }
              }}
            >
              Scan Barcode
            </Button>
            <Button
              variant="contained"
              component={Link}
              href="/invoices/create"
              startIcon={<Add />}
              sx={{ 
                borderRadius: '12px', 
                px: 3, 
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)',
              }}
            >
              New Invoice
            </Button>
          </Stack>
        </Stack>

        {/* SEARCH & FILTERS SECTION */}
        <Card sx={{ 
          borderRadius: '16px', 
          border: '1px solid', 
          borderColor: 'divider',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          mb: 4,
          overflow: 'visible'
        }}>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  placeholder="Search by invoice #, customer name, or phone..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled' }} /></InputAdornment>,
                    sx: { borderRadius: '10px', bgcolor: '#fcfcfc' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { md: 'flex-end' }, gap: 1 }}>
                <Button 
                  startIcon={<FilterList />} 
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                  Filters
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                <Button 
                  onClick={() => setFilters({ search: '', status: '', startDate: '', endDate: '' })}
                  sx={{ color: 'text.disabled' }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Box sx={{ pt: 3, mt: 2, borderTop: '1px solid', borderColor: 'grey.100' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Payment Status</InputLabel>
                          <Select
                            value={filters.status}
                            label="Payment Status"
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                            sx={{ borderRadius: '8px' }}
                          >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" type="date" label="Date From"
                          InputLabelProps={{ shrink: true }}
                          value={filters.startDate}
                          onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth size="small" type="date" label="Date To"
                          InputLabelProps={{ shrink: true }}
                          value={filters.endDate}
                          onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Card>

        {/* TABLE SECTION */}
        <TableContainer component={Card} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Invoice Details</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 4 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} sx={{ py: 3, textAlign: 'center', color: 'text.disabled' }}>Loading data...</TableCell></TableRow>
                ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                    <Receipt sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No invoices matched your search</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((row) => (
                  <TableRow key={row._id} hover sx={{ '&:hover': { bgcolor: '#fcfcfc' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', borderRadius: '8px', width: 40, height: 40 }}>
                          <Receipt fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="700">{row.invoiceNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">Issued {new Date(row.createdAt).toLocaleDateString()}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{row.customer.name}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">{row.customer.phone}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="700">{formatCurrency(row.total)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.paymentStatus} 
                        size="small" 
                        sx={{ 
                          fontWeight: 700, 
                          borderRadius: '6px',
                          bgcolor: row.paymentStatus === 'Paid' ? '#e8f5e9' : '#fff3e0',
                          color: row.paymentStatus === 'Paid' ? '#2e7d32' : '#ed6c02'
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 3 }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="View Invoice">
                          <IconButton component={Link} href={`/invoices/${row._id}`} size="small" sx={{ color: 'primary.main', bgcolor: '#f0f7ff' }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => setDeleteConfirm(row)} size="small" sx={{ color: 'error.main', bgcolor: '#fff5f5' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* PAGINATION */}
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Showing {invoices.length} of {pagination.total} results
            </Typography>
            <Pagination 
              count={pagination.pages} 
              page={pagination.page} 
              onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))}
              color="primary"
              size="small"
              sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }}
            />
          </Box>
        </TableContainer>

        {/* DELETE DIALOG */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
          <DialogTitle fontWeight="700">Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              Are you sure you want to delete invoice <b>{deleteConfirm?.invoiceNumber}</b>? This action is permanent.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ pb: 2, px: 3 }}>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={() => handleDelete(deleteConfirm._id)} variant="contained" color="error" sx={{ borderRadius: '8px' }}>
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        {/* SCANNER COMPONENT */}
        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />
      </Box>
    </MainLayout>
  );
}

// Sub-component for clean Breadcrumbs look
function BreadcrumbsSeparator() {
  return (
    <Stack direction="row" spacing={1} alignItems="center" color="text.disabled">
      <BusinessCenter sx={{ fontSize: 14 }} />
      <Typography variant="caption" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        Dashboard
      </Typography>
      <Typography variant="caption">/</Typography>
      <Typography variant="caption" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
        History
      </Typography>
    </Stack>
  );
}
