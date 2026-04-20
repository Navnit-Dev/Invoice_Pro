'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment,
  Pagination, Paper, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import {
  Add, Visibility, Delete, Search, QrCodeScanner, Clear
} from '@mui/icons-material';
import MainLayout from '@/components/Layout/MainLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import toast from 'react-hot-toast';

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

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Invoice deleted');
        fetchInvoices();
      } else {
        toast.error('Failed to delete invoice');
      }
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
    setDeleteConfirm(null);
  };

  const handleBarcodeScan = async (barcode) => {
    if (!barcode) return;

    setFilters({ search: barcode.trim() });

    try {
      toast.loading('Searching for invoice...', { id: 'scan-load' });

      const response = await fetch(`/api/invoices/scan?barcode=${encodeURIComponent(barcode)}`);

      if (response.ok) {
        const invoiceData = await response.json();
        toast.success(`Invoice ${barcode} Found!`, { id: 'scan-load' });
        setInvoices([invoiceData]);
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
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Invoices</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            component={Link}
            href="/invoices/create"
          >
            Create Invoice
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            inputRef={searchInputRef}
            placeholder="Search invoices..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilters({ search: '' })}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => setShowScanner(true)}
          >
            Scan
          </Button>
        </Box>

        {loading && invoices.length === 0 ? (
          <Box textAlign="center" py={10}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No invoices found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv._id} hover>
                        <TableCell>{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.customer?.name}</TableCell>
                        <TableCell>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>₹{inv.total?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={inv.paymentStatus}
                            size="small"
                            color={inv.paymentStatus === 'Paid' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={Link}
                            href={`/invoices/${inv._id}`}
                            size="small"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm(inv)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pagination.pages > 1 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={(e, p) => setPagination(prev => ({ ...prev, page: p }))}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
        />

        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete invoice {deleteConfirm?.invoiceNumber}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button color="error" onClick={() => handleDelete(deleteConfirm._id)}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
