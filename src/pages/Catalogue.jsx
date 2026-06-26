import { db } from '@/lib/data-store'
import React, { useState, useMemo, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileUp, LogOut, Settings, Image, ChevronDown, FileSpreadsheet, FileText, Wrench } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import ProductFilters from "@/components/catalogue/ProductFilters";
import ProductForm from "@/components/catalogue/ProductForm";
import ProductTable from "@/components/catalogue/ProductTable";
import EditProductModal from "@/components/catalogue/EditProductModal";
import ExportModal from "@/components/catalogue/ExportModal";
import BulkImportModal from "@/components/catalogue/BulkImportModal";
import BatchDeleteDialog from "@/components/catalogue/BatchDeleteDialog";
import BatchEditModal from "@/components/catalogue/BatchEditModal";
import AdminPanel from "@/components/catalogue/AdminPanel";
import BulkImageUpdateModal from "@/components/catalogue/BulkImageUpdateModal";
import UpdateStocksModal from "@/components/catalogue/UpdateStocksModal";
import NotificationBar from "@/components/catalogue/NotificationBar";
import MissingItemsModal from "@/components/catalogue/MissingItemsModal";
import LogoutDialog from "@/components/catalogue/LogoutDialog";
import PdfCatalogueExport from "@/components/catalogue/PdfCatalogueExport";
import AppLogin from "@/pages/AppLogin";
import { getAppUser, setAppUser, clearAppUser } from "@/lib/auth";
import { Package, Download } from "lucide-react";
import ImportBackedUpDataDialog from "@/components/ImportBackedUpDataDialog";

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

export default function Catalogue() {
  const [appUser, setAppUserState] = useState(() => getAppUser());

  const handleLogin = (user) => {
    setAppUser(user);
    setAppUserState(user);
  };

  const handleLogout = () => {
    clearAppUser();
    setAppUserState(null);
  };

  if (!appUser) return <AppLogin onLogin={handleLogin} />;

  return <CatalogueApp appUser={appUser} onLogout={handleLogout} />;
}

// Dropdown button with portal - renders menu on document.body to avoid clipping
function DropdownBtn({ label, icon, align = "left", items }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <>
      <Button
        ref={btnRef}
        size="sm" variant="secondary"
        onClick={() => setOpen((o) => !o)}
        className="gap-1 bg-secondary/80 hover:bg-secondary border border-border/30 h-9 text-sm"
      >
        {icon}{label}<ChevronDown className="w-3 h-3" />
      </Button>
      {open && ReactDOM.createPortal(
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: align === "right" ? undefined : pos.left,
            right: align === "right" ? 10 : undefined,
            zIndex: 99999,
            minWidth: 160,
          }}
          className="bg-popover border border-border/50 rounded-md shadow-xl py-1 min-w-[160px]"
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpen(false); item.onClick(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function CatalogueApp({ appUser, onLogout }) {
  const isAdmin = appUser.role === "admin";
  const isManager = appUser.role === "manager";
  const isExporter = appUser.role === "exporter";
  const isUser = appUser.role === "user";
  const canManageProducts = isAdmin || isManager;
  const canExport = isAdmin || isManager || isExporter;
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showBackupImport, setShowBackupImport] = useState(false);
  const [showBulkImage, setShowBulkImage] = useState(false);
  const [showUpdateStocks, setShowUpdateStocks] = useState(false);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showPdfExport, setShowPdfExport] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list("-created_date"),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["catalogueconfig"],
    queryFn: () => db.entities.CatalogueConfig.list(),
  });

  const brandsConfig = configs.find((c) => c.config_key === "brands");
  const catsConfig = configs.find((c) => c.config_key === "categories");
  const allBrands = brandsConfig ? JSON.parse(brandsConfig.values) : DEFAULT_BRANDS;
  const allCategories = catsConfig ? JSON.parse(catsConfig.values) : DEFAULT_CATEGORIES;

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Product.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Product.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setEditProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Product.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const raw = search.trim();
    const isMultiSku = /[,;\s]/.test(raw);
    let list;
    if (isMultiSku) {
      const skus = raw.split(/[,;\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
      list = products.filter((p) => skus.includes((p.sku || "").toLowerCase()));
    } else {
      const q = raw.toLowerCase();
      list = products.filter((p) => {
        const matchSearch = !q
          || (p.sku || "").toLowerCase().includes(q)
          || (p.product_name || "").toLowerCase().includes(q)
          || (p.category || "").toLowerCase().includes(q)
          || (p.brand || "").toLowerCase().includes(q);
        const matchCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
        const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
        return matchSearch && matchCat && matchBrand;
      });
    }
    if (isMultiSku) {
      list = list.filter((p) => {
        const matchCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
        const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
        return matchCat && matchBrand;
      });
    }
    if (sortField) {
      list = [...list].sort((a, b) => {
        let av = a[sortField] ?? "";
        let bv = b[sortField] ?? "";
        if (sortField === "stock") { av = Number(av); bv = Number(bv); }
        else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, search, selectedCategories, selectedBrands, sortField, sortDir]);

  const handleSelect = (id, checked) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? filtered.map((p) => p.id) : []);
  };

  const handleBatchDelete = async () => {
    const total = selectedIds.length;
    setDeleteProgress({ done: 0, total });
    for (let i = 0; i < selectedIds.length; i++) {
      await db.entities.Product.delete(selectedIds[i]);
      setDeleteProgress({ done: i + 1, total });
    }
    setDeleteProgress(null);
    setSelectedIds([]);
    setShowBatchDelete(false);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const handleBatchEdit = async (updates) => {
    const total = selectedIds.length;
    setBatchProgress({ done: 0, total });
    for (let i = 0; i < selectedIds.length; i++) {
      await db.entities.Product.update(selectedIds[i], updates);
      setBatchProgress({ done: i + 1, total });
    }
    await db.entities.EditLog.create({
      username: appUser?.username || "unknown",
      action: "batch_edit",
      product_sku: `${total} items`,
      product_name: Object.keys(updates).join(", "),
      changes: JSON.stringify(updates),
      edited_at: new Date().toISOString(),
    });
    setBatchProgress(null);
    setSelectedIds([]);
    setShowBatchEdit(false);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const handleBulkImport = async () => {
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const handleCreate = (data) => { createMutation.mutate(data); setShowForm(false); };
  const handleUpdate = (id, data) => updateMutation.mutate({ id, data });
  const handleDelete = (id) => deleteMutation.mutate(id);

  const utilitiesItems = [
    { icon: <Image className="w-4 h-4" />, label: "Bulk Images", onClick: () => setShowBulkImage(true) },
    { icon: <FileUp className="w-4 h-4" />, label: "Update Stocks", onClick: () => setShowUpdateStocks(true) },
    { icon: <FileUp className="w-4 h-4" />, label: "Bulk Import", onClick: () => setShowBulkImport(true) },
  ];

  const showUtilities = isAdmin || isManager;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-card to-background overflow-hidden">
      <div className="flex-shrink-0">
        <header className="border-b border-border/30 px-6 py-4 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Catalogue Builder</h1>
                <p className="text-xs text-muted-foreground/60 italic">by Dexter John Modesto</p>
                <p className="text-sm text-muted-foreground">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                  {filtered.length !== products.length && ` · ${filtered.length} shown`}
                  {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">

              {/* Selected items actions */}
              {selectedIds.length > 0 && canExport && (
                isAdmin ? (
                  <DropdownBtn
                    label={`Export ${selectedIds.length} Selected`}
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    className="border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-400"
                    items={[
                      { icon: <FileSpreadsheet className="w-4 h-4" />, label: "Excel", onClick: () => setShowExport(true) },
                      { icon: <FileText className="w-4 h-4" />, label: "PDF", onClick: () => setShowPdfExport(true) },
                    ]}
                  />
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setShowExport(true)} className="border border-green-500/20 h-9 text-sm gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400">
                    Export {selectedIds.length} Selected
                  </Button>
                )
              )}
              {selectedIds.length > 0 && canManageProducts && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => setShowBatchEdit(true)} className="border border-border/30 h-9 text-sm gap-2">
                    Edit {selectedIds.length}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowBatchDelete(true)} className="h-9 text-sm gap-2">
                    Delete {selectedIds.length}
                  </Button>
                </>
              )}

              {/* Utilities dropdown — Admin & Manager only */}
              {showUtilities && (
                <DropdownBtn label="Utilities" icon={<Wrench className="w-4 h-4" />} items={utilitiesItems} />
              )}

              {/* Sync Data button — Exporter only */}
              {isExporter && (
                <Button size="sm" variant="secondary" onClick={() => setShowBackupImport(true)} className="gap-2 bg-secondary/80 hover:bg-secondary border border-border/30 h-9 text-sm">
                  <Download className="w-4 h-4" /> Sync Data
                </Button>
              )}

              {/* Add Product */}
              {canManageProducts && (
                <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 text-sm">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              )}

              {/* Export button */}
              {canExport && (
                isAdmin ? (
                  <DropdownBtn
                    label="Export"
                    icon={<FileSpreadsheet className="w-4 h-4" />}
                    align="right"
                    items={[
                      { icon: <FileSpreadsheet className="w-4 h-4" />, label: "Excel", onClick: () => setShowExport(true) },
                      { icon: <FileText className="w-4 h-4" />, label: "PDF", onClick: () => setShowPdfExport(true) },
                    ]}
                  />
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setShowExport(true)} className="gap-2 bg-secondary/80 hover:bg-secondary border border-border/30 h-9 text-sm">
                    Export
                  </Button>
                )
              )}

              {isAdmin && (
                <Button size="sm" variant="ghost" onClick={() => setShowAdmin(true)} className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
                  <Settings className="w-4 h-4" />
                </Button>
              )}

              {/* Non-admins: import backup JSON is available under Utilities dropdown */}

              <Button size="sm" variant="ghost" onClick={() => setShowLogout(true)} className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {canManageProducts && (
          <NotificationBar products={products} onOpenMissing={() => setShowMissing(true)} />
        )}

        <div className="border-b border-border/20 bg-background/60 backdrop-blur-sm px-6 py-4">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <ProductFilters
                  search={search}
                  onSearchChange={setSearch}
                  categories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                  brands={selectedBrands}
                  onBrandsChange={setSelectedBrands}
                  allBrands={allBrands}
                  allCategories={allCategories}
                />
              </div>
              {isUser && (
                <Button
                  size="sm"
                  onClick={() => setShowTable(true)}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-9 text-sm flex-shrink-0 mt-1"
                >
                  <Package className="w-4 h-4" /> Search
                </Button>
              )}
            </div>
            <AnimatePresence>
              {showForm && canManageProducts && (
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  <ProductForm onSave={handleCreate} onCancel={() => setShowForm(false)} saving={createMutation.isPending} brands={allBrands} categories={allCategories} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {(!isUser || showTable) && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductTable
                    products={filtered}
                    onEdit={setEditProduct}
                    onDelete={handleDelete}
                    isAdmin={canManageProducts}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
          {isUser && !showTable && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground mb-2">Browse the Catalogue</p>
              <p className="text-sm text-muted-foreground/60 max-w-md">
                Use the search bar and filters above to find products, then click <strong>Search</strong> to view results.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        products={selectedIds.length > 0 ? products.filter((p) => selectedIds.includes(p.id)) : filtered}
        currentUser={appUser}
      />
      <PdfCatalogueExport
        open={showPdfExport}
        onOpenChange={setShowPdfExport}
        products={selectedIds.length > 0 ? products.filter((p) => selectedIds.includes(p.id)) : filtered}
        currentUser={appUser}
      />
      <BulkImportModal open={showBulkImport} onOpenChange={setShowBulkImport} existingProducts={products} onImport={handleBulkImport} />
      <EditProductModal product={editProduct} open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)} onSave={handleUpdate} saving={updateMutation.isPending} currentUser={appUser} brands={allBrands} categories={allCategories} />
      <BatchDeleteDialog open={showBatchDelete} onOpenChange={setShowBatchDelete} count={selectedIds.length} onConfirm={handleBatchDelete} progress={deleteProgress} />
      <BatchEditModal open={showBatchEdit} onOpenChange={setShowBatchEdit} count={selectedIds.length} onSave={handleBatchEdit} saving={!!batchProgress} progress={batchProgress} brands={allBrands} categories={allCategories} />
      {isAdmin && <AdminPanel open={showAdmin} onOpenChange={setShowAdmin} currentUser={appUser} />}
      <BulkImageUpdateModal open={showBulkImage} onOpenChange={setShowBulkImage} products={products} onUpdated={() => qc.invalidateQueries({ queryKey: ["products"] })} />
      <UpdateStocksModal open={showUpdateStocks} onOpenChange={setShowUpdateStocks} existingProducts={products} onUpdated={() => qc.invalidateQueries({ queryKey: ["products"] })} />
      <MissingItemsModal open={showMissing} onOpenChange={setShowMissing} products={products} allBrands={allBrands} allCategories={allCategories} onUpdated={() => qc.invalidateQueries({ queryKey: ["products"] })} />
      <ImportBackedUpDataDialog open={showBackupImport} onOpenChange={setShowBackupImport} />
      <LogoutDialog open={showLogout} onOpenChange={setShowLogout} onConfirm={onLogout} />
    </div>
  );
}