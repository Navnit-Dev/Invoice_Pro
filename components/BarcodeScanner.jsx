'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogTitle, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Initialize scanner when modal opens
      const scanner = new Html5QrcodeScanner(
        "reader", // ID of the element
        { 
          fps: 15, 
          qrbox: { width: 250, height: 150 }, // Focused area for barcodes
          aspectRatio: 1.0 
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText); // Send to search box
          scanner.clear(); // Stop camera
          onClose(); // Close modal
        },
        (error) => {
          // Silent catch for "no code found in frame" errors
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      // Cleanup: stop camera when modal closes or component unmounts
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Cleanup error", err));
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Scan Barcode
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box id="reader" sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }} />
      </DialogContent>
    </Dialog>
  );
}
