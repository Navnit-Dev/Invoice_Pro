'use client';
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Dialog, DialogContent, DialogTitle, Box, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 
      }, false);

      scanner.render((text) => {
        onScan(text);
        scanner.clear().catch(e => console.error(e));
        onClose();
      }, () => {});

      scannerRef.current = scanner;
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
        Scan Barcode <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box id="reader" sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Align barcode within the center frame
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
