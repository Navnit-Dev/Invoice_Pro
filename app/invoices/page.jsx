'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
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
  InputAdornment,
  Pagination,
  Tooltip,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Add,
  Visibility,
  Delete,
  Search,
  QrCodeScanner,
  FilterList,
  ChevronRight,
  ReceiptOutlined,
  Clear,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import toast from 'react-hot-toast';

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', status: '' });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
      }).toString();

      const response = await fetch(`/api/invoices?${query}`);
      const data = await response.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    const handler = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(handler);
  }, [fetchInvoices]);

  // FIXED: Forceful scanner integration
  const handleBarcodeScan = (data) => {
    const code = typeof data === 'object' ? data.code || data.text : data;
    if (code) {
      // 1. Update State
      setFilters(prev => ({ ...prev, search: code.trim() }));
      // 2. Focus input to simulate human entry
      if (searchInputRef.current) searchInputRef.current.focus();
      
      setShowScanner(false);
      toast.success(`Found: ${code}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'pending': return { bg: '#FFF3E0', text: '#E65100' };
      default: return { bg: '#F5F5F5', text: '#616161' };
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header Section */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="800" color="text.primary">
              Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pagination.total} total transactions
            </Typography>
          </Box>
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<Add />}
              component={Link}
              href="/invoices/create"
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Create New
            </Button>
          )}
        </Stack>

        {/* Search Bar - Professional & Clean */}
        <Paper sx={{ p: 1, mb: 3, borderRadius: 3, boxShadow: '0 2px 15px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search invoice or customer..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: <Search sx={{ color: 'text.disabled', mr: 1 }} />,
              endAdornment: filters.search && (
                <IconButton size="small" onClick={() => setFilters(f => ({ ...f, search: '' }))}>
                  <Clear fontSize="small" />
                </IconButton>
              ),
              sx: { px: 2, py: 1 }
            }}
          />
          <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
          <IconButton color="primary" onClick={() => setShowScanner(true)}>
            <QrCodeScanner />
          </IconButton>
        </Paper>

        {/* Invoices Content */}
        <Box>
          {loading && invoices.length === 0 ? (
            <Box textAlign="center" py={10}><CircularProgress size={24} /></Box>
          ) : (
            <Box>
              {isMobile ? (
                /* MOBILE VIEW: Ultra-Clean List */
                <Stack spacing={1.5}>
                  {invoices.map((inv) => (
                    <Box 
                      key={inv._id}
                      component={Link}
                      href={`/invoices/${inv._id}`}
                      sx={{ 
                        textDecoration: 'none',
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid #f0f0f0'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                          #{inv.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inv.customer.name}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip 
                          label={inv.paymentStatus} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 'bold',
                            bgcolor: getStatusColor(inv.paymentStatus).bg,
                            color: getStatusColor(inv.paymentStatus).text
                          }} 
                        />
                        <ChevronRight sx={{ color: 'text.disabled' }} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                /* DESKTOP VIEW: Professional Table */
                <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #eee' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.customer.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={inv.paymentStatus} 
                              size="small"
                              sx={{ bgcolor: getStatusColor(inv.paymentStatus).bg, color: getStatusColor(inv.paymentStatus).text, fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton component={Link} href={`/invoices/${inv._id}`} size="small"><Visibility fontSize="small"/></IconButton>
                            <IconButton onClick={() => setDeleteConfirm(inv)} size="small" color="error"><Delete fontSize="small"/></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Empty State */}
              {!loading && invoices.length === 0 && (
                <Box textAlign="center" py={10}>
                  <ReceiptOutlined sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">No invoices found</Typography>
                </Box>
              )}

              {/* Pagination */}
              <Box mt={4} display="flex" justifyContent="center">
                <Pagination 
                  count={pagination.pages} 
                  page={pagination.page} 
                  onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))}
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Mobile FAB for Scan */}
        {isMobile && (
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 20, right: 20 }}
            onClick={() => setShowScanner(true)}
          >
            <QrCodeScanner />
          </Fab>
        )}

        {/* Modals */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>Delete Invoice?</DialogTitle>
          <DialogContent>Are you sure you want to remove #{deleteConfirm?.invoiceNumber}?</DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={() => {}} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
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
