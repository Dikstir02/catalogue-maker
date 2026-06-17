import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Key, FileText, Trash2, ClipboardEdit, Tags, Plus, X } from "lucide-react";
import { format } from "date-fns";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", desc: "Full access" },
  { value: "manager", label: "Manager", desc: "Add/Edit/Delete products" },
  { value: "exporter", label: "Exporter", desc: "Export only" },
  { value: "user", label: "User", desc: "View only" },
];

const ROLE_COLORS = {
  admin: "bg-primary/20 text-primary",
  manager: "bg-blue-500/20 text-blue-400",
  exporter: "bg-green-500/20 text-green-400",
  user: "bg-secondary text-muted-foreground",
};

const DEFAULT_BRANDS = ["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"];
const DEFAULT_CATEGORIES = ["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"];

export default function AdminPanel({ open, onOpenChange, currentUser, onPasswordChanged }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Admin Panel</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="users">
          <TabsList className="w-full flex-wrap h-auto">
            <TabsTrigger value="users" className="flex-1 gap-1.5 text-xs"><UserPlus className="w-3.5 h-3.5" />Users</TabsTrigger>
            <TabsTrigger value="catalogue" className="flex-1 gap-1.5 text-xs"><Tags className="w-3.5 h-3.5" />Catalogue</TabsTrigger>
            <TabsTrigger value="password" className="flex-1 gap-1.5 text-xs"><Key className="w-3.5 h-3.5" />Password</TabsTrigger>
            <TabsTrigger value="editlogs" className="flex-1 gap-1.5 text-xs"><ClipboardEdit className="w-3.5 h-3.5" />Edit Logs</TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" />Export Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="users"><UserManager /></TabsContent>
          <TabsContent value="catalogue"><CatalogueManager /></TabsContent>
          <TabsContent value="password"><ChangePassword currentUser={currentUser} onChanged={onPasswordChanged} /></TabsContent>
          <TabsContent value="editlogs"><EditLogs /></TabsContent>
          <TabsContent value="logs"><ExportLogs /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UserManager() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [msg, setMsg] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["appusers"],
    queryFn: () => db.entities.AppUser.list(),
  });

  const addUser = async (e) => {
    e.preventDefault();
    setMsg("");
    const exists = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) { setMsg("Username already exists."); return; }
    await db.entities.AppUser.create({ username: username.trim(), password, role });
    qc.invalidateQueries({ queryKey: ["appusers"] });
    setUsername(""); setPassword(""); setRole("user");
    setMsg("User added successfully.");
  };

  const deleteUser = async (id, uname) => {
    if (uname.toLowerCase() === "dexter") return;
    await db.entities.AppUser.delete(id);
    qc.invalidateQueries({ queryKey: ["appusers"] });
  };

  const changeRole = async (id, uname, newRole) => {
    if (uname.toLowerCase() === "dexter") return;
    await db.entities.AppUser.update(id, { role: newRole });
    qc.invalidateQueries({ queryKey: ["appusers"] });
  };

  return (
    <div className="space-y-4 pt-3">
      <form onSubmit={addUser} className="space-y-3 border border-border/30 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground">Add New User</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted-foreground ml-1.5 text-xs">— {r.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {msg && <p className="text-xs text-primary">{msg}</p>}
        <Button type="submit" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
          <UserPlus className="w-3.5 h-3.5" /> Add User
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Existing Users</p>
        <div className="border border-border/30 rounded-lg divide-y divide-border/20">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2 gap-2">
              <span className="text-sm text-foreground font-medium flex-shrink-0">{u.username}</span>
              {u.username.toLowerCase() === "dexter" ? (
                <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS["admin"]}`}>admin</span>
              ) : (
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={u.role || "user"} onValueChange={(v) => changeRole(u.id, u.username, v)}>
                    <SelectTrigger className={`h-7 text-xs border-0 px-2 rounded-md w-[110px] ${ROLE_COLORS[u.role || "user"]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.filter((r) => r.value !== "admin").map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id, u.username)} className="h-7 w-7 text-destructive/60 hover:text-destructive flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {ROLE_OPTIONS.map((r) => (
            <div key={r.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`px-1.5 py-0.5 rounded text-xs ${ROLE_COLORS[r.value]}`}>{r.label}</span>
              <span>— {r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CatalogueManager() {
  const qc = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ["catalogueconfig"],
    queryFn: () => db.entities.CatalogueConfig.list(),
  });

  const brandsConfig = configs.find((c) => c.config_key === "brands");
  const catsConfig = configs.find((c) => c.config_key === "categories");
  const brands = brandsConfig ? JSON.parse(brandsConfig.values) : DEFAULT_BRANDS;
  const categories = catsConfig ? JSON.parse(catsConfig.values) : DEFAULT_CATEGORIES;

  const saveList = async (key, list, existingConfig) => {
    const values = JSON.stringify(list);
    if (existingConfig) {
      await db.entities.CatalogueConfig.update(existingConfig.id, { values });
    } else {
      await db.entities.CatalogueConfig.create({ config_key: key, values });
    }
    qc.invalidateQueries({ queryKey: ["catalogueconfig"] });
  };

  return (
    <div className="space-y-5 pt-3">
      <TagEditor label="Brands" items={brands} onSave={(list) => saveList("brands", list, brandsConfig)} />
      <TagEditor label="Categories" items={categories} onSave={(list) => saveList("categories", list, catsConfig)} />
    </div>
  );
}

function TagEditor({ label, items, onSave }) {
  const [list, setList] = useState(null);
  const [newVal, setNewVal] = useState("");
  const current = list !== null ? list : items;

  const add = () => {
    const v = newVal.trim().toUpperCase();
    if (!v || current.includes(v)) return;
    setList([...current, v]);
    setNewVal("");
  };

  const remove = (item) => setList(current.filter((i) => i !== item));

  const isDirty = list !== null && JSON.stringify(list) !== JSON.stringify(items);

  return (
    <div className="space-y-2 border border-border/30 rounded-lg p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {current.map((item) => (
          <span key={item} className="flex items-center gap-1 text-xs bg-secondary/80 border border-border/30 rounded-full px-2.5 py-1 text-foreground">
            {item}
            <button onClick={() => remove(item)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={`Add new ${label.toLowerCase().slice(0, -1)}...`}
          className="bg-background/50 border-border/50 h-8 text-sm"
        />
        <Button size="sm" variant="secondary" onClick={add} className="h-8 px-3 gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      {isDirty && (
        <Button size="sm" onClick={() => onSave(current)} className="gap-1.5 bg-primary hover:bg-primary/90 h-8 text-xs">
          Save {label}
        </Button>
      )}
    </div>
  );
}

function ChangePassword({ currentUser, onChanged }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    setMsg("");
    if (newPass !== confirm) { setMsg("New passwords do not match."); return; }
    setLoading(true);
    const users = await db.entities.AppUser.filter({ username: currentUser.username });
    const me = users[0];
    if (!me || me.password !== current) { setMsg("Current password is incorrect."); setLoading(false); return; }
    await db.entities.AppUser.update(me.id, { password: newPass });
    setLoading(false);
    setMsg("Password changed successfully.");
    setCurrent(""); setNewPass(""); setConfirm("");
    onChanged && onChanged();
  };

  return (
    <form onSubmit={handleChange} className="space-y-4 pt-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Current Password</Label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">New Password</Label>
        <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="bg-background/50 border-border/50 h-9 text-sm" />
      </div>
      {msg && <p className="text-xs text-primary">{msg}</p>}
      <Button type="submit" disabled={loading} className="w-full gap-2 bg-primary hover:bg-primary/90 h-9">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
        Change Password
      </Button>
    </form>
  );
}

function EditLogDetailModal({ log, onClose }) {
  if (!log) return null;
  let changes = [];
  try { changes = Object.entries(JSON.parse(log.changes || "{}")); } catch {}
  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-base">
            <ClipboardEdit className="w-4 h-4 text-primary" />
            Edit Detail
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="font-semibold text-foreground">{log.username}</span>
            <span className="bg-secondary/80 border border-border/30 rounded px-1.5 py-0.5 text-muted-foreground">{log.action}</span>
            <span className="text-muted-foreground ml-auto">{log.edited_at ? format(new Date(log.edited_at), "MMM d, yyyy HH:mm") : ""}</span>
          </div>
          <div className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {log.product_sku && <span className="font-mono text-foreground/80 mr-2 font-semibold">{log.product_sku}</span>}
              {log.product_name}
            </p>
          </div>
          {changes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Changes</p>
              {changes.map(([field, val]) => (
                <div key={field} className="bg-secondary/20 border border-border/20 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground capitalize">{field}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex-1 bg-destructive/10 border border-destructive/20 text-destructive/80 rounded px-2 py-1 line-through">
                      {String(val?.before ?? "—")}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="flex-1 bg-primary/10 border border-primary/20 text-primary/80 rounded px-2 py-1">
                      {String(val?.after ?? "—")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No field-level changes recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditLogs() {
  const [selectedLog, setSelectedLog] = useState(null);
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["editlogs"],
    queryFn: () => db.entities.EditLog.list("-edited_at"),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2 pt-3">
      <p className="text-sm font-medium text-foreground">Edit History ({logs.length})</p>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No edits yet.</p>
      ) : (
        <div className="border border-border/30 rounded-lg divide-y divide-border/20 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <button
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="w-full px-3 py-2 space-y-1 text-left hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{log.username}</span>
                  <span className="text-xs bg-secondary/80 border border-border/30 rounded px-1.5 py-0.5 text-muted-foreground">{log.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{log.edited_at ? format(new Date(log.edited_at), "MMM d, yyyy HH:mm") : ""}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {log.product_sku && <span className="font-mono text-foreground/70 mr-1">{log.product_sku}</span>}
                {log.product_name}
              </p>
            </button>
          ))}
        </div>
      )}
      <EditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

function ExportLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["exportlogs"],
    queryFn: () => db.entities.ExportLog.list("-exported_at"),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2 pt-3">
      <p className="text-sm font-medium text-foreground">Export History ({logs.length})</p>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No exports yet.</p>
      ) : (
        <div className="border border-border/30 rounded-lg divide-y divide-border/20 max-h-72 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="px-3 py-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{log.username}</span>
                <span className="text-xs text-muted-foreground">{log.exported_at ? format(new Date(log.exported_at), "MMM d, yyyy HH:mm") : ""}</span>
              </div>
              <p className="text-xs text-muted-foreground">{log.product_count} items · {log.columns}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}