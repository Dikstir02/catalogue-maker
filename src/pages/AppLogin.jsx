import { db } from '@/lib/data-store'
import React, { useState } from "react";
import { apiClient } from '@/lib/api-client';

import { setAppUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2, FileText, CheckCircle, AlertTriangle, Upload } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

export default function AppLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState({ type: '', text: '' });
  const [showImport, setShowImport] = useState(false);

  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const users = await db.entities.AppUser.filter({ username: username.trim() });
    const match = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    setLoading(false);
    if (match) {
      setAppUser({ id: match.id, username: match.username, role: match.role });
      onLogin({ id: match.id, username: match.username, role: match.role });
    } else {
      setError("Invalid username or password.");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage({ type: '', text: '' });
    try {
      const result = await apiClient.importAllData(file);
      setImportMessage({ type: 'success', text: result.message });
      queryClient.invalidateQueries();
    } catch (error) {
      setImportMessage({ type: 'error', text: 'Import failed: ' + error.message });
    } finally {
      setImporting(false);
    }
    // Reset file input so same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Catalogue Builder</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="bg-background/50 border-border/50 h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-border/50 h-10"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        {/* Import Data divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gradient-to-br from-background via-card to-background px-2 text-muted-foreground/50">or</span>
          </div>
        </div>

        {/* Import Data toggle */}
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center justify-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {showImport ? 'Hide Import' : 'Restore Data from Backup'}
        </button>

        {showImport && (
          <div className="mt-3 bg-card/60 backdrop-blur-md border border-border/30 rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-destructive">This will replace all your current data!</strong>
            </p>

            {/* Import message */}
            {importMessage && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 ${
                  importMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : importMessage.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'hidden'
                }`}
              >
                {importMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : importMessage.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : null}
                {importMessage.text && <p className="text-xs">{importMessage.text}</p>}
              </div>
            )}

            {/* File picker - same as DataManagement.jsx */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={importing}
                id="login-file-import"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button disabled={importing} variant="outline" className="w-full gap-2 pointer-events-none">
                <FileText className="w-4 h-4" />
                {importing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                  </span>
                ) : (
                  'Import from File'
                )}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/50 mt-6 italic">by Dexter John Modesto</p>
      </div>
    </div>
  );
}