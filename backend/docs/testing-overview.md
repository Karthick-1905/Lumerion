# Testing Overview

_Last updated: 2025-10-21_

This document captures the current automated test coverage for the backend service, explains how to execute the suites, and outlines priority gaps and next steps for additional testing.

---

## ✅ Current Test Coverage

| Area | Test Suite | Focus |
| --- | --- | --- |
| Integration | `tests/integration/health-check.test.ts` | Verifies the Express app starts, HTTP middleware wiring, and `/api/health-check` responds with a success payload. Roadmap graph dependencies are mocked to keep the check lightweight. |
| Agents | `tests/agents/contextBootstrapNode.test.ts` | Exercises the roadmap context bootstrap node end-to-end: prompt assembly, Gemini model wiring, learner profile fetches, and error handling around user profile tool failures. |
| Controllers – Auth | `tests/controllers/authController.test.ts` | Covers registration, login/logout, verification, password reset flows, session cookie handling, and SMTP/mailer side effects via mocks. |
| Controllers – User | `tests/controllers/userController.test.ts` | Validates notification aggregation (friend requests + study group invites), permission checks, and user search filtering/validation. |
| Controllers – Roadmap | `tests/controllers/roadmapController.test.ts` | Exercises roadmap generation success/error paths, snapshot persistence (modules, dependencies, progress), learning-path visibility updates, and public listing pagination. |
| Controllers – Friends | `tests/controllers/friendController.test.ts` | Covers friend request submission, listing w/ pagination, acceptance (transactional friendship creation), decline, friend list retrieval, and bilateral removal; mailer notifications are mocked. |
| Controllers – Study Groups | `tests/controllers/studygroupController.test.ts` | Covers group creation (owner + invite flows), group listing, detailed retrieval, member invitations/additions, invitation acceptance, and roster listing with authorization checks; invite/admin mailers are mocked. |

### Shared Test Utilities

- `tests/utils/express.ts` supplies controller-safe request/response doubles with `status`, `json`, `cookie`, and `send` tracking.
- `tests/utils/drizzleMock.ts` offers a configurable in-memory Drizzle ORM façade (select/insert/update/delete queues, transactions) that now supports chained `update().where().returning(...)` patterns used across controllers.
- Mailer and auth/session helpers (`tests/mocks`) centralize external side effects so suites remain deterministic.

### Execution Status

- CI/local command: `npm test`
- Current test count: 64 tests across 7 suites (all passing as of this update).

---

## 📋 Coverage Highlights

- **Error handling verified:** Roadmap generation errors, missing session cookies, absent roadmap snapshots, invalid friend actions, and unauthorized study-group access return appropriate HTTP codes/messages.
- **Transactional logic covered:** Roadmap persistence, friend acceptance, and study-group creation/acceptance write paths are exercised using the mock transaction harness.
- **Mailer integration mocked:** Auth, friend, and study-group mailers are intercepted to confirm payload composition without sending emails.
- **Agent graph integration:** The context bootstrap node test ensures prompt → model → schema pipeline consistency and learner profile normalization.
- **App boot smoke test:** Health-check suite ensures Express middleware and routing stack load without hitting real infrastructure.

---

## 🚧 Gaps & Recommended Next Steps

| Priority | Area | Gap | Recommendation |
| --- | --- | --- | --- |
| High | Study-group controller | `listUserStudyGroups`, `updateStudyGroupMember`, and `removeStudyGroupMember` lack automated coverage, especially around role transitions, owner preservation, and removal safeguards. | Add focused controller tests mirroring real membership edge cases (self-updates, owner demotion prevention, admin vs. moderator permissions). |
| High | Friend controller | Negative paths (duplicate requests, existing friendship, unauthorized decline) are partly handled by code but lack dedicated tests. | Extend the suite with tests for conflict/unauthorized branches to guard regressions. |
| High | Auth utilities | `src/utils/authUtils.ts` houses session creation/validation and token helpers with no direct unit tests. | Introduce unit tests for salt/hash generation, session duration parsing, and redis client interactions (using dependency injection or mocks). |
| Medium | Middleware | `middleware/authProvider.ts` behaviour (cookie parsing, session lookup, user injection) is currently only indirectly exercised. | Add lightweight middleware tests with mocked requests/responses and stubbed auth utils. |
| Medium | Roadmap agents | Only the context bootstrap node is covered; other nodes/tools (reflection loop, graph orchestration) remain untested. | Implement module-level unit tests with mocked LangGraph runners to ensure state transitions and guardrails behave as expected. |
| Medium | Cron/utility jobs | `utils/cronjob.ts`, Redis utilities, and mailer verifications have no coverage. | Create unit tests (or integration tests with lightweight fakes) validating scheduling, retry logic, and redis failover behaviour. |
| Medium | Routes | Router wiring (`routes/*`) isn’t validated beyond health check. | Add supertest-based integration tests per router to ensure auth middleware, validation, and happy paths work together. |
| Low | Frontend contracts | Frontend API client hooks rely on backend schemas but have no contract tests to detect drift. | Consider contract or schema snapshot tests once API stabilizes. |
| Low | Performance/Load | No load, concurrency, or long-running scenario tests. | Schedule future k6/Gatling or integration load tests post-feature freeze. |

---

## 🧪 Suggested Roadmap

1. **Seal controller edges** (study-group + friend negative cases) – keeps REST API behaviour stable.
2. **Backfill middleware + auth utils** – reduces risk around authentication/session management.
3. **Agent graph expansion** – particularly the reflective/loop nodes before shipping roadmap automation broadly.
4. **Integration matrices** – add end-to-end tests for representative flows (e.g., create roadmap → publish learning path → create study group) once data fixtures are available.

---

## ▶️ Running the Test Suite

```bash
npm install
npm test
```

- Uses `NODE_OPTIONS=--experimental-vm-modules jest` (configured in `package.json`).
- Ensure Redis/Postgres dependent modules are mocked (already handled in the current suites).
- For focused runs, append a pattern (e.g., `npm test -- friendController`).

---

## 📎 References

- Source of truth for mocks/utilities: `tests/utils/` and `tests/mocks/`
- Controllers under test: `src/controller/`
- Agent implementation details: `src/agents/roadmapGenerator/`

---

Feel free to append additional suites or update this document as coverage evolves.
