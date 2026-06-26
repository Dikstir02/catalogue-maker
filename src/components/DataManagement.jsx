import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, AlertTriangle, CheckCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [gistToken, setGistToken] = useState('');
  const [syncStatus, setSyncStatus] = useState(apiClient.getSyncStatus());
  const [autoSync, setAutoSync] = useState(apiClient.isAutoSyncEnabled());

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    
    try {
      const result = apiClient.exportAllData();
      setMessage({ text: 'Data exported successfully!', type: 'success' });
      setMessageType('success');
    } catch (error) {
      setMessage({ text: 'Export failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setExporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const result = await apiClient.importAllData(file);
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');
    } catch (error) {
      setMessage({ text: 'Import failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setImporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSyncToGist = async () => {
    if (!gistToken) {
      setMessage({ text: 'Please enter a GitHub Personal Access Token', type: 'error' });
      setMessageType('error');
      return;
    }

    setSyncing(true);
    setMessage(null);

    try {
      const result = await apiClient.syncToGist(syncStatus.gistId || null, gistToken);
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');
      setSyncStatus(apiClient.getSyncStatus());
      setGistToken('');
    } catch (error) {
      setMessage({ text: 'Sync failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSyncFromGist = async () => {
    if (!syncStatus.isConfigured) {
      setMessage({ text: 'Please configure sync first by syncing to a Gist', type: 'error' });
      setMessageType('error');
      return;
    }

    setSyncing(true);
    setMessage(null);

    try {
      const result = await apiClient.syncFromGist(syncStatus.gistId, localStorage.getItem('gist_token'));
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');
    } catch (error) {
      setMessage({ text: 'Sync failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleClearSync = () => {
    if (confirm('Are you sure you want to clear sync configuration?')) {
      apiClient.clearSync();
      setSyncStatus(apiClient.getSyncStatus());
      setAutoSync(false);
      setMessage({ text: 'Sync configuration cleared', type: 'success' });
      setMessageType('success');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAutoSyncToggle = async (enabled) => {
    setAutoSync(enabled);
    if (enabled) {
      apiClient.enableAutoSync();
      setMessage({ text: 'Auto-sync enabled. Data will sync every 1 minute.', type: 'success' });
      setMessageType('success');
    } else {
      apiClient.disableAutoSync();
      setMessage({ text: 'Auto-sync disabled', type: 'success' });
      setMessageType('success');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Auto sync every 1 minute
  useEffect(() => {
    if (!autoSync || !syncStatus.isConfigured) return;

    const interval = setInterval(async () => {
      try {
        // Sync from cloud first (to get latest changes)
        await apiClient.syncFromGist(syncStatus.gistId, localStorage.getItem('gist_token'));
        localStorage.setItem('last_sync', new Date().toISOString());
        setSyncStatus(apiClient.getSyncStatus());
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoSync, syncStatus.isConfigured, syncStatus.gistId]);

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
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Export Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download all your data (products, users, configs, logs) as a JSON file.
              You can use this file to backup your data or import it into another browser.
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full sm:w-auto"
            >
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
            {importing && (
              <p className="text-sm text-muted-foreground mt-2">Importing...</p>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Cloud Sync (GitHub Gist)</h3>
              {syncStatus.isConfigured ? (
                <Cloud className="w-4 h-4 text-green-500" />
              ) : (
                <CloudOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Sync your data across all browsers using GitHub Gist.
              {syncStatus.isConfigured && (
                <span className="block mt-1 text-xs">
                  Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                </span>
              )}
            </p>

            {!syncStatus.isConfigured ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="gist-token" className="text-xs text-muted-foreground">
                    GitHub Personal Access Token
                  </Label>
                  <Input
                    id="gist-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={gistToken}
                    onChange={(e) => setGistToken(e.target.value)}
                    className="bg-background/50 border-border/50 h-9 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a token at: github.com/settings/tokens (enable gist scope)
                  </p>
                </div>
                <Button
                  onClick={handleSyncToGist}
                  disabled={syncing}
                  className="w-full sm:w-auto"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  {syncing ? 'Syncing...' : 'Enable Cloud Sync'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  After enabling, you can turn on auto-sync to automatically sync every 1 minute
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSyncFromGist}
                    disabled={syncing}
                    variant="secondary"
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {syncing ? 'Syncing...' : 'Sync from Cloud'}
                  </Button>
                  <Button
                    onClick={handleSyncToGist}
                    disabled={syncing}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    {syncing ? 'Syncing...' : 'Sync to Cloud'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <Label htmlFor="auto-sync" className="text-sm font-medium cursor-pointer">
                      Auto-sync every 1 minute
                    </Label>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={handleAutoSyncToggle}
                  />
                </div>
                
                <Button
                  onClick={handleClearSync}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  Disable Cloud Sync
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">How to use:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>Export:</strong> Click "Export All Data" to download a JSON backup file</li>
            <li><strong>Transfer:</strong> Copy the JSON file to your other device/browser</li>
            <li><strong>Import:</strong> Click "Import Data" and select the JSON file</li>
            <li><strong>Refresh:</strong> After import, refresh the page to see your data</li>
            <li><strong>Cloud Sync:</strong> Use GitHub Gist to sync data across all browsers automatically</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}