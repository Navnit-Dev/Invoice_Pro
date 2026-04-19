'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Print,
  Download,
  PictureAsPdf,
  Email,
  Edit,
  Delete,
  Share,
  QrCode,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const invoiceRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editedStatus, setEditedStatus] = useState('');

  useEffect(() => {
    fetchInvoice();
    fetchStore();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Invoice not found');
      const data = await response.json();
      setInvoice(data);
      setEditedStatus(data.paymentStatus);
    } catch (error) {
      toast.error('Failed to load invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchStore = async () => {
    try {
      const response = await fetch('/api/store');
      if (response.ok) {
        const data = await response.json();
        setStore(data);
      }
    } catch (error) {
      console.error('Failed to fetch store:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete invoice');

      toast.success('Invoice deleted successfully');
      router.push('/invoices');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: editedStatus }),
      });

      if (!response.ok) throw new Error('Failed to update invoice');

      toast.success('Invoice updated successfully');
      setEditDialog(false);
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const generatePDF = async () => {
    if (!invoice || !store) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Logo
    if (store.logo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = store.logo;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const aspectRatio = img.width / img.height;
        const logoWidth = 20;
        const logoHeight = logoWidth / aspectRatio;
        doc.addImage(dataUrl, 'PNG', 14, 10, logoWidth, logoHeight);
      } catch (e) {
        console.error('Failed to load logo:', e);
      }
    }

    // Header
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235);
    doc.text(store.companyName, store.logo ? 45 : 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(store.address, store.logo ? 45 : 14, 35);
    doc.text(`Phone: ${store.mobileNumber}`, store.logo ? 45 : 14, 41);
    if (store.gstNumber) {
      doc.text(`GST: ${store.gstNumber}`, store.logo ? 45 : 14, 47);
    }
    if (store.email) {
      doc.text(`Email: ${store.email}`, store.logo ? 45 : 14, store.gstNumber ? 53 : 47);
    }

    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.text('INVOICE', pageWidth - 60, 25);

    doc.setFontSize(10);
    doc.text(`# ${invoice.invoiceNumber}`, pageWidth - 60, 35);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, pageWidth - 60, 41);
    doc.text(`Status: ${invoice.paymentStatus}`, pageWidth - 60, 47);

    // Bill To
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 14, 75);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(invoice.customer.name, 14, 82);
    doc.text(invoice.customer.address, 14, 88);
    doc.text(`Phone: ${invoice.customer.phone}`, 14, 94);

    // Items Table - Use Rs. instead of ₹ for PDF compatibility
    const tableData = invoice.items.map((item, index) => [
      index + 1,
      item.name,
      item.sku,
      item.quantity,
      `Rs. ${item.price.toFixed(2)}`,
      `Rs. ${item.total.toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: 105,
      head: [['#', 'Item', 'SKU', 'Qty', 'Price', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals - Use Rs. instead of ₹
    const totalsX = pageWidth - 80;
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });

    doc.text(`GST (${invoice.gstRate}%):`, totalsX, finalY + 7);
    doc.text(`Rs. ${invoice.gstAmount.toFixed(2)}`, pageWidth - 20, finalY + 7, { align: 'right' });

    if (invoice.shippingCharges > 0) {
      doc.text('Shipping:', totalsX, finalY + 14);
      doc.text(`Rs. ${invoice.shippingCharges.toFixed(2)}`, pageWidth - 20, finalY + 14, { align: 'right' });
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', totalsX, finalY + 25);
    doc.text(`Rs. ${invoice.total.toFixed(2)}`, pageWidth - 20, finalY + 25, { align: 'right' });
    doc.setFont(undefined, 'normal');

    // Notes
    if (invoice.notes) {
      doc.setFontSize(10);
      doc.text(`Notes: ${invoice.notes}`, 14, finalY + 40);
    }

    // Barcode at bottom - convert SVG to image
    let barcodeAdded = false;
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const barcodeSvg = document.querySelector('#invoice-barcode svg');
      if (barcodeSvg) {
        const svgData = new XMLSerializer().serializeToString(barcodeSvg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width || 200;
            canvas.height = img.height || 60;
            ctx.drawImage(img, 0, 0);
            const barcodeData = canvas.toDataURL('image/png');
            doc.addImage(barcodeData, 'PNG', pageWidth / 2 - 50, pageHeight - 50, 100, 30);
            barcodeAdded = true;
            resolve();
          };
          img.onerror = reject;
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        });
      }
    } catch (e) {
      console.error('Failed to add barcode:', e);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Typography>Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!invoice) return null;

  return (
    <MainLayout>
      <Box>
        {/* Header Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Button
            component={Link}
            href="/invoices"
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Back to Invoices
          </Button>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditDialog(true)}
            >
              Edit Status
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={generatePDF}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Invoice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card ref={invoiceRef}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                    {store?.companyName || 'Your Company'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {store?.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {store?.mobileNumber}
                  </Typography>
                  {store?.gstNumber && (
                    <Typography variant="body2" color="text.secondary">
                      GST: {store.gstNumber}
                    </Typography>
                  )}
                  {store?.email && (
                    <Typography variant="body2" color="text.secondary">
                      Email: {store.email}
                    </Typography>
                  )}
                </Box>
                <Box textAlign="right">
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    INVOICE
                  </Typography>
                  <Typography variant="h6" fontFamily="monospace">
                    {invoice.invoiceNumber}
                  </Typography>
                  <Chip
                    label={invoice.paymentStatus}
                    color={invoice.paymentStatus === 'Paid' ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Invoice Details */}
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      BILL TO
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {invoice.customer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.customer.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {invoice.customer.phone}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: { sm: 'right' } }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      INVOICE DETAILS
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {formatDate(invoice.createdAt)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Due Date:</strong> {formatDate(new Date(new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000))}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Items Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: theme.palette.action.hover }}>
                      <TableCell>#</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {item.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: { xs: '100%', sm: 300 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1">{formatCurrency(invoice.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">GST ({invoice.gstRate}%):</Typography>
                    <Typography variant="body1">{formatCurrency(invoice.gstAmount)}</Typography>
                  </Box>
                  {invoice.shippingCharges > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Shipping Charges:</Typography>
                      <Typography variant="body1">{formatCurrency(invoice.shippingCharges)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">Total:</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(invoice.total)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {invoice.notes && (
                <Box sx={{ mt: 4, p: 2, background: theme.palette.action.hover, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Notes:
                  </Typography>
                  <Typography variant="body2">{invoice.notes}</Typography>
                </Box>
              )}

              {/* Barcode */}
              <Box id="invoice-barcode" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Barcode
                  value={invoice.invoiceNumber}
                  width={2}
                  height={60}
                  fontSize={14}
                />
              </Box>

              {/* Thank You */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Thank you for your business!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation */}
        <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button onClick={handleDelete} variant="contained" color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Status Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs">
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={editedStatus}
                label="Payment Status"
                onChange={(e) => setEditedStatus(e.target.value)}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} variant="contained">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
