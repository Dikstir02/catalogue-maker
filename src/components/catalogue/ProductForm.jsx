import { db } from '@/lib/data-store'
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Upload, Loader2 } from "lucide-react";

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

export default function ProductForm({ product, onSave, onCancel, saving, brands = DEFAULT_BRANDS, categories = DEFAULT_CATEGORIES }) {
  const [form, setForm] = useState({ sku: "", brand: "", product_name: "", category: "", image_url: "", stock: 0 });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({ sku: product.sku || "", brand: product.brand || "", product_name: product.product_name || "", category: product.category || "", image_url: product.image_url || "", stock: product.stock || 0 });
    }
  }, [product]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, stock: parseInt(form.stock) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">SKU</Label>
          <Input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} required className="bg-background/50 border-border/50 text-foreground h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Brand</Label>
          <Select value={form.brand} onValueChange={(v) => handleChange("brand", v)}>
            <SelectTrigger className="bg-background/50 border-border/50 text-foreground h-10"><SelectValue placeholder="Select a brand" /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Name</Label>
          <Input value={form.product_name} onChange={(e) => handleChange("product_name", e.target.value)} required className="bg-background/50 border-border/50 text-foreground h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Category</Label>
          <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
            <SelectTrigger className="bg-background/50 border-border/50 text-foreground h-10"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Image</Label>
          <div className="flex gap-2">
            <Input value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://..." className="bg-background/50 border-border/50 text-foreground h-10 flex-1" />
            <label className="flex items-center justify-center h-10 px-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border/50 cursor-pointer transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">Stock</Label>
          <Input type="number" min="0" value={form.stock} onChange={(e) => handleChange("stock", e.target.value)} className="bg-background/50 border-border/50 text-foreground h-10" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {product ? "Save Changes" : "Save Product"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </form>
  );
}