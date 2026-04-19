'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment, 
  Pagination, Paper, Stack, Divider, useTheme, useMediaQuery, Fab
} from '@mui/material';
import { 
  Add, Visibility, Delete, Search, QrCodeScanner, 
  ChevronRight, Clear, ReceiptLong 
} from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import toast from 'react-hot-toast';

// Barcode Renderer Sub-component
const InvoiceBarcode = ({ value }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && value) {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        width: 1.2,
        height: 35,
        displayValue: false,
        margin: 0
      });
    }
  }, [value]);
  return <canvas ref={canvasRef} style={{ maxWidth: '120px', height: 'auto' }} />;
};

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef(null);

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

  const handleBarcodeScan = (code) => {
    if (code) {
      setFilters({ search: code.trim() });
      toast.success(`Scanned: ${code}`);
      // Force input focus so the state registers properly
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? 'success' : 'warning';
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300, mx: 'auto' }}>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">Invoices</Typography>
            <Typography variant="caption" fontWeight="bold" color="primary">
              {pagination.total} TOTAL TRANSACTIONS
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            component={Link} 
            href="/invoices/create" 
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {!isMobile && "New Invoice"}
          </Button>
        </Stack>

        {/* Search Bar - Professional & Sticky-ready */}
        <Paper sx={{ 
          p: 0.5, mb: 4, borderRadius: 3, display: 'flex', alignItems: 'center', 
          border: '1px solid #ddd', boxShadow: 'none' 
        }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search invoice number or customer..."
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

        {/* Dynamic Content */}
        {isMobile ? (
          /* MOBILE VIEW: Streamlined Rows */
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
                  <Typography variant="subtitle2" fontWeight="900" color="primary">#{inv.invoiceNumber}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">{inv.customer?.name}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip 
                    label={inv.paymentStatus} 
                    size="small" 
                    color={getStatusColor(inv.paymentStatus)} 
                    sx={{ fontWeight: 'bold', fontSize: '0.65rem', borderRadius: 1 }} 
                  />
                  <ChevronRight sx={{ color: 'text.disabled' }} />
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          /* DESKTOP VIEW: Professional Table */
          <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #eee', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Visual Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv._id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{inv.invoiceNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{inv.customer?.name}</TableCell>
                    <TableCell><InvoiceBarcode value={inv.invoiceNumber} /></TableCell>
                    <TableCell>
                      <Chip 
                        label={inv.paymentStatus} 
                        size="small" 
                        color={getStatusColor(inv.paymentStatus)} 
                        sx={{ fontWeight: 700 }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton component={Link} href={`/invoices/${inv._id}`} size="small"><Visibility fontSize="small"/></IconButton>
                      <IconButton color="error" onClick={() => setDeleteConfirm(inv)} size="small"><Delete fontSize="small"/></IconButton>
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
            <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No invoices found matching your criteria</Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={pagination.pages} 
            page={pagination.page} 
            onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} 
            color="primary"
          />
        </Box>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 30, right: 30 }} 
            onClick={() => setShowScanner(true)}
          >
            <QrCodeScanner />
          </Fab>
        )}

        {/* Modals */}
        <BarcodeScanner 
          open={showScanner} 
          onClose={() => setShowScanner(false)} 
          onScan={handleBarcodeScan} 
        />

        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle fontWeight={800}>Delete Invoice?</DialogTitle>
          <Box sx={{ px: 3, pb: 2 }}>
            <Typography variant="body2">Remove <b>{deleteConfirm?.invoiceNumber}</b> permanently?</Typography>
          </Box>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
