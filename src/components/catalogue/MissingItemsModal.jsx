import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageOff, AlertTriangle, Upload, X } from "lucide-react";

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

function getMissingReasons(product) {
  const reasons = [];
  if (!product.image_url) reasons.push("No image");
  if (!product.brand) reasons.push("No brand");
  if (!product.category) reasons.push("No category");
  if (!product.product_name) reasons.push("No name");
  return reasons;
}

function FixProductModal({ product, open, onClose, onSaved, allBrands, allCategories }) {
  const [form, setForm] = useState({
    brand: product?.brand || "",
    category: product?.category || "",
    product_name: product?.product_name || "",
    sub_name: product?.sub_name || "",
    dimensions: product?.dimensions || "",
    description: product?.description || "",
    image_url: product?.image_url || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reasons = product ? getMissingReasons(product) : [];
  const needsImage = reasons.includes("No image");
  const needsBrand = reasons.includes("No brand");
  const needsCategory = reasons.includes("No category");
  const needsName = reasons.includes("No name");
  const needsSubName = reasons.includes("No sub-name");
  const needsDimensions = reasons.includes("No dimensions");
  const needsDescription = reasons.includes("No description");

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {};
    if (needsImage && form.image_url) updates.image_url = form.image_url;
    if (needsBrand && form.brand) updates.brand = form.brand;
    if (needsCategory && form.category) updates.category = form.category;
    if (needsName && form.product_name) updates.product_name = form.product_name;
    if (needsSubName && form.sub_name) updates.sub_name = form.sub_name;
    if (needsDimensions && form.dimensions) updates.dimensions = form.dimensions;
    if (needsDescription && form.description) updates.description = form.description;
    await db.entities.Product.update(product.id, updates);
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">
            Fix: {product.sku || product.product_name || "Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {needsImage && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Image</Label>
              {form.image_url ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-secondary/40 border border-border/30">
                  <img src={form.image_url} alt="" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-secondary/20">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Or paste URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="h-8 text-sm bg-secondary/40 border-border/30"
                />
              </div>
            </div>
          )}

          {needsBrand && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Brand</Label>
              <select
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-border/50 bg-secondary/40 text-foreground text-sm"
              >
                <option value="">Select brand...</option>
                {allBrands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {needsCategory && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-border/50 bg-secondary/40 text-foreground text-sm"
              >
                <option value="">Select category...</option>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {needsName && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Product Name</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                placeholder="Enter product name..."
                className="h-9 text-sm bg-secondary/40 border-border/30"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MissingItemsModal({ open, onOpenChange, products, allBrands, allCategories, onUpdated }) {
  const [fixingProduct, setFixingProduct] = useState(null);
  const missing = products.filter((p) => getMissingReasons(p).length > 0);

  const brands = allBrands || DEFAULT_BRANDS;
  const categories = allCategories || DEFAULT_CATEGORIES;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border/30 max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Incomplete Products ({missing.length})
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">Click a row to fix the missing information.</p>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {missing.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All products are complete!</p>
            ) : (
              <div className="divide-y divide-border/20">
                {missing.map((p) => {
                  const reasons = getMissingReasons(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setFixingProduct(p)}
                      className="w-full flex items-center gap-3 py-3 text-left hover:bg-accent/20 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded bg-secondary/60 flex items-center justify-center flex-shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-10 h-10 object-contain rounded" />
                        ) : (
                          <ImageOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.product_name || <span className="text-muted-foreground italic">No name</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.sku || "—"} · {p.brand || "—"} · {p.category || "—"}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {reasons.map((r) => (
                          <Badge key={r} variant="outline" className="text-xs border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {fixingProduct && (
        <FixProductModal
          product={fixingProduct}
          open={!!fixingProduct}
          onClose={() => setFixingProduct(null)}
          onSaved={() => { if (onUpdated) onUpdated(); }}
          allBrands={brands}
          allCategories={categories}
        />
      )}
    </>
  );
}