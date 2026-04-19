'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, InputAdornment, Pagination, Paper, 
  Stack, Divider, useTheme, useMediaQuery, Fab, CircularProgress
} from '@mui/material';
import { 
  Add, Visibility, Delete, Search, QrCodeScanner, 
  ChevronRight, Clear, Close, ReceiptLong 
} from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import toast from 'react-hot-toast';

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef(null);
  const scannerRef = useRef(null);

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '' });

  // 1. Fetch Invoices Logic
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
      }).toString();

      const response = await fetch(`/api/invoices?${query}`);
      const data = await response.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to sync invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters.search]);

  useEffect(() => {
    const handler = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(handler);
  }, [fetchInvoices]);

  // 2. Integrated Scanner Logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      });

      scanner.render((text) => {
        // Update search filter directly
        setFilters({ search: text.trim() });
        setShowScanner(false);
        toast.success(`Detected: ${text}`);
        scanner.clear();
        // Force focus on input to ensure UI registers the change
        if (searchInputRef.current) searchInputRef.current.focus();
      }, () => {});

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [showScanner]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Invoice deleted');
        setDeleteConfirm(null);
        fetchInvoices();
      }
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header Section */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900" color="primary.main">
              Invoices
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {pagination.total} TOTAL RECORDS
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            component={Link} 
            href="/invoices/create" 
            sx={{ borderRadius: 2.5, textTransform: 'none', px: 3, fontWeight: 700 }}
          >
            {!isMobile && "Create Invoice"}
          </Button>
        </Stack>

        {/* Professional Search Pill */}
        <Paper sx={{ 
          p: 0.5, mb: 4, borderRadius: 4, display: 'flex', alignItems: 'center', 
          border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
        }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search by invoice # or customer..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: <Search sx={{ color: 'text.disabled', ml: 2, mr: 1 }} />,
              endAdornment: filters.search && (
                <IconButton size="small" onClick={() => setFilters({ search: '' })}>
                  <Clear fontSize="small" />
                </IconButton>
              ),
              sx: { py: 1, fontWeight: 500 }
            }}
          />
          <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 1 }} />
          <IconButton color="primary" onClick={() => setShowScanner(true)} sx={{ mr: 1 }}>
            <QrCodeScanner />
          </IconButton>
        </Paper>

        {/* Invoice List Area */}
        {loading && invoices.length === 0 ? (
          <Box textAlign="center" py={10}><CircularProgress size={30} /></Box>
        ) : (
          <Box>
            {isMobile ? (
              /* MOBILE-FIRST VIEW: Compact & Clean */
              <Stack spacing={1.5}>
                {invoices.map(inv => (
                  <Box 
                    key={inv._id} 
                    component={Link} 
                    href={`/invoices/${inv._id}`} 
                    sx={{ 
                      p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #efefef', 
                      textDecoration: 'none', display: 'flex', justifyContent: 'space-between', 
                      alignItems: 'center', transition: '0.2s', '&:active': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="800" color="primary.main">
                        #{inv.invoiceNumber}
                      </Typography>
                      <Typography variant="body2" fontWeight="500" color="text.secondary">
                        {inv.customer?.name}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={inv.paymentStatus} 
                        size="small" 
                        color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} 
                        sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5 }}
                      />
                      <ChevronRight fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              /* DESKTOP VIEW */
              <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #eee', boxShadow: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#fafafa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Invoice Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv._id} hover>
                        <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>{inv.invoiceNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.customer?.name}</TableCell>
                        <TableCell>
                          <Chip label={inv.paymentStatus} size="small" color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton component={Link} href={`/invoices/${inv._id}`} size="small" sx={{ mr: 1 }}><Visibility fontSize="small"/></IconButton>
                          <IconButton color="error" onClick={() => setDeleteConfirm(inv)} size="small"><Delete fontSize="small"/></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {invoices.length === 0 && !loading && (
              <Box textAlign="center" py={8}>
                <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" fontWeight={500}>No invoices found</Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.page} 
                onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} 
                color="primary"
                shape="rounded"
              />
            </Box>
          </Box>
        )}

        {/* Mobile Scanning FAB */}
        {isMobile && (
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: 3 }} 
            onClick={() => setShowScanner(true)}
          >
            <QrCodeScanner />
          </Fab>
        )}

        {/* Integrated Scanner Modal */}
        <Dialog open={showScanner} onClose={() => setShowScanner(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
            Scan Barcode
            <IconButton onClick={() => setShowScanner(false)}><Close /></IconButton>
          </DialogTitle>
          <Box sx={{ p: 2 }}>
            <Box id="reader" sx={{ borderRadius: 3, overflow: 'hidden', border: '2px solid #eee' }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center', fontWeight: 500 }}>
              Center the barcode within the frame to scan
            </Typography>
          </Box>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Delete Invoice?</DialogTitle>
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete <strong>#{deleteConfirm?.invoiceNumber}</strong>? This action cannot be undone.
            </Typography>
          </Box>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setDeleteConfirm(null)} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleDelete(deleteConfirm._id)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Confirm Delete
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </MainLayout>
  );
}
