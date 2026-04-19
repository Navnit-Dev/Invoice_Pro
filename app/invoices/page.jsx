'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
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

// Helper Component to render the Barcode using JsBarcode
const InvoiceBarcode = ({ value }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        width: 1,
        height: 30,
        displayValue: false,
        margin: 0,
        background: "transparent"
      });
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100px' }} />;
};

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef(null);
  const scannerRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '' });

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
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters.search]);

  useEffect(() => {
    const handler = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(handler);
  }, [fetchInvoices]);

  // QR/Barcode Scanner Logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      });

      scanner.render((text) => {
        setFilters({ search: text.trim() });
        setShowScanner(false);
        toast.success(`Scanned: ${text}`);
        scanner.clear();
        if (searchInputRef.current) searchInputRef.current.focus();
      }, () => {});

      scannerRef.current = scanner;
    }
    return () => { if (scannerRef.current) scannerRef.current.clear().catch(() => {}); };
  }, [showScanner]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted');
        setDeleteConfirm(null);
        fetchInvoices();
      }
    } catch (err) { toast.error('Error'); }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900" sx={{ letterSpacing: '-0.5px' }}>
              Invoice History
            </Typography>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
              {pagination.total} ACTIVE INVOICES
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            component={Link} 
            href="/invoices/create" 
            sx={{ borderRadius: 2, px: 3, fontWeight: 700, boxShadow: theme.shadows[4] }}
          >
            {!isMobile && "Create New"}
          </Button>
        </Stack>

        {/* Search Bar */}
        <Paper sx={{ 
          p: 0.5, mb: 4, borderRadius: 3, display: 'flex', alignItems: 'center', 
          border: '1px solid #ddd', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
        }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search invoice number, client, or scan barcode..."
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

        {loading && invoices.length === 0 ? (
          <Box textAlign="center" py={10}><CircularProgress size={40} /></Box>
        ) : (
          <Box>
            {isMobile ? (
              /* MOBILE VIEW: Minimalist List */
              <Stack spacing={1.5}>
                {invoices.map(inv => (
                  <Box 
                    key={inv._id} 
                    component={Link} 
                    href={`/invoices/${inv._id}`} 
                    sx={{ 
                      p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #eee', 
                      textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="900" color="black">#{inv.invoiceNumber}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{inv.customer?.name}</Typography>
                      <Box sx={{ mt: 1, opacity: 0.7 }}><InvoiceBarcode value={inv.invoiceNumber} /></Box>
                    </Box>
                    <Chip 
                      label={inv.paymentStatus} 
                      size="small" 
                      color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} 
                      sx={{ fontWeight: 800, borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              /* DESKTOP VIEW: Professional Table */
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #eee', boxShadow: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv._id} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{inv.invoiceNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{inv.customer?.name}</TableCell>
                        <TableCell><InvoiceBarcode value={inv.invoiceNumber} /></TableCell>
                        <TableCell>
                          <Chip label={inv.paymentStatus} size="small" color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton component={Link} href={`/invoices/${inv._id}`} color="primary"><Visibility fontSize="small"/></IconButton>
                          <IconButton color="error" onClick={() => setDeleteConfirm(inv)}><Delete fontSize="small"/></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination count={pagination.pages} page={pagination.page} onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} color="primary" />
            </Box>
          </Box>
        )}

        {/* Mobile Scan Button */}
        {isMobile && (
          <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={() => setShowScanner(true)}>
            <QrCodeScanner />
          </Fab>
        )}

        {/* Scanner Dialog */}
        <Dialog open={showScanner} onClose={() => setShowScanner(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
            Scanner
            <IconButton onClick={() => setShowScanner(false)}><Close /></IconButton>
          </DialogTitle>
          <Box sx={{ p: 2 }}>
            <Box id="reader" sx={{ borderRadius: 2, overflow: 'hidden' }} />
          </Box>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle fontWeight={800}>Confirm Delete</DialogTitle>
          <DialogContent>Remove invoice <b>{deleteConfirm?.invoiceNumber}</b>?</DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => handleDelete(deleteConfirm._id)}>Delete</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </MainLayout>
  );
}
