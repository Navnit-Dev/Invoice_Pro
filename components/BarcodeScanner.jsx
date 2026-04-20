'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useZxing } from 'react-qr-barcode-scanner';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  const { ref } = useZxing({
    onDecodeResult(result) {
      const barcode = result.getText();
      if (barcode) {
        onScan(barcode.trim());
        onClose();
      }
    },
    onError(error) {
      // Ignore decode errors during scanning (no barcode in frame)
      if (error.name !== 'NotFoundException') {
        console.error('Barcode scan error:', error);
      }
    },
    paused: !open || !scanning,
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  });

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      onClose();
    } else {
      toast.error('Please enter an invoice number');
    }
  };

  const handleClose = () => {
    setScanning(false);
    setManualInput('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Scan Barcode
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 300,
                background: '#000',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={ref}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Scanner overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 240,
                  height: 120,
                  border: '3px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'primary.main',
                    animation: 'scan 2s linear infinite',
                  },
                  '@keyframes scan': {
                    '0%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(116px)' },
                    '100%': { transform: 'translateY(0)' },
                  },
                }}
              />
              {/* Corner markers */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 240,
                  height: 120,
                  pointerEvents: 'none',
                  '&::after': {
                    content: '"Position barcode here"',
                    position: 'absolute',
                    bottom: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#fff',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Point camera at barcode to scan automatically
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Or enter invoice number manually:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              type="text"
              placeholder="e.g., INV-0001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />
            <Button variant="contained" onClick={handleManualSubmit}>
              Search
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
