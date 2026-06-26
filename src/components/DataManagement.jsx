import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

const CLIENT_ID = '471887550782-7khs7702s9tes4it48o1t7ftpgjaos29.apps.googleusercontent.com';
const FOLDER_ID = '18LvVjQRUOdgPI_D34VK4-zOgT2pl2k51';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Google Drive state
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('drive_access_token');
    const ls = localStorage.getItem('last_sync');
    if (token) setDriveConfigured(true);
    if (ls) setLastSync(ls);
  }, []);

  const handleGoogleSignIn = () => {
    if (typeof google === 'undefined' || !google.accounts) {
      setMessage({ text: 'Google Identity Services failed to load. Please refresh the page.', type: 'error' });
      setMessageType('error');
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.access_token) {
          localStorage.setItem('drive_access_token', response.access_token);
          localStorage.setItem('drive_folder_id', FOLDER_ID);
          setDriveConfigured(true);
          setMessage({ text: 'Google Drive connected successfully!', type: 'success' });
          setMessageType('success');
          setTimeout(() => setMessage(null), 5000);
        } else {
          setMessage({ text: 'Google sign-in failed.', type: 'error' });
          setMessageType('error');
          setTimeout(() => setMessage(null), 5000);
        }
      },
      error_callback: (err) => {
        setMessage({ text: 'Google sign-in error: ' + (err?.message || 'Unknown'), type: 'error' });
        setMessageType('error');
        setTimeout(() => setMessage(null), 5000);
      }
    });

    client.requestAccessToken();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_folder_id');
    localStorage.removeItem('last_sync');
    setDriveConfigured(false);
    setLastSync(null);
    setMessage({ text: 'Google Drive disconnected.', type: 'success' });
    setMessageType('success');
    setTimeout(() => setMessage(null), 5000);
  };

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

        {/* Google Drive Backup Section */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19h8l2-4 2 4h8L12 2zm0 4.5L18.5 17h-3.2L12 12.5 8.7 17H5.5L12 6.5z"/>
            </svg>
            Google Drive Backup
          </h3>

          {lastSync && (
            <p className="text-xs text-muted-foreground mb-2">
              Last sync: {new Date(lastSync).toLocaleString()}
            </p>
          )}

          {driveConfigured ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Google Drive is connected
              </p>
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-xs gap-1.5">
                <Trash2 className="w-3 h-3" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Sign in with Google to automatically upload backups to your Google Drive folder.
              </p>
              <Button onClick={handleGoogleSignIn} className="gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Export Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {driveConfigured
                ? 'Export all your data to Google Drive as a timestamped backup file.'
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
              <strong>Connect Google Drive:</strong> Click "Sign in with Google" to authorize the app
            </li>
            <li>
              <strong>Export:</strong> Click "Export All Data" to upload a backup to your Google Drive folder
            </li>
            <li>
              <strong>Transfer:</strong> Download the backup file from your Drive to another device
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