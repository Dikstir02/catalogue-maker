import React, { useState } from 'react';
import DataManagement from '@/components/DataManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ImportBackedUpDataDialog({ open, onOpenChange }) {
  // DataManagement already contains export/import + cloud sync.
  // For a “minimal import” UX we still reuse DataManagement, but we hide the cloud sync section
  // in the parent by only rendering the import trigger button + letting DataManagement show itself.
  // (If you later want true minimal UI, we can split DataManagement into smaller components.)

  const [fileKey, setFileKey] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/30 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Import backup JSON
          </DialogTitle>
        </DialogHeader>

        <Card className="border-border/30">
          <CardContent className="pt-4">
            {/*
              Re-mount to reset file input state each time the dialog opens.
              DataManagement uses a native file input, so forcing a remount helps usability.
            */}
            <div key={fileKey}>
              <DataManagement />
            </div>
          </CardContent>
        </Card>

        {/* Hidden util: reset on open */}
        <Button
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

