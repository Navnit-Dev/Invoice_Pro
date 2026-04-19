'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  Box, 
  IconButton, 
  Typography 
} from '@mui/material';
import { Close } from '@mui/icons-material';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Only initialize if the dialog is open
    if (open) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 }, // Optimized for 1D barcodes
        aspectRatio: 1.0,
        // Prioritize the back camera on mobile devices
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      };

      const scanner = new Html5QrcodeScanner("reader", config, false);

      scanner.render(
        (decodedText) => {
          // Success: Pass data back, stop scanner, and close
          onScan(decodedText);
          if (scanner) {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
          }
          onClose();
        },
        (error) => {
          // Silent catch for 'No barcode detected' frame errors
        }
      );

      scannerRef.current = scanner;
    }

    // Cleanup function when modal closes or component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Cleanup error", err));
        scannerRef.current = null;
      }
    };
  }, [open, onClose, onScan]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs" 
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
        Scan Barcode
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box 
          id="reader" 
          sx={{ 
            width: '100%', 
            overflow: 'hidden', 
            borderRadius: 2,
            '& video': { borderRadius: '8px' },
            '& #reader__dashboard_section_csr button': {
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              marginTop: '10px',
              cursor: 'pointer'
            }
          }} 
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Point camera at the invoice barcode
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
