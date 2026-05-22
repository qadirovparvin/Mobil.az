# AiryPhone

AiryPhone is a phone marketplace project with a static frontend and a Node.js/Express backend.

## Structure

- `Front end/`: HTML, CSS, JavaScript, and TypeScript frontend files
- `Backend/`: main Express and MongoDB backend API
- `Back end/`: older minimal backend stub kept in the workspace

## Local setup

### Frontend

```powershell
cd "Front end"
npm install
npm run check:encoding
npm run build
```

Open `index.html` in a browser or serve the folder with a local static server.

### Backend

```powershell
cd "Backend"
copy .env.example .env
npm install
npm run dev
```

Set real values in `Backend/.env` before starting the API.

## Notes

- `Backend/.env` is intentionally excluded from git.
- `node_modules` and uploaded files are excluded from git.
- The main backend is `Backend/`, not `Back end/`.
- Source files should stay in UTF-8. PowerShell output may still display some Azerbaijani characters incorrectly even when the file itself is valid UTF-8, so prefer browser rendering or UTF-8-aware tooling when verifying text.
