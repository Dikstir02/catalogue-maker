import { db } from '@/lib/data-store'
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, BarChart2, AlertTriangle, CheckCircle2, Loader2, Download } from "lucide-react";

function parseStocksExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed = rows
        .map((r) => ({
          sku: String(r["SKU"] || "").trim(),
          stock: parseInt(r["STOCK"]) || 0,
        }))
        .filter((r) => r.sku);
      resolve(parsed);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["SKU", "STOCK"], ["EXAMPLE-SKU-001", 10]]);
  XLSX.utils.book_append_sheet(wb, ws, "Stocks");
  XLSX.writeFile(wb, "stocks_template.xlsx");
}

export default function UpdateStocksModal({ open, onOpenChange, existingProducts, onUpdated }) {
  const [step, setStep] = useState("upload");
  const [parsedRows, setParsedRows] = useState([]);
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const rows = await parseStocksExcel(file);
    const skuMap = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p]));
    const matchedRows = rows.filter((r) => skuMap.has(r.sku.toLowerCase()));
    const unmatchedRows = rows.filter((r) => !skuMap.has(r.sku.toLowerCase()));
    setParsedRows(rows);
    setMatched(matchedRows);
    setUnmatched(unmatchedRows);
    setLoading(false);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setDone(false);
    const total = matched.length;
    setProgress({ done: 0, total });
    const skuMap = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p]));
    let count = 0;
    for (const row of matched) {
      const product = skuMap.get(row.sku.toLowerCase());
      if (product) await db.entities.Product.update(product.id, { stock: row.stock });
      count++;
      setProgress({ done: count, total });
    }
    onUpdated && onUpdated();
    setLoading(false);
    setDone(true);
  };

  const handleClose = () => {
    setStep("upload");
    setParsedRows([]);
    setMatched([]);
    setUnmatched([]);
    setProgress(null);
    setDone(false);
    if (fileRef.current) fileRef.current.value = "";
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Update Stocks from Excel
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file with columns: <span className="font-semibold text-foreground">SKU, STOCK</span>
            </p>
            <Button variant="secondary" size="sm" onClick={downloadTemplate} className="gap-2 text-xs border border-border/30">
              <Download className="w-3.5 h-3.5" /> Download Template
            </Button>
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/50 rounded-xl p-10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              {loading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select an Excel file (.xlsx, .xls)</span>
                </>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={loading} />
            </label>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <p className="text-lg font-semibold text-foreground">Update Complete!</p>
                <p className="text-sm text-muted-foreground">{matched.length} product stocks updated successfully.</p>
              </div>
            ) : loading && progress ? (
              <div className="space-y-3 py-4">
                <p className="text-sm text-center text-muted-foreground">
                  Updating... <span className="font-semibold text-foreground">{progress.done}</span> / {progress.total} items
                </p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{matched.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Will be updated</p>
                  </div>
                  <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{unmatched.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">SKU not found</p>
                  </div>
                </div>

                {matched.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Stocks to update:
                    </div>
                    <div className="bg-background/50 border border-border/30 rounded-lg max-h-48 overflow-y-auto divide-y divide-border/20">
                      {matched.map((r) => (
                        <div key={r.sku} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
                          <span className="text-foreground font-semibold">→ {r.stock}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {unmatched.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      SKUs not found (will be skipped):
                    </div>
                    <div className="bg-background/50 border border-border/30 rounded-lg max-h-32 overflow-y-auto divide-y divide-border/20">
                      {unmatched.map((r) => (
                        <div key={r.sku} className="px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === "confirm" && (
          <DialogFooter className="gap-2">
            {done ? (
              <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">Done</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleConfirm} disabled={loading || matched.length === 0} className="gap-2 bg-primary hover:bg-primary/90">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Update
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}