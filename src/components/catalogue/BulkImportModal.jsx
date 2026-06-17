import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download } from "lucide-react";

import * as XLSX from "xlsx";

const VALID_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

function downloadImportTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["BRAND", "NAME", "SKU", "CATEGORY", "STOCK"],
    ["DUPONT", "Example Product", "SKU-001", "Lighter", 5],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "import_template.xlsx");
}

function matchCategory(raw) {
  if (!raw) return "";
  const normalized = String(raw).trim().toLowerCase();
  // exact match first
  const exact = VALID_CATEGORIES.find((c) => c.toLowerCase() === normalized);
  if (exact) return exact;
  // partial match fallback
  const partial = VALID_CATEGORIES.find((c) => normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized));
  return partial || String(raw).trim();
}

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed = rows
        .map((r) => ({
          brand: String(r["BRAND"] || "").trim(),
          product_name: String(r["NAME"] || "").trim(),
          sku: String(r["SKU"] || "").trim(),
          category: matchCategory(r["CATEGORY"]),
          stock: parseInt(r["STOCK"]) || 0,
        }))
        .filter((r) => r.sku);
      resolve(parsed);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function BulkImportModal({ open, onOpenChange, existingProducts, onImport }) {
  const [step, setStep] = useState("upload");
  const [parsedRows, setParsedRows] = useState([]);
  const [conflicting, setConflicting] = useState([]);
  const [newRows, setNewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const rows = await parseExcel(file);
    const existingSkus = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p]));
    const conflicts = rows.filter((r) => existingSkus.has(r.sku.toLowerCase()));
    const fresh = rows.filter((r) => !existingSkus.has(r.sku.toLowerCase()));
    setParsedRows(rows);
    setConflicting(conflicts);
    setNewRows(fresh);
    setLoading(false);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setDone(false);
    const total = newRows.length + conflicting.length;
    setProgress({ done: 0, total });
    const existingSkuMap = new Map(existingProducts.map((p) => [p.sku.toLowerCase(), p]));
    let done = 0;
    for (const row of conflicting) {
      const existing = existingSkuMap.get(row.sku.toLowerCase());
      if (existing) await base44Import(existing.id, row, "update");
      done++;
      setProgress({ done, total });
    }
    for (const row of newRows) {
      await base44Import(null, row, "create");
      done++;
      setProgress({ done, total });
    }
    await onImport(newRows, conflicting, existingSkuMap);
    setLoading(false);
    setDone(true);
  };

  const handleClose = () => {
    setStep("upload");
    setParsedRows([]);
    setConflicting([]);
    setNewRows([]);
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
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Import from Excel
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel file with columns: <span className="font-semibold text-foreground">BRAND, NAME, SKU, CATEGORY, STOCK</span>
            </p>
            <Button variant="secondary" size="sm" onClick={downloadImportTemplate} className="gap-2 text-xs border border-border/30">
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
                <p className="text-lg font-semibold text-foreground">Import Complete!</p>
                <p className="text-sm text-muted-foreground">{parsedRows.length} items processed successfully.</p>
              </div>
            ) : loading && progress ? (
              <div className="space-y-3 py-4">
                <p className="text-sm text-center text-muted-foreground">
                  Importing... <span className="font-semibold text-foreground">{progress.done}</span> / {progress.total} items
                </p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{newRows.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">New items</p>
                  </div>
                  <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">{conflicting.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Will be replaced</p>
                  </div>
                </div>

                {conflicting.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      Existing items that will be overwritten:
                    </div>
                    <div className="bg-background/50 border border-border/30 rounded-lg max-h-48 overflow-y-auto divide-y divide-border/20">
                      {conflicting.map((r) => (
                        <div key={r.sku} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
                          <span className="text-foreground truncate max-w-[60%] text-right">{r.product_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      New items to be added:
                    </div>
                    <div className="bg-background/50 border border-border/30 rounded-lg max-h-48 overflow-y-auto divide-y divide-border/20">
                      {newRows.map((r) => (
                        <div key={r.sku} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
                          <span className="text-foreground truncate max-w-[60%] text-right">{r.product_name}</span>
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
                <Button onClick={handleConfirm} disabled={loading || parsedRows.length === 0} className="gap-2 bg-primary hover:bg-primary/90">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Import
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// These are called inside the modal for progress tracking
async function base44Import(id, row, type) {
  const { db } = await import("@/lib/data-store");
  if (type === "update") {
    return db.entities.Product.update(id, row);
  }
  return db.entities.Product.create(row);
}
