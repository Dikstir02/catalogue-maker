import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, RotateCcw } from "lucide-react";

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

export default function BatchEditModal({ open, onOpenChange, count, onSave, saving, progress, brands = DEFAULT_BRANDS, categories = DEFAULT_CATEGORIES }) {
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [applied, setApplied] = useState(null);

  const handleClose = () => {
    if (saving) return;
    setBrand(""); setCategory(""); setApplied(null);
    onOpenChange(false);
  };

  const handleUndo = () => { setBrand(""); setCategory(""); };

  const handleSave = () => {
    const updates = {};
    if (brand) updates.brand = brand;
    if (category) updates.category = category;
    if (Object.keys(updates).length > 0) {
      setApplied(updates);
      onSave(updates);
    }
  };

  const isDirty = !!(brand || category);
  const remaining = progress ? progress.total - progress.done : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Batch Edit {count} Item{count !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">Only filled fields will be updated.</p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Brand (leave blank to keep)</Label>
            <Select value={brand} onValueChange={setBrand} disabled={saving}>
              <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm">
                <SelectValue placeholder="— no change —" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category (leave blank to keep)</Label>
            <Select value={category} onValueChange={setCategory} disabled={saving}>
              <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm">
                <SelectValue placeholder="— no change —" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isDirty && !saving && (
            <button onClick={handleUndo} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset selections
            </button>
          )}
          {saving && progress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Updating items...</span>
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
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !isDirty} className="gap-2 bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}