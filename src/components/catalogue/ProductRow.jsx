import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, ImageOff } from "lucide-react";

export default function ProductRow({ product, onEdit, onDelete, isAdmin, selected, onSelect }) {
  return (
    <TableRow className="border-b border-border/20 hover:bg-primary/5 transition-colors">
      <TableCell className="py-3 w-10">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(product.id, !!v)}
        />
      </TableCell>
      <TableCell className="py-3">
        {product.image_url ? (
          <a href={product.image_url} target="_blank" rel="noopener noreferrer">
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-12 h-12 object-cover rounded-lg border border-border/30"
              loading="lazy"
              style={{ imageRendering: "auto" }}
            />
          </a>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center border border-border/30">
            <ImageOff className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
      </TableCell>
      <TableCell className="text-foreground font-medium text-sm">{product.sku}</TableCell>
      <TableCell className="text-foreground font-medium text-sm">{product.brand}</TableCell>
      <TableCell className="text-foreground font-medium text-sm">{product.product_name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{product.category}</TableCell>
      <TableCell className="text-foreground font-medium text-sm">{product.stock || 0}</TableCell>
      {isAdmin && (
        <TableCell>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(product)} className="h-8 w-8 text-foreground hover:text-primary">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(product.id)} className="h-8 w-8 text-destructive/60 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}