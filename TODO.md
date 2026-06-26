# TODO

## Data Management cloud backup change
- [ ] Remove Cloud Sync UI section from `src/components/DataManagement.jsx`
- [ ] Remove GitHub/Gist sync logic usage from `src/components/DataManagement.jsx`
- [ ] Implement backend backup endpoints in `backend/server.js`
  - [ ] `POST /api/backup` store latest JSON
  - [ ] `GET /api/backup` return latest JSON
- [ ] Update `src/lib/api-client.js`
  - [ ] Replace `exportAllData()` to upload JSON to `POST /api/backup`
  - [ ] Add cloud import method that calls `GET /api/backup` and imports
- [ ] Update `src/components/ImportBackedUpDataDialog.jsx` if needed
- [ ] Update “How to use” text
- [ ] Verify build/lint

