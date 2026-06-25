# TODO

- [x] Inspect SQLite backend failing code path (`backend/server.js`).
- [x] Replace reserved column name `values` with `config_values` in SQLite schema creation.
- [x] Update SQLite seed insert statement to write into `config_values`.
- [x] Update SQLite config update endpoint to write into `config_values`.
- [ ] Redeploy using `backend/render-sqlite.yaml` to verify Render startup no longer fails.
- [ ] If Render has existing `catalogue.db` with old schema, add startup migration (rename/copy `values` -> `config_values`).


