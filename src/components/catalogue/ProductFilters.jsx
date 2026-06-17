import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import MultiSelectFilter from "./MultiSelectFilter";

export default function ProductFilters({ search, onSearchChange, categories, onCategoriesChange, brands, onBrandsChange, allBrands, allCategories }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU or category... (multiple SKUs: 12345, 67890)"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:bg-background/80 focus:border-primary/50 h-11"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <MultiSelectFilter
          label="Brand"
          options={allBrands}
          selected={brands}
          onChange={onBrandsChange}
        />
        <MultiSelectFilter
          label="Category"
          allLabel="All Categories"
          options={allCategories}
          selected={categories}
          onChange={onCategoriesChange}
        />
      </div>
    </div>
  );
}