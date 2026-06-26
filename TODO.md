# TODO

- [ ] Fix `src/components/DataManagement.jsx` runtime crash that causes Admin Panel → Data tab to render blank.
  - Symptom: browser console `ReferenceError: autoSync is not defined`.
  - Root cause: component references undefined hooks/state vars (autoSync, syncStatus, setSyncStatus, etc.).
  - Update strategy: simplify component to only the working Export/Import UI so tab always renders; remove broken sync sections and any undefined variables.
- [ ] Verify Data tab renders after fix.
  - Manual: open Admin Panel → click Data tab.
  - Console: ensure no ReferenceError in browser devtools.
- [ ] Run `npm test`/`npm run build` if present.

