import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

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

async function exportToExcel(products, hideStock = false) {
  if (!products.length) return;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");

  const columns = [
    { header: "Image", key: "image", width: 20 },
    { header: "SKU", key: "sku", width: 18 },
    { header: "Brand", key: "brand", width: 18 },
    { header: "Name", key: "product_name", width: 28 },
    { header: "Category", key: "category", width: 15 },
  ];
  if (!hideStock) columns.push({ header: "Stock", key: "stock", width: 10 });

  sheet.columns = columns;

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 20;

  const ROW_HEIGHT = 105; // ~20 char width * 7px ≈ 140px col width, row height ~105pt for 1:1 ratio

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const rowIndex = i + 2; // 1-based, row 1 is header

    const rowData = {
      sku: p.sku || "",
      brand: p.brand || "",
      product_name: p.product_name || "",
      category: p.category || "",
    };
    if (!hideStock) rowData.stock = p.stock || 0;

    const row = sheet.addRow(rowData);
    row.height = ROW_HEIGHT;
    row.alignment = { vertical: "middle" };

    if (p.image_url) {
      try {
        const { base64, ext } = await fetchImageAsBase64(p.image_url);
        const imageId = workbook.addImage({ base64, extension: ext });
        const padding = 4;
        // Use nativeCol/nativeRow with pixel offsets for precise placement
        sheet.addImage(imageId, {
          tl: { nativeCol: 0, nativeColOff: padding * 9144, nativeRow: rowIndex - 1, nativeRowOff: padding * 9144 },
          br: { nativeCol: 1, nativeColOff: -padding * 9144, nativeRow: rowIndex, nativeRowOff: -padding * 9144 },
          editAs: "oneCell",
        });
      } catch {
        // If image fails to load, leave cell empty
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = hideStock ? "products_no_stock.xlsx" : "products.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButton({ products }) {
  const [loading, setLoading] = useState(false);
  const [loadingNoStock, setLoadingNoStock] = useState(false);

  const handleExport = async (hideStock) => {
    if (hideStock) setLoadingNoStock(true);
    else setLoading(true);
    await exportToExcel(products, hideStock);
    if (hideStock) setLoadingNoStock(false);
    else setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleExport(false)}
        disabled={loading}
        className="gap-2 text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border/30"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
        Export
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleExport(true)}
        disabled={loadingNoStock}
        className="gap-2 text-xs font-medium bg-secondary/80 hover:bg-secondary border border-border/30"
      >
        {loadingNoStock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
        Export (No Stock)
      </Button>
    </div>
  );
}