import { db } from '@/lib/data-store'
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, Loader2, RotateCcw } from "lucide-react";

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

export default function EditProductModal({ product, open, onOpenChange, onSave, saving, currentUser, brands = DEFAULT_BRANDS, categories = DEFAULT_CATEGORIES }) {
  const empty = { sku: "", brand: "", product_name: "", sub_name: "", description: "", category: "", image_url: "", stock: 0 };
  const [form, setForm] = useState(empty);
  const [original, setOriginal] = useState(empty);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      const snap = {
        sku: product.sku || "",
        brand: product.brand || "",
        product_name: product.product_name || "",
        sub_name: product.sub_name || "",
        description: product.description || "",
        category: product.category || "",
        image_url: product.image_url || "",
        stock: product.stock || 0,
      };
      setForm(snap);
      setOriginal(snap);
    }
  }, [product]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleUndo = () => setForm(original);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = { ...form, stock: parseInt(form.stock) || 0 };
    // Log changes
    const changeFields = Object.keys(updated).filter((k) => String(updated[k]) !== String(original[k]));
    if (changeFields.length > 0) {
      const changes = {};
      changeFields.forEach((k) => { changes[k] = { before: original[k], after: updated[k] }; });
      await db.entities.EditLog.create({
        username: currentUser?.username || "unknown",
        product_sku: product.sku,
        product_name: product.product_name,
        action: "edit",
        changes: JSON.stringify(changes),
        edited_at: new Date().toISOString(),
      });
    }
    onSave(product.id, updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/30 max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-foreground">Edit Product</DialogTitle>
            {isDirty && (
              <Button type="button" size="sm" variant="ghost" onClick={handleUndo} className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                Undo changes
              </Button>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">SKU</Label>
              <Input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Brand</Label>
              <Select value={form.brand} onValueChange={(v) => handleChange("brand", v)}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input value={form.product_name} onChange={(e) => handleChange("product_name", e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Sub-name</Label>
              <Input value={form.sub_name} onChange={(e) => handleChange("sub_name", e.target.value)} placeholder="Variant name" className="bg-background/50 border-border/50 h-9 text-sm" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Product description text" className="bg-background/50 border-border/50 min-h-[80px] text-sm resize-y" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stock</Label>
              <Input type="number" min="0" value={form.stock} onChange={(e) => handleChange("stock", e.target.value)} className="bg-background/50 border-border/50 h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image</Label>
            <div className="flex gap-2">
              <Input value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://..." className="bg-background/50 border-border/50 h-9 text-sm flex-1" />
              <label className="flex items-center justify-center h-9 px-2.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border/50 cursor-pointer transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Upload className="w-3.5 h-3.5 text-muted-foreground" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving || !isDirty} className="flex-1 bg-primary hover:bg-primary/90 gap-2 h-10">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="flex-1 h-10">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}