'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment,
  Pagination, Paper, Stack, Divider, CircularProgress, Fab, useTheme, useMediaQuery
} from '@mui/material';
import { Add, Visibility, Delete, Search, QrCodeScanner, ChevronRight, Clear } from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner'; // Pointing to the new file
import toast from 'react-hot-toast';

export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchInputRef = useRef(null);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setFilters(prev => ({ ...prev, search: code.trim() }));
      toast.success(`Scanned: ${code}`);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" mb={4}>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="800">Invoices</Typography>
          <Button variant="contained" startIcon={<Add />} component={Link} href="/invoices/create" sx={{ borderRadius: 2 }}>
            {!isMobile && "Create New"}
          </Button>
        </Stack>

        {/* Professional Search Pill */}
        <Paper sx={{ p: 1, mb: 4, borderRadius: 4, display: 'flex', alignItems: 'center', bgcolor: '#fdfdfd', border: '1px solid #eee' }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search barcode or client..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: <Search sx={{ color: 'text.disabled', mr: 1 }} />,
              sx: { px: 2 }
            }}
          />
          <IconButton color="primary" onClick={() => setShowScanner(true)}>
            <QrCodeScanner />
          </IconButton>
        </Paper>

        {/* Mobile-First List / Desktop Table */}
        {isMobile ? (
          <Stack spacing={2}>
            {invoices.map(inv => (
              <Box key={inv._id} component={Link} href={`/invoices/${inv._id}`} sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #f0f0f0', textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="700" color="black">#{inv.invoiceNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">{inv.customer.name}</Typography>
                </Box>
                <Chip label={inv.paymentStatus} size="small" sx={{ fontWeight: 700 }} />
              </Box>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #eee' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv._id}>
                    <TableCell fontWeight="700">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customer.name}</TableCell>
                    <TableCell><Chip label={inv.paymentStatus} size="small" /></TableCell>
                    <TableCell align="right">
                       <IconButton component={Link} href={`/invoices/${inv._id}`} size="small"><Visibility fontSize="small"/></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Pagination sx={{ mt: 4, display: 'flex', justifyContent: 'center' }} count={pagination.pages} page={pagination.page} onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))} />

        <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScan} />
      </Box>
    </MainLayout>
  );
}
