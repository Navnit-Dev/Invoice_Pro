'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

// Barcode Renderer
const InvoiceBarcode = ({ value }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current && value) {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128", width: 1.2, height: 35, displayValue: false, margin: 0
      });
    }
  }, [value]);
  return <canvas ref={canvasRef} style={{ maxWidth: '120px' }} />;
};

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const router = useRouter();
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
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters.search]);

  useEffect(() => {
    const handler = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(handler);
  }, [fetchInvoices]);

  // UPDATED: Logic to use your /api/invoices/scan/route.js
  const handleBarcodeScan = async (barcode) => {
    if (!barcode) return;
    
    // 1. Put value in search box visually
    setFilters({ search: barcode.trim() });
    
    try {
      toast.loading('Searching for invoice...', { id: 'scan-load' });
      
      // 2. Call your specific scan API
      const response = await fetch(`/api/invoices/scan?barcode=${encodeURIComponent(barcode)}`);
      
      if (response.ok) {
        const invoiceData = await response.json();
        toast.success(`Invoice ${barcode} Found!`, { id: 'scan-load' });
        
        // Option A: Update the list to show ONLY this invoice
        setInvoices([invoiceData]);
        
        // Option B: Redirect to view page (Uncomment if preferred)
        // router.push(`/invoices/${invoiceData._id}`);
        
      } else {
        toast.error('Invoice not found in system', { id: 'scan-load' });
      }
    } catch (error) {
      toast.error('Scanner API error', { id: 'scan-load' });
    }
    
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300, mx: 'auto' }}>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="900">Invoices</Typography>
            <Typography variant="caption" fontWeight="bold" color="primary">HISTORY & TRACKING</Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            component={Link} 
            href="/invoices/create" 
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            {!isMobile && "Create New"}
          </Button>
        </Stack>

        {/* Search Pill */}
        <Paper sx={{ p: 0.5, mb: 4, borderRadius: 3, display: 'flex', alignItems: 'center', border: '1px solid #ddd', boxShadow: 'none' }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Scan barcode or type invoice number..."
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
              <Stack spacing={1.5}>
                {invoices.map(inv => (
                  <Box key={inv._id} component={Link} href={`/invoices/${inv._id}`} sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #eee', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="900" color="primary">#{inv.invoiceNumber}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="500">{inv.customer?.name}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label={inv.paymentStatus} size="small" color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} />
                      <ChevronRight sx={{ color: 'text.disabled' }} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #eee', boxShadow: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f9fafb' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
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
                          <Chip label={inv.paymentStatus} size="small" color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton component={Link} href={`/invoices/${inv._id}`} size="small"><Visibility fontSize="small"/></IconButton>
                          <IconButton color="error" size="small"><Delete fontSize="small"/></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination count={pagination.pages} page={pagination.page} onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} color="primary" />
            </Box>
          </Box>
        )}

        {isMobile && (
          <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={() => setShowScanner(true)}>
            <QrCodeScanner />
          </Fab>
        )}

        <BarcodeScanner 
          open={showScanner} 
          onClose={() => setShowScanner(false)} 
          onScan={handleBarcodeScan} 
        />
      </Box>
    </MainLayout>
  );
}
