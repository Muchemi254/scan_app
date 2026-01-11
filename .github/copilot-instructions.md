# Copilot Instructions for scan_app

## Architecture Overview
**scan_app** is a full-stack receipt scanning and expense categorization platform:
- **Frontend**: React 19 + TypeScript with Vite, Tailwind CSS, React Router
- **Backend**: Python FastAPI processing images with Gemini AI
- **Data**: Firebase (Auth + Firestore) for user data; Google Cloud Storage for images
- **AI**: Google Gemini Vision API for receipt OCR and categorization

### Data Flow
1. **Scanner Flow**: User uploads invoice photos → Frontend batches with `ScannerContext` → Backend processes via Gemini API → Results saved to Firestore + GCS → Dashboard view
2. **Authentication**: Firebase Auth on frontend → User UID used as Firestore document partition
3. **Batch Processing**: Backend uses async `semaphore` for concurrent Gemini requests (max 5), with API key rotation for rate-limit handling

## Key Structural Patterns

### Frontend State Management
- **ScannerContext** ([src/contexts/ScannerContext.tsx](src/contexts/ScannerContext.tsx)): Manages upload state, processing logs, failed images. Persists to localStorage with 30-min session timeout. Use `useScannerContext()` in pages to access/update scan state.
- **AuthContext** ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)): Wraps Firebase auth; `PrivateRoute` component gates authenticated pages.
- **State Convention**: Context stores user-facing state (images, logs, errors); individual pages handle request state.

### Backend Async Processing
- **ImageTask Model** ([backend/models.py](backend/models.py)): Core data model with status enum (queued|processing|completed|failed) and attempt tracking.
- **process_single_task** ([backend/tasks.py](backend/tasks.py)): Async function using `semaphore` to limit concurrency. Handles Gemini API calls, rate-limit retries (HTTP 429), and result persistence.
- **API Key Rotation** ([backend/api_key_manager.py](backend/api_key_manager.py)): Free/paid key pools in `config.py` with daily limits and rate-limit tracking (timestamp).

### Data Validation & Parsing
- **Gemini Response Parsing** ([src/services/gemini.tsx](src/services/gemini.tsx#L42)): `parseGeminiResponse()` normalizes receipt data:
  - Date format: MM/DD/YYYY (validates range; converts from dash-separated)
  - Price sanitization: Removes currency symbols, handles thousand separators
  - Missing field detection: Throws on required fields (date, total, supplier)
  - Backend mirrors this with Pydantic `ReceiptData` model validation

### File Upload & Storage
- **Image Processing**: Frontend converts to base64 data URI with mime-type prefix → sent to backend
- **Storage**: Images uploaded to GCS with path `{user_id}/{image_name}`, URL saved in Firestore document
- **HEIC Support**: `heic2any` library handles iPhone photo conversion (see package.json)

## Development Workflows

### Frontend
```bash
npm run dev          # Vite dev server (HMR enabled)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint validation
```

### Backend
- No explicit npm/pip scripts defined in main setup. Run FastAPI manually: `python backend/main.py` (requires aiohttp, pydantic, google-cloud libraries)
- Requires `.env` with Gemini keys in `backend/config.py`

### Environment Variables
Frontend (`src/firebaseconfig.tsx` → `import.meta.env`):
- `VITE_FIREBASE_*` (6 vars): Firebase config
- `VITE_GEMINI_API_KEY`: Not actually used frontend-side (backend only)

Backend (`backend/config.py`):
- `FREE_KEYS` / `PAID_KEYS`: API key pool with daily limits
- `MAX_CONCURRENT_REQUESTS`: Semaphore limit (default 5)
- `GEMINI_URL`: API endpoint template with `{key}` placeholder

## Critical Integration Points

### Frontend → Backend
- **Endpoint**: `/process_batch` (POST, multipart form-data)
- **Payload**: `batch_id`, `user_id`, `files[]` (UploadFile)
- **Response**: `{results: [{status, image_name, result: ReceiptData | error}]}`
- **Error Handling**: Frontend checks response status; failed images added to `failedImages` array for retry

### Firestore Schema
- Collection: `users/{userId}/receipts`
- Document: Receipt ID
- Fields: `supplier`, `totalAmount`, `taxAmount`, `receiptDate`, `category`, `items[]`, `imageUrl`
- Batch state tracking: `batches/{batchId}` stores processing status per image

### Rate Limiting Strategy
- Backend tracks per-key: `used_today`, `rate_limited_until` (unix timestamp)
- On HTTP 429: Mark key unavailable for 60s, re-queue task
- Tasks retry automatically; frontend shows "processing" status until completion

## Common Tasks & Patterns

- **Adding Receipt Fields**: Update `ReceiptData` interface (frontend + backend), add validation in `parseGeminiResponse()`, map Gemini response fields
- **Changing Concurrency**: Modify `MAX_CONCURRENT_REQUESTS` in `backend/config.py`
- **New Export Format** (PDF/Excel): See [src/services/export.ts](src/services/export.ts) for existing logic; jsPDF and xlsx dependencies already included
- **Dashboard Charts**: [src/pages/DashboardPage.tsx](src/pages/DashboardPage.tsx) uses Chart.js with `react-chartjs-2`; Firestore queries already aggregating by category
- **Mobile Responsive**: Tailwind utility classes; check Layout component for grid breakpoints

## Conventions to Follow
- React: Functional components only; hooks for state/side effects
- TypeScript: Strict null checks (`noImplicitAny: false` but prefer types)
- Async patterns: Frontend uses async/await; backend uses asyncio + semaphores
- Error messages: User-facing strings in component state; console.error for debug logs
- Naming: camelCase for functions/variables; PascalCase for React components and types
