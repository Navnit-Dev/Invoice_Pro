'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowBack,
  ArrowForward,
  Preview,
  Save,
  Print,
  QrCode,
  Business,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MainLayout from '@/components/Layout/MainLayout';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

const steps = ['Customer Details', 'Add Products', 'Review & Generate'];

const gstRates = [0, 5, 12, 18, 28];

export default function CreateInvoicePage() {
  const router = useRouter();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [gstRate, setGstRate] = useState(18);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchStore();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchStore = async () => {
    try {
      const response = await fetch('/api/store');
      if (!response.ok) throw new Error('Failed to fetch store');
      const data = await response.json();
      setStore(data);
    } catch (error) {
      toast.error('Failed to load store information');
    }
  };

  const handleAddItem = (product) => {
    const existingItem = invoiceItems.find((item) => item.productId === product._id);
    if (existingItem) {
      toast.error('Product already added to invoice');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    setInvoiceItems([
      ...invoiceItems,
      {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        maxStock: product.stock,
      },
    ]);
  };

  const handleUpdateQuantity = (index, quantity) => {
    const updatedItems = [...invoiceItems];
    const item = updatedItems[index];

    if (quantity > item.maxStock) {
      toast.error(`Only ${item.maxStock} items available in stock`);
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    item.quantity = quantity;
    setInvoiceItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateGST = () => {
    return (calculateSubtotal() * gstRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST() + Number(shippingCharges);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!customer.name || !customer.phone || !customer.address) {
        toast.error('Please fill in all customer details');
        return;
      }
    }

    if (activeStep === 1) {
      if (invoiceItems.length === 0) {
        toast.error('Please add at least one product');
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGenerateInvoice = async () => {
    setLoading(true);

    try {
      const invoiceData = {
        customer,
        items: invoiceItems,
        gstRate,
        shippingCharges: Number(shippingCharges),
        paymentStatus,
        notes,
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const invoice = await response.json();
      toast.success('Invoice created successfully!');
      router.push(`/invoices/${invoice._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Customer Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name *"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number *"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address *"
                      multiline
                      rows={2}
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Add Products
                </Typography>

                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} (${option.sku}) - Stock: ${option.stock}`}
                  onChange={(e, value) => value && handleAddItem(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and select product"
                      placeholder="Type to search products..."
                    />
                  )}
                  sx={{ mb: 3 }}
                />

                {invoiceItems.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1, max: item.maxStock, style: { textAlign: 'center' } }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>GST Rate</InputLabel>
                    <Select
                      value={gstRate}
                      label="GST Rate"
                      onChange={(e) => setGstRate(e.target.value)}
                    >
                      {gstRates.map((rate) => (
                        <MenuItem key={rate} value={rate}>
                          {rate}%
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Shipping Charges"
                    type="number"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={paymentStatus}
                      label="Payment Status"
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Paid">Paid</MenuItem>
                      <MenuItem value="Partial">Partial</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                {/* Invoice Preview */}
                <Box sx={{ border: `2px solid ${theme.palette.divider}`, borderRadius: 2, p: 4 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="primary">
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
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" fontWeight="bold">
                        INVOICE
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        #{store?.invoicePrefix || 'INV'}-{String(store?.invoiceNumber || 1).padStart(4, '0')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {new Date().toLocaleDateString()}
                      </Typography>
                      <Chip
                        label={paymentStatus}
                        color={paymentStatus === 'Paid' ? 'success' : 'warning'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Bill To */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Bill To:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {customer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {customer.phone}
                    </Typography>
                  </Box>

                  {/* Items Table */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: theme.palette.action.hover }}>
                          <TableCell>#</TableCell>
                          <TableCell>Item</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoiceItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.sku}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Totals */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Box sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2">{formatCurrency(calculateSubtotal())}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">GST ({gstRate}%):</Typography>
                        <Typography variant="body2">{formatCurrency(calculateGST())}</Typography>
                      </Box>
                      {shippingCharges > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Shipping:</Typography>
                          <Typography variant="body2">{formatCurrency(Number(shippingCharges))}</Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight="bold">Total:</Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {formatCurrency(calculateTotal())}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {notes && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Notes:</strong> {notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Barcode */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Barcode
                      value={`${store?.invoicePrefix || 'INV'}-${String(store?.invoiceNumber || 1).padStart(4, '0')}`}
                      width={1.5}
                      height={50}
                      fontSize={12}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create Invoice
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleGenerateInvoice}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Invoice'}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
