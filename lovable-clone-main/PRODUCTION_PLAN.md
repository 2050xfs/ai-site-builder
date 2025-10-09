# AI Site Builder Production Direction

This plan reflects the updated production strategy outlined in `production_review.md` and our migration away from Claude-specific tooling. The goal is to deliver an AI site builder that relies entirely on OpenAI Codex models, SDKs, and autonomous agents to build, review, and deploy web experiences to live domains.

## 1. Product Principles

- **OpenAI First**: All AI capabilities must use the OpenAI SDK (`openai` package) and approved Codex/4o models. No Anthropics or Claude dependencies remain in the codebase.
- **Operational Readiness**: Every agent workflow must include audit trails, deterministic plans, and deployment checklists that are production friendly.
- **Composable Agents**: Split responsibilities into orchestrator, builder, reviewer, and deployer agents so that each step can be upgraded independently.
- **Human-in-the-Loop**: Provide checkpoints for engineers to validate generation artifacts, security posture, and deployment configuration before production pushes.

## 2. Target Architecture

```
apps/
  lovable-ui/              # Next.js front-end
packages/
  agents/
    orchestrator.ts        # Plans and routes work to other agents
    builder.ts             # Generates code with OpenAI responses API
    reviewer.ts            # Performs QA, lighthouse, security sweeps
    deployer.ts            # Handles CI/CD + domain automation
  core/
    openai-client.ts       # Shared OpenAI client + tracing helpers
    event-bus.ts           # Typed event streaming utilities
scripts/
  deploy-production.ts     # One-click deploy via CI/CD provider
  smoke-test.ts            # Runs post-deploy verification
```

Key integrations:

- **OpenAI Responses API** for code generation, tool use, and conversation memory.
- **Daytona or Vercel sandboxes** for isolated execution (optional, only via OpenAI agents).
- **GitHub Actions** for automated testing, linting, and environment promotion.
- **Provisioned domains** through Vercel/Netlify (automated via API) for live previews and production cutovers.

## 3. Rescaffolding Roadmap

| Phase | Focus | Deliverables |
| --- | --- | --- |
| Phase 0 | Migration cleanup | Remove Claude SDK, add OpenAI client helpers, document new environment variables. |
| Phase 1 | Agent foundation | Implement orchestrator + builder agents with streaming SSE output to the UI. Store artifacts in a build workspace. |
| Phase 2 | QA & deployment | Add reviewer + deployer agents, integrate with CI pipeline, generate preview URLs, and support manual approval. |
| Phase 3 | Production hardening | Observability dashboards, alerting, usage analytics, and blue/green deployment workflow. |

## 4. Agent Behaviors

1. **Orchestrator**
   - Normalize user prompts, estimate scope, and create structured build plans.
   - Select appropriate downstream agents (builder, reviewer, deployer).
   - Emit typed events for UI consumption (status, plan, tool activity, deployment updates).

2. **Builder**
   - Use OpenAI Codex models to produce code modifications, architecture scaffolds, and test suites.
   - Maintain state in a dedicated build directory (local or sandboxed).
   - Record every file change, commands executed, and provide diffs for human review.

3. **Reviewer**
   - Execute linting, tests, performance audits, security scanners.
   - Gate deployment until all checks pass or a human overrides.

4. **Deployer**
   - Package the build, push to GitHub, and trigger CI/CD.
   - Manage preview deployments (staging) and coordinate production releases with rollbacks.

## 5. Deployment & Operations Checklist

- ✅ Infrastructure as Code for preview/staging/production environments.
- ✅ Automated verification scripts (smoke tests, lighthouse, accessibility).
- ✅ Observability hooks (structured logs, metrics, traces) for each agent run.
- ✅ Secrets management via platform vault (no plaintext keys in config).
- ✅ Rollback procedures and production health monitors.

## 6. Upcoming Implementation Tasks

1. Build `packages/core/openai-client.ts` with retry logic, telemetry, and organization-level settings.
2. Replace ad-hoc SSE in the API route with a reusable event bus supporting retries and backpressure.
3. Implement persistent storage (Prisma + Postgres) for job history and generated assets.
4. Create infrastructure scripts for Vercel preview deployments and DNS provisioning.
5. Deliver admin dashboard to review agent runs, diff files, and approve deployments.
6. Add red-team prompts and guardrails to ensure generated sites meet compliance and security baselines.

## 7. Shipping Criteria

- All critical flows (prompt → plan → build → preview → deploy) demonstrably pass in staging.
- OpenAI usage logged with cost breakdown per job.
- Deployment pipeline executes automated verification before domain cutover.
- Documentation updated: runbooks, onboarding, troubleshooting, and compliance notes.
- Post-launch analytics measuring site build success rate, deployment duration, and error categories.

Once these milestones are complete the AI site builder will align with the production review requirements and provide a Claude-free, OpenAI-driven experience from ideation to live deployment.
