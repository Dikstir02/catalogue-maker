import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageOff, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import ProductRow from "./ProductRow";

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-muted-foreground font-medium text-xs uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {label}
      {active ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

export default function ProductTable({ products, onEdit, onDelete, isAdmin, selectedIds, onSelect, onSelectAll, sortField, sortDir, onSort }) {
  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));
  const someSelected = products.some((p) => selectedIds.includes(p.id));

  if (!products.length) {
    return (
      <div className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageOff className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No products found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/30 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                  onCheckedChange={(v) => onSelectAll(!!v)}
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Image</TableHead>
              <TableHead>
                <SortHeader label="SKU" field="sku" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Brand" field="brand" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead>
                <SortHeader label="Category" field="category" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Stock" field="stock" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              </TableHead>
              {isAdmin && <TableHead className="w-24"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                isAdmin={isAdmin}
                selected={selectedIds.includes(product.id)}
                onSelect={onSelect}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}