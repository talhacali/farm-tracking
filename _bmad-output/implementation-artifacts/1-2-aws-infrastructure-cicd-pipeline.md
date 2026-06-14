---
baseline_commit: NO_VCS
---

# Story 1.2: AWS Infrastructure & CI/CD Pipeline

Status: review

## Story

As a developer,
I want the AWS infrastructure provisioned and the CI/CD pipeline active,
So that the application can be deployed and PRs are validated automatically.

## Acceptance Criteria

1. **Dockerfile**: Given the Dockerfile is present at the project root — When `docker build -t farm-tracking .` is run — Then the image builds successfully and `docker run -p 3000:3000` starts the Next.js server on port 3000.

2. **AWS Infrastructure**: Given AWS infrastructure is set up — Then the following resources exist and are referenced in `.env.example`: ECS Fargate cluster + service, RDS PostgreSQL instance in a private VPC subnet, S3 bucket for thermal images, CloudFront distribution fronting S3, SES domain verification, AWS Secrets Manager secrets for `DATABASE_URL`, `AUTH_SECRET`, `S3_BUCKET_NAME`, `S3_REGION`, `SES_FROM_ADDRESS`, `SENTRY_DSN`.

3. **CI Workflow**: Given a PR is opened against `main` — When the GitHub Actions CI workflow (`ci.yml`) runs — Then `tsc --noEmit`, `eslint`, and unit tests all pass; a failed check blocks merge.

4. **Deploy Workflow**: Given a commit lands on `main` — When the GitHub Actions deploy workflow (`deploy.yml`) runs — Then a Docker image is built, pushed to AWS ECR, and the ECS Fargate service is updated with a rolling deployment; all secrets are sourced from GitHub Actions secrets — nothing is hardcoded.

5. **Env Example**: Given a developer clones the repo — Then `.env.example` lists every required environment variable with a description; `.env.local` is present in `.gitignore`.

## Tasks / Subtasks

- [x] Task 1: Create production Dockerfile and next.config.js standalone output (AC: 1)
  - [x] Add `output: 'standalone'` to `next.config.js` config object
  - [x] Create `.dockerignore` at project root
  - [x] Create multi-stage `Dockerfile` at project root (deps → builder → runner)
  - [x] Write config test asserting Dockerfile exists and `next.config.js` contains `standalone`
  - [x] Run `npm run typecheck` — exits 0 after next.config.js change

- [x] Task 2: Create GitHub Actions CI workflow (AC: 3)
  - [x] Create `.github/workflows/ci.yml` — runs on PRs to `main`
  - [x] CI job: `npm ci`, `SKIP_ENV_VALIDATION=true npm run typecheck`, `SKIP_ENV_VALIDATION=true npm run lint`, `npm test`
  - [x] Write config test asserting `.github/workflows/ci.yml` exists and contains required commands

- [x] Task 3: Create GitHub Actions Deploy workflow (AC: 4)
  - [x] Create `.github/workflows/deploy.yml` — runs on push to `main`
  - [x] Deploy job: configure AWS credentials (OIDC), ECR login, docker build + push, ECS service update
  - [x] All AWS values sourced from GitHub Actions secrets — no hardcoded values
  - [x] Write config test asserting `.github/workflows/deploy.yml` exists and references `secrets.`

- [x] Task 4: AWS infrastructure provisioning runbook (AC: 2)
  - [x] Create `docs/aws-setup.md` documenting every required AWS resource with provisioning steps
  - [x] Document required GitHub Actions secrets and how to populate them from Secrets Manager
  - [x] Verify `.env.example` already contains all required variables (already done in Story 1.1)

- [x] Task 5: Run full test suite and validate (AC: 1, 3, 5)
  - [x] Run `npm test` — all tests pass (52/52: 35 from Story 1.1 + 17 new infrastructure tests)
  - [x] Run `SKIP_ENV_VALIDATION=true npm run typecheck` — exits 0
  - [x] Run `SKIP_ENV_VALIDATION=true npm run lint` — exits 0

## Dev Notes

### Critical: `output: 'standalone'` in next.config.js

**This is the most important change in this story.** Without it, `docker run node server.js` fails — Next.js standalone mode bundles the server into `.next/standalone/server.js` with its own `node_modules`.

`next.config.js` is at the project root (not `.ts` — T3 v7.40.0 generates `.js`). It uses ESM (`"type": "module"` in package.json):

```javascript
import "./src/env.js";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",     // ← ADD THIS LINE
};

export default withSentryConfig(config, {
  silent: !process.env.CI,
  disableLogger: true,
});
```

The T3 comment above the import says "Run build with `SKIP_ENV_VALIDATION` to skip env validation — useful for Docker builds." This is accurate — the Docker builder stage must set `ENV SKIP_ENV_VALIDATION=true`.

### Dockerfile — Multi-Stage Build

Use the official Next.js multi-stage pattern. Node 20 Alpine for small image size. The `runner` stage copies from `.next/standalone/` and `.next/static/`.

```dockerfile
FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production runtime
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### .dockerignore

Exclude everything that should not be in the build context. This speeds up `docker build` and prevents secrets from leaking:

```
.env
.env.*
.env.local
node_modules
.next
.git
.github
*.md
tests/
docs/
_bmad-output/
drizzle/
playwright.config.ts
```

### SKIP_ENV_VALIDATION — Critical for CI and Docker

`src/env.js` (generated by T3) validates all required environment variables at module load time using `@t3-oss/env-nextjs`. This causes `next build` to fail in CI and Docker when real secrets are not present.

**Solution (already established in Story 1.1):** Set `SKIP_ENV_VALIDATION=true` in:
- Docker builder stage (`ENV SKIP_ENV_VALIDATION=true` in Dockerfile)
- CI typecheck and lint steps (`SKIP_ENV_VALIDATION=true npm run typecheck`)
- CI lint step (`SKIP_ENV_VALIDATION=true npm run lint`)
- The CI build step (`SKIP_ENV_VALIDATION=true npm run build`) if you add a build verification step

`npm test` (vitest) does NOT need this flag — tests don't trigger Next.js build.

### GitHub Actions: CI Workflow (ci.yml)

Runs on every PR to `main`. Must block merge on failure.

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Type-check, Lint, Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type-check
        run: SKIP_ENV_VALIDATION=true npm run typecheck

      - name: Lint
        run: SKIP_ENV_VALIDATION=true npm run lint

      - name: Test
        run: npm test
```

The `npm test` script (added in Story 1.1) runs `vitest run`. No extra flags needed.

### GitHub Actions: Deploy Workflow (deploy.yml)

Runs on push to `main`. Uses AWS OIDC (no long-lived access key secrets). The OIDC IAM role ARN is stored as a GitHub secret.

```yaml
name: Deploy

on:
  push:
    branches: [main]

env:
  AWS_REGION: ${{ vars.AWS_REGION }}
  ECR_REPOSITORY: farm-tracking
  ECS_CLUSTER: farm-tracking-cluster
  ECS_SERVICE: farm-tracking-service
  CONTAINER_NAME: farm-tracking

jobs:
  deploy:
    name: Build & Deploy to ECS
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # Required for OIDC
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition farm-tracking \
            --query taskDefinition \
            > task-definition.json

      - name: Update ECS task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

**GitHub Actions Secrets required** (set in repo Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::<account>:role/farm-tracking-github-actions` |
| `AWS_REGION` (can be a Repo Variable instead) | `us-east-1` |

**Nothing else is hardcoded** — ECR URL is resolved at runtime by the ECR login step.

### AWS Infrastructure Overview

The following resources must be manually provisioned before deploying. Create `docs/aws-setup.md` as a provisioning runbook.

| Resource | Details |
|---|---|
| **ECR Repository** | `farm-tracking` — stores Docker images |
| **ECS Cluster** | `farm-tracking-cluster` (Fargate) |
| **ECS Task Definition** | `farm-tracking` — single container, 512 CPU / 1024 MB memory; all secrets injected from Secrets Manager as env vars |
| **ECS Service** | `farm-tracking-service` — rolling deploy, min 100% / max 200% |
| **RDS PostgreSQL** | Private VPC subnet, `db.t4g.micro` for MVP, `farm_tracking` database |
| **S3 Bucket** | `<bucket-name>` in `us-east-1` — private, no public access, lifecycle rule for scan images |
| **CloudFront Distribution** | Origin: S3 with OAC (Origin Access Control); used for presigned URL delivery |
| **SES** | Verify sender domain; production mode (not sandbox) |
| **Secrets Manager** | Secrets: `farm-tracking/DATABASE_URL`, `farm-tracking/AUTH_SECRET`, `farm-tracking/S3_BUCKET_NAME`, `farm-tracking/S3_REGION`, `farm-tracking/CLOUDFRONT_DOMAIN`, `farm-tracking/SES_FROM_ADDRESS`, `farm-tracking/SENTRY_DSN` |
| **IAM Role (ECS Task)** | Permissions: `s3:PutObject`, `s3:GetObject` on scan bucket; `ses:SendEmail`; `secretsmanager:GetSecretValue` |
| **IAM Role (GitHub Actions OIDC)** | Trust policy: `token.actions.githubusercontent.com` for the repo; permissions: `ecr:*`, `ecs:*`, `iam:PassRole` (scoped to ECS task role) |

The ECS task definition injects secrets from Secrets Manager using the `secrets` block (not environment variables directly):
```json
{
  "secrets": [
    { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:...:farm-tracking/DATABASE_URL" },
    { "name": "AUTH_SECRET", "valueFrom": "arn:aws:secretsmanager:...:farm-tracking/AUTH_SECRET" }
  ]
}
```

### .env.example — Already Complete from Story 1.1

The `.env.example` created in Story 1.1 already covers all required variables:
`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`, `CLOUDFRONT_DOMAIN`, `SES_FROM_ADDRESS`, `SENTRY_DSN`.

**Do NOT recreate or overwrite `.env.example`** — it is already correct.

For AC-5 verification: `.env.local` is covered by the `.env*.local` pattern in `.gitignore` (verified in Story 1.1).

### Testing Approach

These are **configuration existence tests** — same pattern as Story 1.1's `tests/config/` files.

Create `tests/config/infrastructure.test.ts`:

```typescript
import { existsSync, readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("Dockerfile (AC-1)", () => {
  it("Dockerfile exists at project root", () => {
    expect(existsSync("Dockerfile")).toBe(true);
  });
  it("Dockerfile exposes port 3000", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("EXPOSE 3000");
  });
  it("Dockerfile uses multi-stage build with runner stage", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("AS runner");
  });
  it("Dockerfile runs as non-root user", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("USER nextjs");
  });
  it("Dockerfile sets SKIP_ENV_VALIDATION in builder stage", () => {
    const content = readFileSync("Dockerfile", "utf-8");
    expect(content).toContain("SKIP_ENV_VALIDATION=true");
  });
});

describe("next.config.js standalone output (AC-1)", () => {
  it("next.config.js contains output: standalone", () => {
    const content = readFileSync("next.config.js", "utf-8");
    expect(content).toContain("standalone");
  });
});

describe("GitHub Actions CI workflow (AC-3)", () => {
  it(".github/workflows/ci.yml exists", () => {
    expect(existsSync(".github/workflows/ci.yml")).toBe(true);
  });
  it("ci.yml triggers on pull_request to main", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("pull_request");
    expect(content).toContain("main");
  });
  it("ci.yml runs typecheck with SKIP_ENV_VALIDATION", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("SKIP_ENV_VALIDATION");
    expect(content).toContain("typecheck");
  });
  it("ci.yml runs lint", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toContain("lint");
  });
  it("ci.yml runs tests", () => {
    const content = readFileSync(".github/workflows/ci.yml", "utf-8");
    expect(content).toMatch(/npm (run )?test/);
  });
});

describe("GitHub Actions Deploy workflow (AC-4)", () => {
  it(".github/workflows/deploy.yml exists", () => {
    expect(existsSync(".github/workflows/deploy.yml")).toBe(true);
  });
  it("deploy.yml triggers on push to main", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("push");
    expect(content).toContain("main");
  });
  it("deploy.yml uses GitHub secrets (no hardcoded values)", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("secrets.");
    // Must not contain actual AWS account IDs or ARN patterns with real account numbers
    expect(content).not.toMatch(/arn:aws:iam::\d{12}:/);
  });
  it("deploy.yml pushes to ECR", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("ecr");
  });
  it("deploy.yml deploys to ECS", () => {
    const content = readFileSync(".github/workflows/deploy.yml", "utf-8");
    expect(content).toContain("ecs");
  });
});

describe("AWS setup documentation (AC-2)", () => {
  it("docs/aws-setup.md exists", () => {
    expect(existsSync("docs/aws-setup.md")).toBe(true);
  });
});
```

### Critical Learnings from Story 1.1 (Do Not Repeat These Mistakes)

- **`next.config.js` is `.js` not `.ts`** — T3 v7.40.0 generates a `.js` config with ESM `import` syntax. Do not rename to `.ts`.
- **`SKIP_ENV_VALIDATION=true` is required** for all build, typecheck, and lint commands in environments without real secrets.
- **No git repository** — `git` commands will fail. Do not attempt `git rev-parse HEAD`. `baseline_commit: NO_VCS`.
- **`src/styles/globals.css`** not `src/app/globals.css` — T3 v7.40.0 puts globals.css under `src/styles/`.
- **`playwright.config.ts` excluded from tsconfig** — `@playwright/test` is not installed.
- **Vitest 4.1.8** — `npm test` runs `vitest run`. Tests are in `tests/config/`.

### Scope Boundary (Do NOT Implement in This Story)

- Do NOT provision actual AWS resources — create the runbook and workflow files only
- Do NOT add Terraform or CDK scripts (no IaC tool is specified in the architecture)
- Do NOT run `docker build` (requires Docker daemon — just verify Dockerfile content via tests)
- Do NOT modify any `src/` files beyond `next.config.js`
- Do NOT modify `src/env.js` — do not add/remove env var validations
- Do NOT add pg-boss worker start to the container entrypoint — that is done in Story 1.3+ when the DB schema exists
- Story 1.3 handles database setup (`drizzle-kit migrate`); this story does NOT run migrations

### References

- [Source: architecture.md — Starter Template Evaluation] — T3 init commands, Next.js + Docker
- [Source: architecture.md — Infrastructure & Deployment] — GitHub Actions → ECR → ECS, Secrets Manager, ECS Fargate
- [Source: architecture.md — Complete Project Directory Structure] — `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `Dockerfile`
- [Source: architecture.md — Monitoring] — CloudWatch + Sentry
- [Source: epics.md — Story 1.2 ACs] — Dockerfile, AWS resources, CI workflow, deploy workflow
- [Source: Story 1.1 Completion Notes] — `next.config.js` is `.js`, `SKIP_ENV_VALIDATION`, no VCS

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers. All 5 tasks implemented in a single pass.

### Completion Notes List

- All 5 tasks complete; 52/52 tests pass (`npm test`) — 17 new + 35 from Story 1.1
- `SKIP_ENV_VALIDATION=true npm run typecheck` exits 0; `npm run lint` exits 0
- `next.config.js` updated with `output: "standalone"` — required for Docker standalone server build
- Multi-stage Dockerfile uses `SKIP_ENV_VALIDATION=true` in builder stage to bypass T3 env validation during `npm run build`
- GitHub Actions workflows use OIDC for AWS auth (no long-lived secret keys stored in GitHub)
- `docs/aws-setup.md` documents all 11 provisioning steps including ECS task definition JSON with Secrets Manager injection
- `.env.example` was already complete from Story 1.1 — not modified
- AC-2 (AWS resources "exist") is satisfied by the runbook + workflow files; actual provisioning requires the dev to follow `docs/aws-setup.md`
- **NOTE: No GitHub repository exists yet** — AC-3 and AC-4 (CI/CD pipeline triggering on PRs/main) cannot be live-verified until the repo is created and code is pushed. The workflow files are correctly authored and will activate on first push. This story is considered `review` pending repo creation.

### File List

**Created:**
- `Dockerfile` — multi-stage Next.js production build (deps → builder → runner)
- `.dockerignore` — excludes .env, node_modules, .next, .git, tests, docs, _bmad-output
- `.github/workflows/ci.yml` — PR pipeline: typecheck + lint + test
- `.github/workflows/deploy.yml` — main deploy: OIDC auth → ECR push → ECS rolling update
- `docs/aws-setup.md` — 11-step AWS infrastructure provisioning runbook
- `tests/config/infrastructure.test.ts` — 17 config existence/content tests

**Modified:**
- `next.config.js` — added `output: "standalone"` to config object

### Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-06-14 | Added `output: "standalone"` to next.config.js | Required for Next.js Docker standalone build |
| 2026-06-14 | GitHub Actions uses OIDC not access key secrets | Safer than long-lived credentials; no key rotation needed |
