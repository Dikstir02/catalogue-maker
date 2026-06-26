import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Github, CheckCircle, AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // GitHub config state
  const [showConfig, setShowConfig] = useState(false);
  const [ghToken, setGhToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [ghOwner] = useState('Dikstir02');
  const [ghRepo] = useState('catalogue-maker');
  const [ghConfigured, setGhConfigured] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem('github_repo_token');
    const storedLastSync = localStorage.getItem('last_sync');
    if (storedToken) {
      setGhToken(storedToken);
      setGhConfigured(true);
    }
    if (storedLastSync) setLastSync(storedLastSync);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const result = await apiClient.exportAllData();
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');
      const newLastSync = localStorage.getItem('last_sync');
      if (newLastSync) setLastSync(newLastSync);
    } catch (error) {
      setMessage({ text: 'Export failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setExporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const result = await apiClient.importAllData(file);
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');

      // Ensure other screens refresh their data.
      queryClient.invalidateQueries();
    } catch (error) {
      setMessage({ text: 'Import failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setImporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const saveGitHubConfig = () => {
    if (!ghToken.trim()) return;
    localStorage.setItem('github_repo_owner', ghOwner);
    localStorage.setItem('github_repo_name', ghRepo);
    localStorage.setItem('github_repo_token', ghToken.trim());
    setGhConfigured(true);
    setMessage({ text: 'GitHub configuration saved! Export will now upload to the repo.', type: 'success' });
    setMessageType('success');
    setTimeout(() => setMessage(null), 5000);
  };

  const clearGitHubConfig = () => {
    apiClient.clearSync();
    setGhToken('');
    setGhConfigured(false);
    setLastSync(null);
    setMessage({ text: 'GitHub configuration cleared.', type: 'success' });
    setMessageType('success');
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export your data to backup or import data from another browser
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* GitHub Repo Backup Section */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Repo Backup
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs"
            >
              {showConfig ? 'Hide' : 'Configure'}
            </Button>
          </div>

          {ghConfigured && lastSync && (
            <p className="text-xs text-muted-foreground mb-3">
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}

          {ghConfigured ? (
            <p className="text-sm text-green-600 dark:text-green-400 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              GitHub backup is configured. Export will upload to <strong>{ghOwner}/{ghRepo}</strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Configure GitHub backup to automatically upload exports to your repository.
            </p>
          )}

          {showConfig && (
            <div className="space-y-3 mt-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Repository Owner</Label>
                  <Input value={ghOwner} disabled className="bg-background/50 border-border/50 h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Repository Name</Label>
                  <Input value={ghRepo} disabled className="bg-background/50 border-border/50 h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  GitHub Personal Access Token
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      placeholder="ghp_..."
                      className="bg-background/50 border-border/50 h-9 text-sm pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button size="sm" onClick={saveGitHubConfig} className="h-9">
                    Save
                  </Button>
                  {ghConfigured && (
                    <Button size="sm" variant="destructive" onClick={clearGitHubConfig} className="h-9">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a token at{' '}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">
                    github.com/settings/tokens
                  </a>{' '}
                  with <code className="bg-secondary/50 px-1 rounded">repo</code> scope. The token is stored locally in your browser only.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Export Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {ghConfigured
                ? 'Export all your data to the GitHub repository as a timestamped backup file.'
                : 'Download all your data (products, users, configs, logs) as a JSON file.'}
            </p>

            <Button onClick={handleExport} disabled={exporting} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Import Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import data from a previously exported JSON file.
              <strong className="text-destructive"> This will replace all your current data!</strong>
            </p>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            {importing && <p className="text-sm text-muted-foreground mt-2">Importing...</p>}
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">How to use:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              <strong>Configure GitHub:</strong> Enter your GitHub Personal Access Token above to enable cloud backups
            </li>
            <li>
              <strong>Export:</strong> Click "Export All Data" to upload a timestamped backup to <code className="bg-secondary/50 px-1 rounded">backups/</code> in your repo
            </li>
            <li>
              <strong>Transfer:</strong> Download the backup file from your GitHub repo to another device
            </li>
            <li>
              <strong>Import:</strong> Click "Import Data" and select the JSON file
            </li>
            <li>
              <strong>Refresh:</strong> After import, refresh the page to see your data
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}