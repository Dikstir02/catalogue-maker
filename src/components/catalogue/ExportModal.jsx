import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

const ALL_COLUMNS = [
  { key: "image", label: "IMAGE" },
  { key: "sku", label: "SKU" },
  { key: "brand", label: "BRAND" },
  { key: "product_name", label: "NAME" },
  { key: "category", label: "CATEGORY" },
  { key: "stock", label: "STOCK" },
];

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      const ext = blob.type.includes("png") ? "png" : "jpeg";
      resolve({ base64, ext });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "products";
}

async function exportToExcel(products, selectedCols, filename, onProgress) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");

  const colDefs = [];
  if (selectedCols.image) colDefs.push({ header: "Image", key: "image", width: 20 });
  if (selectedCols.sku) colDefs.push({ header: "SKU", key: "sku", width: 18 });
  if (selectedCols.brand) colDefs.push({ header: "Brand", key: "brand", width: 18 });
  if (selectedCols.product_name) colDefs.push({ header: "Name", key: "product_name", width: 28 });
  if (selectedCols.category) colDefs.push({ header: "Category", key: "category", width: 15 });
  if (selectedCols.stock) colDefs.push({ header: "Stock", key: "stock", width: 10 });

  sheet.columns = colDefs;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 20;

  const ROW_HEIGHT = 80;
  const IMG_COL_WIDTH = 15; // matches row height for ~1:1 cell ratio
  const IMG_COL_INDEX = colDefs.findIndex((c) => c.key === "image");
  if (IMG_COL_INDEX >= 0) colDefs[IMG_COL_INDEX].width = IMG_COL_WIDTH;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const rowIndex = i + 2;
    const rowData = {};
    if (selectedCols.sku) rowData.sku = p.sku || "";
    if (selectedCols.brand) rowData.brand = p.brand || "";
    if (selectedCols.product_name) rowData.product_name = p.product_name || "";
    if (selectedCols.category) rowData.category = p.category || "";
    if (selectedCols.stock) rowData.stock = p.stock || 0;

    const row = sheet.addRow(rowData);
    row.height = ROW_HEIGHT;
    row.alignment = { vertical: "middle" };

    onProgress && onProgress(i + 1);
    if (selectedCols.image && p.image_url && IMG_COL_INDEX >= 0) {
      try {
        // Fetch and compress image via canvas (force 1:1 square)
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          img.src = p.image_url;
        });
        const SIZE = 200;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Strict 1:1 square - crop to fill (cover) to prevent stretching
        const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (SIZE - dw) / 2;
        const dy = (SIZE - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        // Use PNG to preserve transparency
        const base64 = canvas.toDataURL("image/png").split(",")[1];
        const imageId = workbook.addImage({ base64, extension: "png" });
        const padding = 4;
        sheet.addImage(imageId, {
          tl: { nativeCol: IMG_COL_INDEX, nativeColOff: padding * 9144, nativeRow: rowIndex - 1, nativeRowOff: padding * 9144 },
          br: { nativeCol: IMG_COL_INDEX + 1, nativeColOff: -padding * 9144, nativeRow: rowIndex, nativeRowOff: -padding * 9144 },
          editAs: "oneCell",
        });
      } catch {
        // skip
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(filename)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportModal({ open, onOpenChange, products, currentUser }) {
  const [selected, setSelected] = useState({
    image: true, sku: true, brand: true, product_name: true, category: true, stock: true,
  });
  const [filename, setFilename] = useState("products");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);

  const toggle = (key) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleClose = () => {
    if (!loading) { setProgress(null); setDone(false); onOpenChange(false); }
  };

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    setProgress({ done: 0, total: products.length });
    await exportToExcel(products, selected, filename, (p) => setProgress({ done: p, total: products.length }));
    await db.entities.ExportLog.create({
      username: currentUser?.username || "unknown",
      exported_at: new Date().toISOString(),
      product_count: products.length,
      columns: ALL_COLUMNS.filter((c) => selected[c.key]).map((c) => c.label).join(", "),
    });
    setLoading(false);
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Export to Excel
          </DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <FileSpreadsheet className="w-12 h-12 text-green-400" />
            <p className="text-lg font-semibold text-foreground">Export Complete!</p>
            <p className="text-sm text-muted-foreground">{products.length} products exported.</p>
          </div>
        ) : loading && progress ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-center text-muted-foreground">
              Processing images... <span className="font-semibold text-foreground">{progress.done}</span> / {progress.total}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Select columns to include:</p>
            <div className="space-y-2">
              {ALL_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center gap-3">
                  <Checkbox id={`col-${col.key}`} checked={selected[col.key]} onCheckedChange={() => toggle(col.key)} />
                  <Label htmlFor={`col-${col.key}`} className="text-sm text-foreground cursor-pointer">{col.label}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              <Label htmlFor="filename" className="text-xs text-muted-foreground">File name</Label>
              <input
                id="filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value.replace(/[\\/:*?"<>|]/g, ""))}
                placeholder="products"
                className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">Exporting {products.length} product{products.length !== 1 ? "s" : ""}</p>
          </div>
        )}
        <DialogFooter className="gap-2">
          {done ? (
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleExport} disabled={loading || !Object.values(selected).some(Boolean)} className="gap-2 bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Export
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}