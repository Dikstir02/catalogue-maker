import React from "react";
import { Search, CheckCircle, Circle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import MultiSelectFilter from "./MultiSelectFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductFilters({
  search,
  onSearchChange,
  categories,
  onCategoriesChange,
  brands,
  onBrandsChange,
  allBrands,
  allCategories,
  infoFilter,
  onInfoFilterChange,
  excludeZeroStock,
  onExcludeZeroStockChange,
}) {
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
        <Select
          value={infoFilter}
          onValueChange={onInfoFilterChange}
        >
          <SelectTrigger className="bg-background/50 border-border/50 text-foreground h-11 w-[160px]">
            <SelectValue placeholder="Info Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Info Status</SelectItem>
            <SelectItem value="complete">Complete Only</SelectItem>
            <SelectItem value="incomplete">Incomplete Only</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 h-11">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Exclude 0 stock</span>
          <Switch
            checked={excludeZeroStock}
            onCheckedChange={onExcludeZeroStockChange}
            className="ml-auto"
          />
        </div>
      </div>
    </div>
  );
}