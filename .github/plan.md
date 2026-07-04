# Plan: Firebase → Cloud SQL + Cloud Run + WebRTC Migration

## TL;DR

Replace Firebase (Auth, Firestore, RTDB, Storage, Functions) with a Cloud Run Node.js backend + Cloud SQL PostgreSQL, using WebRTC data channels for real-time object/connection sync (chat stays on WebSocket), Google Identity Services + custom JWT for auth, and Cloudflare Pages for hosting. Estimated ~4-6 weeks.

## Decisions

- **Database:** Cloud SQL PostgreSQL (db-f1-micro) with pgvector + PgBouncer
- **Real-time sync:** WebRTC data channels (mesh topology, <15 peers) for objects/connections/cells; WebSocket (socket.io) for chat + signaling + presence
- **Auth:** Google Identity Services (GIS) -> custom JWT (24h access + 30d refresh), guest JWTs with separate secret
- **Hosting:** Cloudflare Pages (free tier, unlimited bandwidth, custom domain)
- **Workers:** Cloud Run Job for Puppeteer scanning; most Firebase Functions become Express REST endpoints
- **Storage:** Cloud Storage (same bucket, new signed-URL pattern)
- **Deployment:** Two GitHub Actions workflows -- frontend to Cloudflare Pages, backend Docker to Cloud Run

---

## Phase 1: Provision Cloud SQL + Infrastructure

**Why:** Foundation for everything else -- database, hosting, and CI/CD must exist before code changes begin.

### 1.1 -- Provision Cloud SQL PostgreSQL

```bash
gcloud sql instances create hoverchart-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --edition=enterprise \
  --enable-pgvector \
  --deletion-protection

gcloud sql databases create hoverchart --instance=hoverchart-db

gcloud sql users create hoverchart-api --instance=hoverchart-db --password=<generate>
```

**Enable PgBouncer:**
```bash
gcloud sql instances patch hoverchart-db \
  --database-flags=pgbouncer.enabled=true,pgbouncer.default_pool_size=15
```

**Enable extensions (as postgres superuser):**
```bash
gcloud sql connect hoverchart-db --user=postgres
\c hoverchart
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Additional flags + backups:**
```bash
gcloud sql instances patch hoverchart-db \
  --database-flags=shared_buffers=262144,work_mem=4096

gcloud sql instances patch hoverchart-db \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery \
  --retained-transaction-log-days=7
```

### 1.2 -- Set Up Cloudflare Pages

1. Create Cloudflare account at dash.cloudflare.com (free tier)
2. Add domain (volscape.com): Cloudflare dashboard -> Add site -> follow DNS setup
3. Create Pages project:
   - Workers & Pages -> Pages -> Connect to Git -> select hoverchart repo
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Root directory: (leave blank)
4. Environment variables (Settings -> Environment variables -> Production):
   - `VITE_GOOGLE_CLIENT_ID` = <from Google Cloud Console>
   - `VITE_API_BASE` = <Cloud Run URL>
5. Enable SPA mode: Settings -> SPA -> toggle on
6. Set custom domain: Custom domains -> volscape.com (SSL auto-provisioned)

### 1.3 -- Set Up Secrets in Google Secret Manager

```bash
gcloud services enable secretmanager.googleapis.com

echo -n "postgres://hoverchart-api:<pw>@localhost:5432/hoverchart?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-
echo -n "$(openssl rand -base64 64)" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "$(openssl rand -base64 64)" | gcloud secrets create JWT_REFRESH_SECRET --data-file=-
echo -n "$(openssl rand -base64 64)" | gcloud secrets create JWT_GUEST_SECRET --data-file=-
echo -n "<google-client-id>" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "<github-client-id>" | gcloud secrets create GITHUB_CLIENT_ID --data-file=-
echo -n "<github-client-secret>" | gcloud secrets create GITHUB_CLIENT_SECRET --data-file=-
echo -n "<zen-api-key>" | gcloud secrets create ZEN_API_KEY --data-file=-
echo -n "hoverchart-api-storage" | gcloud secrets create STORAGE_BUCKET --data-file=-
```

### 1.4 -- Create Service Account + IAM

```bash
gcloud iam service-accounts create hoverchart-api-sa \
  --display-name="Hoverchart API Service Account"

gcloud projects add-iam-policy-binding hoverchart \
  --member="serviceAccount:hoverchart-api-sa@hoverchart.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding hoverchart \
  --member="serviceAccount:hoverchart-api-sa@hoverchart.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding hoverchart \
  --member="serviceAccount:hoverchart-api-sa@hoverchart.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud sql instances patch hoverchart-db \
  --service-account=hoverchart-api-sa@hoverchart.iam.gserviceaccount.com
```

### 1.5 -- Install cloud-sql-proxy Locally

```bash
curl -o cloud-sql-proxy.exe https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.x64.exe
cloud-sql-proxy hoverchart:us-central1:hoverchart-db
# Connect at: postgres://hoverchart-api:<pw>@localhost:5432/hoverchart
```

**Files:**
- `scripts/cloud-sql-proxy.exe` -- downloaded binary (gitignore)
- `backend/` directory scaffolding

## Phase 2: Database Schema

**Why:** The Firestore document model flattens into 9 PostgreSQL tables with JSONB for flexible fields.

### Migration 001: Initial Schema

File: `migrations/001_initial.sql`

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT,
  display_name TEXT,
  photo_url   TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  is_public   BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spaces_owner ON spaces(owner_id);

CREATE TABLE spatial_cells (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  x           INTEGER NOT NULL,
  y           INTEGER NOT NULL,
  z           INTEGER NOT NULL,
  bounds      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, id)
);

CREATE TABLE objects (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  cell_id     TEXT NOT NULL,
  cell_x      INTEGER NOT NULL,
  cell_y      INTEGER NOT NULL,
  cell_z      INTEGER NOT NULL,
  position    REAL[] NOT NULL,
  scale       REAL[] DEFAULT '{1,1,1}',
  rotation    REAL[] DEFAULT '{0,0,0}',
  type        TEXT NOT NULL,
  color       TEXT,
  content     TEXT,
  header_text TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, cell_id, id)
);
CREATE INDEX idx_objects_space_cell ON objects(space_id, cell_id);
CREATE INDEX idx_objects_cell_coords ON objects(space_id, cell_x, cell_y, cell_z);

CREATE TABLE connections (
  id          TEXT NOT NULL,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  cell_id     TEXT NOT NULL,
  start_obj   TEXT NOT NULL,
  end_obj     TEXT NOT NULL,
  start_data  JSONB,
  end_data    JSONB,
  line_style  TEXT DEFAULT 'straight',
  color       TEXT DEFAULT '#000000',
  text        TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, cell_id, id)
);
CREATE INDEX idx_connections_space_cell ON connections(space_id, cell_id);

CREATE TABLE chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  space_id    UUID NOT NULL REFERENCES spaces(id),
  user_id     TEXT,
  display_name TEXT,
  photo_url   TEXT,
  text        TEXT NOT NULL,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_space_time ON chat_messages(space_id, timestamp DESC);

CREATE TABLE user_presence (
  space_id    UUID NOT NULL REFERENCES spaces(id),
  user_id     TEXT NOT NULL,
  display_name TEXT,
  photo_url   TEXT,
  is_guest    BOOLEAN DEFAULT false,
  online      BOOLEAN DEFAULT false,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, user_id)
);

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_id      TEXT NOT NULL REFERENCES users(id),
  plan          TEXT DEFAULT 'free',
  member_limit  INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
  org_id      UUID NOT NULL REFERENCES organizations(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  role        TEXT DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE org_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  email       TEXT NOT NULL,
  invited_by  TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_org_invites_email ON org_invites(email, status);

CREATE TABLE updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `migrations/001_initial.sql` -- new

## Phase 3: Build Backend Scaffolding

**Why:** The Express + Socket.IO server is the single binary that replaces all Firebase services.

### Backend Structure

```
backend/
├── Dockerfile
├── cloudbuild.yaml
├── package.json
├── src/
│   ├── index.js              # Entry: HTTP + WS server
│   ├── db.js                 # pg Pool singleton
│   ├── migrate.js            # Run schema migrations on startup
│   ├── auth/
│   │   ├── middleware.js      # JWT verification
│   │   └── handlers.js       # Google, guest, refresh, code handlers
│   ├── api/
│   │   ├── spaces.js
│   │   ├── objects.js
│   │   ├── connections.js
│   │   ├── cells.js
│   │   ├── organizations.js
│   │   ├── storage.js
│   │   └── bulk.js
│   ├── ws/
│   │   ├── index.js          # Socket.IO setup (chat + signaling only)
│   │   ├── chat.js
│   │   └── signaling.js
│   └── workers/
│       └── runtimeScan.js
└── migrations/
    └── 001_initial.sql
```

**Files:**
- `backend/package.json` -- new
- `backend/Dockerfile` -- new
- `backend/cloudbuild.yaml` -- new
- `backend/src/index.js` -- new
- `backend/src/db.js` -- new
- `backend/src/migrate.js` -- new

## Phase 4: Build Auth System

**Why:** Replace Firebase Auth with Google Identity Services (GIS) + custom JWT.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/google` | Exchange Google ID token for JWT |
| `POST /api/auth/guest` | Create short-lived guest JWT |
| `POST /api/auth/refresh` | Exchange refresh token for new access token |
| `GET /api/auth/verify` | Validate JWT, return user payload |
| `POST /api/auth/code` | Exchange URL auth code for JWT |
| `POST /api/auth/github/token` | Exchange GitHub OAuth code for token |

**Files:**
- `backend/src/auth/middleware.js` -- new
- `backend/src/auth/handlers.js` -- new

## Phase 5: Build REST API Endpoints

**Why:** All CRUD operations that previously hit Firestore now go through Express routes backed by PostgreSQL.

### Key Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/spaces?userId=X` | List user's spaces |
| `GET /api/spaces/:id` | Get space by ID |
| `POST /api/spaces` | Create space |
| `DELETE /api/spaces/:id` | Delete space |
| `GET /api/spaces/:id/cells?coords=...` | Get cells by coords |
| `GET /api/spaces/:id/cells/:cellId/objects` | Get objects in cell |
| `POST /api/spaces/:id/cells/:cellId/objects` | Save objects (batch) |
| `DELETE /api/spaces/:id/cells/:cellId/objects/:objId` | Delete object |
| `GET /api/spaces/:id/cells/:cellId/connections` | Get connections |
| `POST /api/spaces/:id/bulk/import` | Bulk import |
| `POST /api/spaces/:id/bulk/delete` | Bulk delete (async) |
| `POST /api/spaces/:id/objects/upsert` | Upsert object position |
| `POST /api/storage/upload-url` | Get signed upload URL |
| `POST /api/storage/download-url` | Get signed download URL |
| `POST /api/admin/runtime-scan` | Start Puppeteer scan |
| `POST /api/zen/chat` | Proxy to Zen API |
| `GET /api/updates` | Admin announcements |
| `GET /api/spaces/:id/chat?before=X&limit=50` | Chat history |

**Files:**
- `backend/src/api/spaces.js` -- new
- `backend/src/api/objects.js` -- new
- `backend/src/api/connections.js` -- new
- `backend/src/api/cells.js` -- new
- `backend/src/api/organizations.js` -- new
- `backend/src/api/storage.js` -- new
- `backend/src/api/bulk.js` -- new

## Phase 6: Build WebSocket + WebRTC Signaling

**Why:** WebSocket handles chat and WebRTC signaling; WebRTC data channels handle object/connection sync.

### WebSocket Events

| Event | Direction | Purpose |
|---|---|---|
| `chat:message` | both | Chat messages (persist + broadcast) |
| `presence:online` | client -> server -> broadcast | User online |
| `presence:offline` | server -> broadcast | User offline |
| `signaling:offer` | relayed | WebRTC SDP offer |
| `signaling:answer` | relayed | WebRTC SDP answer |
| `signaling:ice` | relayed | ICE candidate |
| `signaling:join` | client -> server | Join signaling room |
| `signaling:leave` | client -> server | Leave signaling room |

**Files:**
- `backend/src/ws/index.js` -- new
- `backend/src/ws/chat.js` -- new
- `backend/src/ws/signaling.js` -- new

## Phase 7: Build Frontend API Client + WebRTC Mesh

**Why:** Replace all Firebase client SDK calls with REST + WebSocket + WebRTC data channels.

### New Files

| File | Purpose |
|---|---|
| `src/api-client.js` | HTTP client with JWT auth, replaces `firebase.js` |
| `src/services/spaceDataChannel.js` | WebRTC data channel mesh manager |
| `src/services/spaceSignalingClient.js` | WS-based signaling for WebRTC |

### Rewritten Files

| File | Old Pattern | New Pattern |
|---|---|---|
| `src/stores/authStore.js` | Firebase onAuthStateChanged | JWT stored in localStorage, GIS popup |
| `src/services/authService.js` | Firebase signInWithRedirect | GIS + API calls |
| `src/services/spacesService.js` | Firestore getDoc/getDocs | api.get() |
| `src/services/spatialObjectsService.js` | Firestore onSnapshot | WebRTC objects:update + REST |
| `src/services/connectionsService.js` | Firestore onSnapshot | WebRTC connections:update + REST |
| `src/services/spatialPartitioning.js` | Firestore onSnapshot | WebRTC cell:loaded/unloaded + REST |
| `src/services/presenceService.js` | RTDB ref/set/onDisconnect | WebSocket presence:* |
| `src/services/storageService.js` | uploadBytesResumable | Signed URL upload |
| `src/services/webRservice.js` | Firestore signaling docs | WS signaling relay |
| `src/services/organizationService.js` | Firestore CRUD | api.get/post/put |
| `src/services/sharedSpacesService.js` | Firestore queries | api.get (server handles sharing) |
| `src/services/sharingService.js` | Firestore | api.post |
| `src/services/githubRepoService.js` | httpsCallable | api.post |
| `src/services/runtimeScanService.js` | auth.currentUser.getIdToken | api.getToken |
| `src/components/SpaceChat.jsx` | RTDB ref/push/onValue | WebSocket chat:* |
| `src/landing/LandingApp.jsx` | onAuthStateChanged | useAuthStore |
| `src/landing/sharedSpacesService.js` | Firestore | api.get |
| `src/utils/textureLoader.js` | Firebase getStorage/ref/getBlob | Signed URL download |
| `src/utils/objectUpdateHandlers.js` | httpsCallable | api.post |
| `src/stores/connectionStore.js` | Firestore imports | Remove Firebase imports |
| `src/stores/spaceManagerStore.js` | Firestore doc/getDoc | api.get |
| `src/services/pipelineTaskService.js` | Firestore doc/getDoc | api.get |
| `src/services/markdownDiagram/connectionMethods.js` | auth import | api import |

### Deleted Files

- `src/firebase.js`
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `firestore.indexes.json`
- `database.rules.json`
- `storage.rules`
- `cors.json`
- `functions/` (entire directory)

## Phase 8: Package.json + Build Config Changes

**Why:** Remove Firebase SDK entirely from the frontend bundle.

### package.json Changes

**Remove:** `"firebase": "^11.0.1"`
**Remove overrides:** `@grpc/grpc-js`, `immutable`
**Add:** `"socket.io-client": "^4.8.0"`

### vite.config.js Changes

**Remove from manualChunks:**
```js
'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
```
**Remove:**
```js
define: { global: 'globalThis' },
```

### .env Changes

**Before (6 vars):** VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID

**After (2 vars):** VITE_GOOGLE_CLIENT_ID, VITE_API_BASE

## Phase 9: Data Export/Import Scripts

**Why:** Migrate existing Firestore + RTDB data to PostgreSQL.

**Files:**
- `scripts/export-firestore.js` -- dump all Firestore collections to JSON
- `scripts/export-rtdb.js` -- dump RTDB chat + presence to JSON
- `scripts/import-to-postgres.js` -- read exported JSON, insert into PostgreSQL

## Phase 10: Cutover

### Checklist

- [ ] Run final Firestore + RTDB export
- [ ] Run import script against Cloud SQL
- [ ] Verify PgBouncer pool size (15)
- [ ] Deploy Cloud Run service
- [ ] Verify API health: GET /api/health -> { "status": "ok", "db": "connected" }
- [ ] Deploy frontend (push to main -> Cloudflare Pages auto-builds)
- [ ] Verify auth: Google sign-in -> JWT -> API calls succeed
- [ ] Verify WebSocket: browser console shows WS connected
- [ ] Verify WebRTC mesh: 2 tabs -> data channels established
- [ ] Verify object sync: move object tab A -> appears tab B
- [ ] Verify chat: send message tab A -> appears tab B
- [ ] Verify persistence: refresh -> object still in correct position
- [ ] Verify guest access: incognito -> "Try without account" -> works
- [ ] Keep Firebase project up for 1 week as rollback
- [ ] After 1 week: disable Firebase project, revoke API keys

## Verification

- All REST endpoints return 200/201 for valid input, 401 for missing/invalid JWT
- WebSocket connection establishes with valid JWT, rejects with invalid JWT
- WebRTC data channel opens between 2 tabs in same space
- Object moved in tab A appears in tab B within <200ms
- Chat message sent in tab A appears in tab B within <50ms
- Guest user can view space, send chat, move objects
- Page refresh restores auth state (localStorage JWT)
- Bulk import of 1000 objects + 500 connections completes in <30s
- Puppeteer runtime scan returns valid Merfolk markdown
- Cloud Run scales to 0 when idle, starts within 2s
- All Firebase packages removed from bundle -- `npm run build` completes without errors
- `npm run lint` passes with no Firebase-related warnings
- Firebase config files deleted: firebase.json, firestore.rules, database.rules.json, .firebaserc, cors.json, storage.rules, functions/
- Only TWO env vars required: VITE_API_BASE and VITE_GOOGLE_CLIENT_ID
