import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";

const ITEMS_PER_PAGE = 10;
const COLS = 2;
const ROWS = 5;

const PDF_THEMES = {
  classic: {
    name: "Classic Dark",
    bg: [15, 20, 40],
    cardBg: [245, 245, 248],
    cardBorder: [200, 205, 220],
    skuColor: [100, 110, 130],
    nameColor: [20, 25, 45],
    descColor: [120, 130, 155],
    footerBg: [25, 30, 55],
    footerLine: [180, 140, 60],
    footerText: [180, 140, 60],
    pageNumColor: [100, 110, 150],
  },
  elegant: {
    name: "Elegant Gold",
    bg: [25, 20, 15],
    cardBg: [255, 252, 245],
    cardBorder: [180, 160, 120],
    skuColor: [140, 120, 90],
    nameColor: [40, 30, 20],
    descColor: [100, 85, 65],
    footerBg: [30, 25, 18],
    footerLine: [200, 170, 100],
    footerText: [200, 170, 100],
    pageNumColor: [140, 120, 90],
  },
  modern: {
    name: "Modern Blue",
    bg: [10, 15, 30],
    cardBg: [240, 245, 255],
    cardBorder: [150, 170, 210],
    skuColor: [90, 110, 150],
    nameColor: [15, 25, 50],
    descColor: [100, 120, 160],
    footerBg: [15, 20, 40],
    footerLine: [100, 150, 220],
    footerText: [100, 150, 220],
    pageNumColor: [90, 110, 150],
  },
  minimal: {
    name: "Minimal Gray",
    bg: [30, 30, 30],
    cardBg: [250, 250, 250],
    cardBorder: [180, 180, 180],
    skuColor: [120, 120, 120],
    nameColor: [30, 30, 30],
    descColor: [130, 130, 130],
    footerBg: [40, 40, 40],
    footerLine: [150, 150, 150],
    footerText: [150, 150, 150],
    pageNumColor: [120, 120, 120],
  },
};

async function loadImageAsDataUrl(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const SIZE = 300;
      const scale = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight, 1);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/png"), w, h });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "catalogue";
}

async function generatePdfCatalogue(products, filename, themeKey, onProgress) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Page dimensions
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 10;
  const FOOTER_H = 14;
  const HEADER_H = 0;
  const CONTENT_H = PAGE_H - MARGIN * 2 - FOOTER_H - HEADER_H;

  const CELL_W = (PAGE_W - MARGIN * 2) / COLS;
  const CELL_H = CONTENT_H / ROWS;

  const IMG_W = 52;
  const IMG_H = 40;

  const pages = [];
  for (let i = 0; i < products.length; i += ITEMS_PER_PAGE) {
    pages.push(products.slice(i, i + ITEMS_PER_PAGE));
  }

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) doc.addPage();
    const pageProducts = pages[pageIdx];

    const theme = PDF_THEMES[themeKey] || PDF_THEMES.classic;
    // Page background
    doc.setFillColor(...theme.bg);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");

    for (let i = 0; i < pageProducts.length; i++) {
      const p = pageProducts[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * CELL_W;
      const y = MARGIN + row * CELL_H;

      // Card background (white/light)
      doc.setFillColor(...theme.cardBg);
      doc.roundedRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4, 3, 3, "F");

      // Subtle border
      doc.setDrawColor(...theme.cardBorder);
      doc.setLineWidth(0.3);
      doc.roundedRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4, 3, 3, "S");

      // SKU (top-left small label)
      doc.setFontSize(7);
      doc.setTextColor(...theme.skuColor);
      doc.setFont("helvetica", "normal");
      doc.text(p.sku || "", x + 6, y + 10);

      // Product name (bold) - use sub_name as main name if available
      const mainName = p.sub_name || p.product_name || "";
      doc.setFontSize(10);
      doc.setTextColor(...theme.nameColor);
      doc.setFont("helvetica", "bold");
      const nameLines = doc.splitTextToSize(mainName, CELL_W - IMG_W - 12);
      doc.text(nameLines.slice(0, 2), x + 6, y + 18);

      // Description (subtext) - use description field
      const descText = p.description || "";
      if (descText) {
        doc.setFontSize(7);
        doc.setTextColor(...theme.descColor);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(descText, CELL_W - IMG_W - 12);
        doc.text(descLines.slice(0, 2), x + 6, y + 25);
      }

      // Dimensions (if available)
      const dims = [];
      if (p.length) dims.push(`L: ${p.length}`);
      if (p.width) dims.push(`W: ${p.width}`);
      if (p.height) dims.push(`H: ${p.height}`);
      const dimText = dims.length > 0 ? `Dimensions: ${dims.join(" x ")} mm` : "";
      if (dimText) {
        doc.setFontSize(6.5);
        doc.setTextColor(...theme.descColor);
        doc.setFont("helvetica", "normal");
        doc.text(dimText, x + 6, y + descText ? 32 : 25);
      }

      // Image on the right
      if (p.image_url) {
        const imgResult = await loadImageAsDataUrl(p.image_url);
        if (imgResult) {
          const aspect = imgResult.w / imgResult.h;
          let dw = IMG_W;
          let dh = IMG_H;
          if (aspect > dw / dh) { dh = dw / aspect; } else { dw = dh * aspect; }
          const imgX = x + CELL_W - dw - 6;
          const imgY = y + (CELL_H - dh) / 2;
          doc.addImage(imgResult.dataUrl, "PNG", imgX, imgY, dw, dh);
        }
      }

      onProgress && onProgress(pageIdx * ITEMS_PER_PAGE + i + 1);
    }

    // Footer
    doc.setFillColor(...theme.footerBg);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, "F");
    doc.setDrawColor(...theme.footerLine);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H);
    doc.setFontSize(8);
    doc.setTextColor(...theme.footerText);
    doc.setFont("helvetica", "bold");
    doc.text("LA CASA DEL HABANO  |  BAQER MOHEBI ENTERPRISES", PAGE_W / 2, PAGE_H - 5, { align: "center" });

    // Page number
    doc.setFontSize(7);
    doc.setTextColor(...theme.pageNumColor);
    doc.setFont("helvetica", "normal");
    doc.text(`${pageIdx + 1} / ${pages.length}`, PAGE_W - MARGIN, PAGE_H - 5, { align: "right" });
  }

  doc.save(`${sanitizeFilename(filename)}.pdf`);
}

export default function PdfCatalogueExport({ open, onOpenChange, products, currentUser }) {
  const [filename, setFilename] = useState("catalogue");
  const [theme, setTheme] = useState("classic");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);

  const handleClose = () => {
    if (!loading) { setProgress(null); setDone(false); onOpenChange(false); }
  };

  const handleExport = async () => {
    setLoading(true);
    setDone(false);
    setProgress({ done: 0, total: products.length });
    await generatePdfCatalogue(products, filename, theme, (p) => setProgress({ done: p, total: products.length }));
    // Log export
    await db.entities.ExportLog.create({
      username: currentUser?.username || "unknown",
      exported_at: new Date().toISOString(),
      product_count: products.length,
      columns: "PDF Catalogue",
    });
    setLoading(false);
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Export PDF Catalogue
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <p className="text-lg font-semibold text-foreground">PDF Generated!</p>
            <p className="text-sm text-muted-foreground">{products.length} products · {Math.ceil(products.length / ITEMS_PER_PAGE)} pages</p>
          </div>
        ) : loading && progress ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-center text-muted-foreground">
              Building catalogue... <span className="font-semibold text-foreground">{progress.done}</span> / {progress.total}
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Generates an artistic dark-themed PDF catalogue with product images, SKU, and sub-name.
            </p>
            <div className="bg-secondary/40 border border-border/30 rounded-lg p-3 space-y-1 text-xs text-muted-foreground">
              <p>· <span className="text-foreground font-medium">{products.length}</span> products</p>
              <p>· <span className="text-foreground font-medium">{Math.ceil(products.length / ITEMS_PER_PAGE)}</span> pages (10 items/page, 2 columns)</p>
              <p>· Includes: SKU, sub-name, product image</p>
            </div>
            <div className="space-y-1 pt-1">
              <Label htmlFor="pdf-filename" className="text-xs text-muted-foreground">File name</Label>
              <input
                id="pdf-filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value.replace(/[\\/:*?"<>|]/g, ""))}
                placeholder="catalogue"
                className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 pt-1">
              <Label htmlFor="pdf-theme" className="text-xs text-muted-foreground">Theme</Label>
              <select
                id="pdf-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.entries(PDF_THEMES).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {done ? (
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleExport} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Generate PDF
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}