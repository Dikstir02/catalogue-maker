import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const queryClient = useQueryClient();

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
    if (file) {
      // Local import (legacy)
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
      return;
    }

    // Cloud import: when no local file is chosen, import latest online backup
    setImporting(true);
    setMessage(null);

    try {
      const result = await apiClient.importAllDataFromCloud();
      setMessage({ text: result.message, type: 'success' });
      setMessageType('success');
      queryClient.invalidateQueries();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setMessage({ text: 'Cloud import failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setImporting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSyncToGist = async () => {
    // Use stored token if input is empty
    const tokenToUse = gistToken || localStorage.getItem('github_repo_token');

    
    if (!tokenToUse) {
      setMessage({ text: 'Please enter a GitHub Personal Access Token', type: 'error' });
      setMessageType('error');
      return;
    }

    setSyncing(true);
    setMessage(null);

    try {
      const result = await apiClient.syncToGist(syncStatus.gistId || null, tokenToUse);
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
      
      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries();
      
      setMessage({ text: result.message + ' Refreshing page...', type: 'success' });
      setMessageType('success');
      
      // Refresh page after 1 second to show synced data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage({ text: 'Sync failed: ' + error.message, type: 'error' });
      setMessageType('error');
    } finally {
      setSyncing(false);
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
      setMessage({ text: 'Auto-sync enabled. Data will sync every 10 seconds.', type: 'success' });
      setMessageType('success');
    } else {
      apiClient.disableAutoSync();
      setMessage({ text: 'Auto-sync disabled', type: 'success' });
      setMessageType('success');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Countdown timer
  useEffect(() => {
    if (!autoSync || !syncStatus.isConfigured) {
      setCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 10 : prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSync, syncStatus.isConfigured, syncStatus.lastSync]);

  // Auto sync every 10 seconds (bidirectional)
  useEffect(() => {
    if (!autoSync || !syncStatus.isConfigured) return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('github_repo_token');

        
        // First, sync from cloud (pull latest changes) - skip confirmation for auto-sync
        await apiClient.syncFromGist(syncStatus.gistId, token, true);
        
        // Then, sync to cloud (push local changes)
        await apiClient.syncToGist(syncStatus.gistId, token);
        
        // Invalidate all queries to refresh the UI with synced data
        queryClient.invalidateQueries();
        
        localStorage.setItem('last_sync', new Date().toISOString());
        setSyncStatus(apiClient.getSyncStatus());
        setCountdown(10); // Reset countdown after sync
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, 10000); // 10 seconds

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