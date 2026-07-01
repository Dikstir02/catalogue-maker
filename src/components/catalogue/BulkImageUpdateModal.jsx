import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Loader2, CheckCircle2 } from "lucide-react";

function extractSkuFromUrl(url) {
  try {
    const parts = url.trim().split(/[/\\]/);
    const filename = parts[parts.length - 1];
    return filename.replace(/\.[^.]+$/, "").trim();
  } catch {
    return "";
  }
}

export default function BulkImageUpdateModal({ open, onOpenChange, products, onUpdated }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleClose = () => {
    if (loading) return;
    setText(""); setResult(null); setProgress(null);
    onOpenChange(false);
  };

  const handleAddMore = () => {
    setResult(null);
    setText("");
  };

  const handleApply = async () => {
    setLoading(true);
    setResult(null);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const total = lines.length;
    setProgress({ done: 0, total });
    const skuMap = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
    let matched = 0;
    let unmatched = 0;
    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      const sku = extractSkuFromUrl(url);
      const product = skuMap.get(sku.toLowerCase());
      if (product) {
        await db.entities.Product.update(product.id, { image_url: url });
        matched++;
      } else {
        unmatched++;
      }
      setProgress({ done: i + 1, total });
    }
    // Silently refresh product data without page redirect
    if (onUpdated) {
      onUpdated();
    }
    setLoading(false);
    setResult({ matched, unmatched, total: lines.length });
    setProgress(null);
  };

  const remaining = progress ? progress.total - progress.done : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Bulk Image Update
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-sm text-muted-foreground">
            Paste image URLs (one per line). The filename (without extension) will be matched against product SKUs.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"https://example.com/images/SKU001.jpg\nhttps://example.com/images/SKU002.png"}
            className="bg-background/50 border-border/50 min-h-[140px] text-sm font-mono"
            disabled={loading}
          />
          {loading && progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Updating images...</span>
                <span>{progress.done} / {progress.total} · {remaining} remaining</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground">
                <span className="font-semibold text-primary">{result.matched}</span> updated · {result.unmatched} unmatched out of {result.total} URLs
              </span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {result ? (
            <>
              <Button variant="secondary" onClick={handleClose}>Close</Button>
              <Button onClick={handleAddMore} className="gap-2 bg-primary hover:bg-primary/90">
                <Image className="w-4 h-4" />
                Add More Images
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>Close</Button>
              <Button onClick={handleApply} disabled={loading || !text.trim()} className="gap-2 bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                Apply
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}