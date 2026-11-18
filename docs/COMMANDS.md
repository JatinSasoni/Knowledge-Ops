# Knowledge Ops: command cheat sheet

Every command you need to run, check and debug the project, with what it does.
Run commands from the repo root (`New_PJ/`) unless a line says `cd backend` or `cd frontend`.

---

## 1. Two ways to run the project

| | **Dev mode** (day to day) | **Everything in Docker** (production-like) |
| --- | --- | --- |
| What runs in Docker | Only the services: Postgres, Redis, storage | Everything: Postgres, Redis, storage, API, worker, web (Nginx) |
| API, worker, frontend | On your PC, from source (`npm run dev`) | Inside containers, compiled |
| Open the app at | http://localhost:5173 | http://localhost:8080 |
| After a code change | Nothing: reloads by itself | Rebuild: `docker compose up -d --build api worker web` |
| Database | `knowledge-ops-db` container (port 5433) | Compose `postgres` container (not published) |
| Use it for | Writing and debugging code | Checking it works the production way before a merge |

The two modes use **different databases**: accounts and workspaces made in one don't exist in the other.

### Every service, its port and its address

| Service | From your PC (dev mode, browser) | From inside Docker (containers) |
| --- | --- | --- |
| Dev Postgres (`knowledge-ops-db`) | `localhost:5433` | not used by compose |
| Compose Postgres | not published | `postgres:5432` |
| Redis | `localhost:6379` (bound to 127.0.0.1 only) | `redis:6379` |
| Storage S3 API (RustFS) | `localhost:9000` | `storage:9000` |
| Storage web console | http://localhost:9001 | — |
| API | `localhost:3000` (dev mode) | `api:3000` |
| Frontend | `localhost:5173` (Vite) | `web:80`, published as `localhost:8080` |

**Rule:** inside a container, `localhost` means *that container itself*. Containers reach each other by
**service name** (`redis`, `storage`, `postgres`, `api`).

---

## 2. One-time setup

```bash
git clone https://github.com/JatinSasoni/Knowledge-Ops.git
cd Knowledge-Ops
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..
```

`npm ci` installs exactly what's in `package-lock.json` (same as CI and Docker).

### The two `.env` files (never committed)

| File | Read by | Contains |
| --- | --- | --- |
| `.env` (repo root) | `docker compose` | Only the **secrets** compose fills in |
| `backend/.env` | `npm run dev`, `npm run dev:worker`, Prisma CLI | Everything the backend needs, with `localhost` addresses |

Copy the examples and fill them in:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Root `.env` keys: `POSTGRES_PASSWORD`, `JWT_SECRET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `OPENAI_API_KEY`.

`backend/.env` keys: `DATABASE_URL` (port **5433**), `JWT_SECRET`, `ACCESS_TOKEN_TTL`,
`REFRESH_TOKEN_TTL_DAYS`, `S3_*` (endpoint `http://localhost:9000`), `REDIS_URL=redis://localhost:6379`,
`OPENAI_API_KEY`, `PORT`, `NODE_ENV`.

- `S3_ACCESS_KEY` / `S3_SECRET_KEY` and `OPENAI_API_KEY` must be **the same in both files**.
- Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Fixed internal addresses (`redis://redis:6379`, `http://storage:9000`) are written directly in
  `docker-compose.yml`, not in `.env`.

---

## 3. Dev mode, day to day

### Start the services (Docker)

```bash
docker start knowledge-ops-db                     # dev Postgres on port 5433
docker compose up -d redis storage storage-init   # queue + file storage (+ bucket/CORS setup)
docker compose ps                                  # redis should say (healthy)
```

- `-d` = detached: runs in the background and gives you the terminal back.
- `storage-init` runs once (creates the `documents` bucket, applies the CORS rule) and exits.
  `docker ps -a` shows it as `Exited (0)`, which means success.
- `docker ps` lists running containers; `docker ps -a` also lists stopped ones.

### Start the app (three terminals)

```bash
# terminal 1: API on http://localhost:3000
cd backend && npm run dev

# terminal 2: worker (processes uploaded documents)
cd backend && npm run dev:worker

# terminal 3: frontend on http://localhost:5173
cd frontend && npm run dev
```

`tsx watch` (API, worker) and Vite (frontend) reload automatically when you save a file.

**Restart the API/worker after changing `.env`**: env files are only read at startup.

### Stop

- `Ctrl+C` in each terminal (the API and worker shut down gracefully).
- Services: `docker compose stop redis storage` and `docker stop knowledge-ops-db`
  (data is kept; start them again with the commands above).

---

## 4. Everything in Docker

```bash
docker compose up --build                  # build images and start everything (logs in this terminal)
docker compose up -d --build               # same, in the background
```

Then open http://localhost:8080. Startup order is handled by `depends_on`:
postgres healthy → `migrate` runs and exits → storage → `storage-init` exits → redis healthy → `api`, `worker` → `web`.

| Command | What it does |
| --- | --- |
| `docker compose ps` | Status of every service (`migrate` and `storage-init` show `Exited (0)` = success) |
| `docker compose logs -f api` | Follow one service's logs (`worker`, `web`, `storage`…) |
| `docker compose logs --tail 50 worker` | Last 50 lines only |
| `docker compose up -d --build api worker` | Rebuild and restart only those services after a code change |
| `docker compose restart worker` | Restart without rebuilding (e.g. after an env change in compose) |
| `docker compose stop` | Stop everything, keep containers and data |
| `docker compose down` | Stop and remove containers, **keep data** (volumes) |
| `docker compose down -v` | Stop, remove containers **and delete all data** (database, files, queue) |
| `docker compose exec api sh` | Open a shell inside a running container |
| `docker compose exec api wget -qO- http://localhost:3000/health` | Health check from inside the API container |
| `docker compose config` | Show the final compose file with `.env` values filled in (find typos here) |
| `docker images` | List images and their sizes |

The API is **not** published to your PC on purpose: everything goes through Nginx (`localhost:8080/api/...`).

---

## 5. Database

### Migrations (backend)

```bash
cd backend
npm run db:migrate -- --name add_something   # create + apply a migration, then regenerate the client
npx prisma migrate status                     # is the database up to date?
npx prisma generate                           # regenerate the client by hand (src/generated/prisma)
```

- `npm run db:migrate` runs `prisma migrate dev`, and the `postdb:migrate` script then runs `prisma generate`
  automatically. Prisma 7 does **not** regenerate the client on its own.
- Extra arguments after `--` go to `prisma migrate dev` only.
- Editing a migration before applying it (e.g. adding `CREATE EXTENSION`):
  `npx prisma migrate dev --create-only --name xyz`, edit the SQL file, then `npm run db:migrate`.
- Never rename or edit a migration folder that has already been applied.
- Docker applies migrations with `prisma migrate deploy` (the `migrate` service): it only runs existing files.

### Look at the data

```bash
cd backend && npm run db:studio      # Prisma Studio in the browser (dev database)
```

SQL shell on the **dev** database:

```bash
docker exec knowledge-ops-db printenv POSTGRES_USER           # find the username once
docker exec -it knowledge-ops-db psql -U <user> -d knowledge_ops
```

SQL shell on the **Docker** database:

```bash
docker compose exec postgres psql -U knowledge -d knowledge_ops
```

In `psql`: `\dt` lists tables, `\d "DocumentChunk"` describes one, `\q` quits.
Table and column names are case-sensitive: always use double quotes (`"Document"`, `"workspaceId"`).

### Useful SQL

```sql
-- Passages of each document, with vector size (should be 1536)
SELECT "documentId", "index", "tokenCount", vector_dims("embedding") AS dims, left("content", 50) AS preview
FROM "DocumentChunk"
ORDER BY "documentId", "index";

-- Documents by status
SELECT "status", count(*) FROM "Document" GROUP BY "status";

-- Most similar passages to passage 0 of a document (cosine similarity)
SELECT "index", left("content", 60) AS preview,
       1 - ("embedding" <=> (SELECT "embedding" FROM "DocumentChunk"
                             WHERE "documentId" = '<doc-id>' AND "index" = 0)) AS similarity
FROM "DocumentChunk"
WHERE "documentId" = '<doc-id>'
ORDER BY similarity DESC;

-- Re-process documents (then click Retry in the UI)
UPDATE "Document" SET "status" = 'FAILED', "error" = 'Needs re-processing' WHERE "status" = 'READY';
```

---

## 6. File storage (RustFS, S3-compatible)

- **Console:** http://localhost:9001, sign in with `S3_ACCESS_KEY` / `S3_SECRET_KEY` from the root `.env`.
  Object Browser → `documents` → one folder per workspace → `<documentId>.<ext>`.
- Files are stored at key `<workspaceId>/<documentId>.<ext>`. On disk (inside the container) that's
  `/data/documents/...`, in the `storagedata` volume. Never edit those files directly; always use the S3 API.

```bash
# Re-run bucket creation + CORS rule (e.g. after editing the CORS line in docker-compose.yml)
docker compose up -d --force-recreate storage-init

# List every object with the AWS CLI (runs inside the Docker network)
docker compose run --rm --no-deps --entrypoint aws storage-init \
  --endpoint-url http://storage:9000 s3 ls s3://documents --recursive

# Show the bucket's CORS rule
docker compose run --rm --no-deps --entrypoint aws storage-init \
  --endpoint-url http://storage:9000 s3api get-bucket-cors --bucket documents

# What's on disk inside the storage container
docker exec new_pj-storage-1 find /data/documents
```

Check CORS the way a browser would (should print `access-control-allow-origin`):

```bash
curl -s -o /dev/null -D - -X OPTIONS "http://localhost:9000/documents/test.txt" \
  -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" | grep -i access-control
```

**Changed the storage keys?** RustFS saves its admin user in the volume on first start, so new keys are ignored.
Recreate the volume (deletes stored files):

```bash
docker compose stop storage
docker compose rm -f storage storage-init
docker volume rm new_pj_storagedata
docker compose up -d storage storage-init
```

The same applies to Postgres: `POSTGRES_PASSWORD` only takes effect when its volume is first created.

---

## 7. Redis and the job queue

```bash
docker compose up -d redis                          # start Redis
docker compose exec redis redis-cli ping            # → PONG
docker compose exec redis redis-cli keys "bull:ingest:*"     # BullMQ's keys for the ingest queue
docker compose exec redis redis-cli llen bull:ingest:wait    # jobs waiting to be picked up
```

- Redis runs with `--appendonly yes`, so queued jobs survive a Redis restart.
- Worker logs show each job: `Job … done` or `Job … attempt 1/3 failed: …`.
- **Worker stopped with Ctrl+C:** it finishes the current job first, then exits.
- **Worker killed hard (terminal closed, crash):** the job's lock expires after ~30 s and another
  (or the restarted) worker picks it up. Nothing is lost.
- Retries: 3 attempts, waiting 5 s then 10 s. Problems with the file itself (scanned PDF, password, damaged)
  skip retries and fail at once with a readable message.

---

## 8. Checks and Git workflow

### Before every commit (both apps)

```bash
cd backend  && npm run format && npm run lint && npm run typecheck && npm run build && cd ..
cd frontend && npm run format && npm run lint && npm run typecheck && npm run build && cd ..
```

| Script | What it does | CI runs it |
| --- | --- | --- |
| `npm run format` | Rewrites files to Prettier style | no (CI runs `format:check`) |
| `npm run format:check` | Fails if any file isn't formatted | yes |
| `npm run lint` / `lint:fix` | ESLint (bans `any`, unused vars…) / fix what it can | yes |
| `npm run typecheck` | TypeScript, no output files | yes |
| `npm run build` | Compiles to `dist/` | yes |

### Branch → PR → merge → sync

```bash
git checkout main && git pull
git checkout -b feat/<short-name>
# ...work...
git add -A
git status                                  # check: no .env, no test files
git commit -m "feat(area): what changed"
git push -u origin feat/<short-name>        # first push of a branch; later just: git push
```

Open the PR on GitHub, wait for CI to go green, **Squash and merge**, then:

```bash
git checkout main && git pull
git branch -D feat/<short-name>             # -D because squash merges don't look "merged" to Git
git fetch --prune                           # forget remote branches deleted on GitHub
```

`main` is protected: no direct pushes, no force pushes, CI must pass.

---

## 9. Troubleshooting (problems already hit, and their fixes)

| Symptom | Cause | Fix |
| --- | --- | --- |
| API returns 500, log says `ECONNREFUSED` on 5433 | Dev database container stopped | `docker start knowledge-ops-db` |
| `Property 'xyz' does not exist` after a migration | Prisma client is stale | `cd backend && npx prisma generate`, then restart the TS server in VS Code |
| Worker/API in Docker: `ECONNREFUSED 127.0.0.1:6379` | `REDIS_URL` points to `localhost` inside a container | In compose use `redis://redis:6379`; keep `localhost` only in `backend/.env` |
| `required variable X is missing a value` from compose | Key missing from the **root** `.env` | Add it there (compose doesn't read `backend/.env`) |
| Upload fails in the browser, console says CORS | Bucket has no CORS rule for that origin | `docker compose up -d --force-recreate storage-init` (origin must be in the rule) |
| Upload 403 `InvalidAccessKeyId` | Keys differ between `.env` files, or storage kept old keys | Make both `.env` files match and restart; if still failing, recreate the storage volume (section 6) |
| Upload URL has `x-amz-checksum-crc32=AAAAAA==` | AWS SDK adds a checksum by default | `requestChecksumCalculation: "WHEN_REQUIRED"` on both S3 clients |
| Document stuck in Processing | Worker not running | Start `npm run dev:worker` (or the `worker` container) |
| Document Ready but no passages | Processed before text extraction existed | Re-process (SQL in section 5, then Retry) |
| Git Bash: `stdin is not a tty` with `node -pe` | Git Bash aliases `node` to `winpty node` | Use `node.exe` instead of `node`, or PowerShell |
| PowerShell: `curl` behaves oddly | `curl` is an alias for `Invoke-WebRequest` | Use `curl.exe` |
| Strange cached pages on localhost:5173 | A service worker from another project on that port | DevTools → Application → Service Workers → Unregister |
| `docker compose` image pull denied (MinIO) | MinIO stopped publishing free images | Project uses RustFS instead (already done) |
| Inside a container `localhost:3000` works but not from the PC | API isn't published on purpose | Go through Nginx: `http://localhost:8080/api/...` |
