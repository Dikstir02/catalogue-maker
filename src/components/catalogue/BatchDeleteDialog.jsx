import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export default function BatchDeleteDialog({ open, onOpenChange, count, onConfirm, progress }) {
  const [text, setText] = useState("");

  const handleClose = () => {
    if (progress) return;
    setText("");
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (text === "DELETE") {
      onConfirm();
    }
  };

  const isDeleting = !!progress;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete {count} Item{count !== 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        {isDeleting ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-center text-muted-foreground">
              Deleting... <span className="font-semibold text-foreground">{progress.done}</span> / {progress.total}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-destructive h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Type <span className="font-bold text-destructive">DELETE</span> to confirm.
            </p>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type DELETE"
              className="bg-background/50 border-border/50 h-10"
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          {!isDeleting && (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={text !== "DELETE"}
                onClick={handleConfirm}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {count} Item{count !== 1 ? "s" : ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}