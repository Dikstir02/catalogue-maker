import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Cloud, FileText, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

const CLIENT_ID = '471887550782-7khs7702s9tes4it48o1t7ftpgjaos29.apps.googleusercontent.com';
const FOLDER_ID = '18LvVjQRUOdgPI_D34VK4-zOgT2pl2k51';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export default function DataManagement() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingFromDrive, setImportingFromDrive] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Google Drive state
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [backupFiles, setBackupFiles] = useState([]);
  const [showBackups, setShowBackups] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('drive_access_token');
    const ls = localStorage.getItem('last_sync');
    if (token) setDriveConfigured(true);
    if (ls) setLastSync(ls);
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleGoogleSignIn = () => {
    if (typeof google === 'undefined' || !google.accounts) {
      showMessage('Google Identity Services failed to load. Please refresh the page.', 'error');
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
          showMessage('Google Drive connected successfully!', 'success');
        } else {
          showMessage('Google sign-in failed.', 'error');
        }
      },
      error_callback: (err) => {
        showMessage('Google sign-in error: ' + (err?.message || 'Unknown'), 'error');
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
    setBackupFiles([]);
    setShowBackups(false);
    showMessage('Google Drive disconnected.', 'success');
  };

  const handleExportLocal = async () => {
    setExporting(true);
    try {
      const result = await apiClient.exportAllDataLocal();
      showMessage(result.message, 'success');
    } catch (error) {
      showMessage('Export failed: ' + error.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportDrive = async () => {
    setExporting(true);
    try {
      const result = await apiClient.exportAllDataToDrive();
      showMessage(result.message, 'success');
      const newLastSync = localStorage.getItem('last_sync');
      if (newLastSync) setLastSync(newLastSync);
    } catch (error) {
      showMessage('Export failed: ' + error.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await apiClient.importAllData(file);
      showMessage(result.message, 'success');
      queryClient.invalidateQueries();
    } catch (error) {
      showMessage('Import failed: ' + error.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const loadBackupFiles = async () => {
    const token = localStorage.getItem('drive_access_token');
    if (!token) return;

    setLoadingBackups(true);
    try {
      const files = await apiClient.listDriveBackups(token, FOLDER_ID);
      setBackupFiles(files);
      setShowBackups(true);
    } catch (error) {
      showMessage('Failed to load backup list: ' + error.message, 'error');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleImportFromDrive = async (fileId) => {
    const token = localStorage.getItem('drive_access_token');
    if (!token) return;

    setImportingFromDrive(true);
    try {
      const result = await apiClient.importFromDriveFile(fileId, token);
      showMessage(result.message, 'success');
      queryClient.invalidateQueries();
      setShowBackups(false);
    } catch (error) {
      showMessage('Import failed: ' + error.message, 'error');
    } finally {
      setImportingFromDrive(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export or import your data using local files or Google Drive
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

        {/* Google Drive Connection */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Google Drive
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
                Sign in with Google to enable Drive backups and imports.
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

        {/* Export Section */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportLocal} disabled={exporting} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Download Locally'}
            </Button>
            <Button onClick={handleExportDrive} disabled={exporting || !driveConfigured} className="gap-2">
              <Cloud className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Upload to Drive'}
            </Button>
          </div>
          {!driveConfigured && (
            <p className="text-xs text-muted-foreground mt-2">Sign in to Google Drive above to enable Drive uploads.</p>
          )}
        </div>

        {/* Import Section */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Import Data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            <strong className="text-destructive">This will replace all your current data!</strong>
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={importing}
                id="file-import"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button disabled={importing} variant="outline" className="gap-2 pointer-events-none">
                <FileText className="w-4 h-4" />
                {importing ? 'Importing...' : 'Import from File'}
              </Button>
            </div>
            {driveConfigured && (
              <Button
                onClick={showBackups ? () => setShowBackups(false) : loadBackupFiles}
                disabled={loadingBackups || importingFromDrive}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {loadingBackups ? 'Loading...' : showBackups ? 'Hide Backups' : 'Import from Drive'}
              </Button>
            )}
          </div>

          {/* Drive backup file list */}
          {showBackups && backupFiles.length > 0 && (
            <div className="mt-3 border rounded-lg divide-y max-h-60 overflow-y-auto">
              {backupFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between px-3 py-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.createdTime ? new Date(file.createdTime).toLocaleString() : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleImportFromDrive(file.id)}
                    disabled={importingFromDrive}
                    className="flex-shrink-0 text-xs"
                  >
                    {importingFromDrive ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {showBackups && backupFiles.length === 0 && !loadingBackups && (
            <p className="text-sm text-muted-foreground mt-3">No backup files found in Drive.</p>
          )}
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm">How to use:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>Connect Google Drive</strong> (optional) to enable cloud backups</li>
            <li><strong>Download Locally</strong> for a quick JSON file save</li>
            <li><strong>Upload to Drive</strong> to save a timestamped backup to your Drive folder</li>
            <li><strong>Import from File</strong> to restore from a local JSON file</li>
            <li><strong>Import from Drive</strong> to select and restore from a Drive backup</li>
            <li><strong>Refresh</strong> the page after import to see your restored data</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}