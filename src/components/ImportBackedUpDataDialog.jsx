import React, { useState } from 'react';
import DataManagement from '@/components/DataManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload } from 'lucide-react';

export default function ImportBackedUpDataDialog({ open, onOpenChange }) {
  const [fileKey, setFileKey] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Sync Data
          </DialogTitle>
        </DialogHeader>

        <div key={fileKey}>
          <DataManagement />
        </div>

        <button
          type="button"
          className="hidden"
          onClick={() => setFileKey((k) => k + 1)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </DialogContent>
    </Dialog>
  );
}