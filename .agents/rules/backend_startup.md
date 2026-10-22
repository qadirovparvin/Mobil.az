# Backend Startup Instruction

Hər hansı bir kod tapşırığına başlamazdan əvvəl Backend port 5000-i yoxla, sönülüdürsə `node server.js`-i daemon kimi başlat:
```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue || node Backend/ensure_backend.js
```
və ya `node server.js` arxa fonda (daemon) işə salınmalıdır.
