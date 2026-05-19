# Skyline LED Wall Configurator

A production tool for Skyline Whitespace AV technicians and project managers to configure LED wall specifications, generate material lists, and export client/tech PDFs.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · @react-pdf/renderer

---

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run test       # vitest unit tests (46 tests)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm run gen-pdf    # generate a sample client PDF to scripts/sample-client.pdf
```

## Project structure

```
src/
  calculations.ts      # all business logic (panels, power, materials, processor)
  calculations.test.ts # vitest unit tests
  config.ts            # panel specs, processor models, thresholds
  App.tsx              # root component, state management
  store.ts             # localStorage save/load
  useOverrides.ts      # "edit everything" override hook
  components/
    DesignerTab.tsx     # PM/designer view
    TechnicianTab.tsx   # technician detail view
    EditableField.tsx   # inline override widget
    ProcessorBadge.tsx  # green/amber/red processor sufficiency badge
    ClientPdfExport.tsx # branded client PDF (two-page)
    TechPdfExport.tsx   # technician material list PDF
    PdfBranding.tsx     # shared Skyline Whitespace brand header/footer
scripts/
  gen-sample-pdf.tsx   # standalone PDF generation script
```

## Deploying to Vercel

The repo includes a `vercel.json` that handles everything automatically.

### First deploy

1. Push this repo (or the branch) to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the GitHub repository.
4. Vercel will auto-detect Vite. Confirm these settings (they match `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Click **Deploy**. No environment variables are required — the app is fully client-side.

### Subsequent deploys

Push to the connected branch and Vercel redeploys automatically. For manual redeploy, click **Redeploy** in the Vercel dashboard.

### Custom domain

In the Vercel project → **Settings → Domains**, add your domain and follow the DNS instructions. The SPA rewrite rule in `vercel.json` ensures all routes serve `index.html` correctly.
