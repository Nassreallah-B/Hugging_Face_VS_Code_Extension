# ARIA Agent Ecosystem — Advanced Orchestration

## 1. Vision & Architecture

The ARIA (Admin Runtime Intelligence Assistant) ecosystem is an **Event-Driven Orchestration** model. Instead of a single generalist assistant, it utilizes a core of specialized agents coordinated by a Lead Architect. This ensures high-precision interventions in complex areas like Database Security, RTL UI, and Large-scale Refactoring.

## 2. Specialized Agent Catalog

| Role | Title | Expertise | Step Budget |
| :--- | :--- | :--- | :--- |
| **Architect** | `aria-orchestrator` | Strategy, delegation, and final validation. | 50 rounds |
| **UI/UX** | `rtl-ui-auditor` | Arabic support (RTL), Tailwind, Premium aesthetics. | 30 rounds |
| **Database** | `database-expert` | PostgreSQL, Supabase, RLS, and migration design. | 35 rounds |
| **Security** | `security-sentinel` | OWASP auditing, RLS validation, and secrets scanning. | 30 rounds |
| **Cleanup** | `refactoring-expert` | Technical debt, Clean Code, and SOLID patterns. | 80 rounds |
| **Audit** | `performance-monitor` | Core Web Vitals, performance logs, and error tracking. | 30 rounds |
| **Standard** | `onboarding-expert` | Project conventions and documentation integrity. | 20 rounds |

## 3. The "Always-On" Philosophy

Agents operate under strict operational protocols ensures production safety:

### A. Mandatory Verdicts

Agents specialized in Security and Verification MUST conclude their tasks with one of the following statuses:

- `[VERDICT: PASS]` — Clean bill of health.
- `[VERDICT: FAIL]` — Critical blockers or vulnerabilities detected.
- `[VERDICT: PARTIAL]` — Changes are safe but require non-critical follow-up.

### B. Specialized Step Budgets (Rounds)

Complexity varies by domain. The extension now supports dynamic round limits:

- **Refactoring tasks** are allocated up to **80 rounds** to ensure deep architecture cleanup doesn't get cut short.
- **Orchestration** is allocated **50 rounds** for multi-agent coordination.
- **Standard tasks** remain at the default 6 rounds (configurable).

### C. "Premium" UI Standards

Any agent touching the UI (`General Purpose`, `UI Auditor`) is programmed to enforce CloudZIR premium standards:

- **Typography:** Outfit (Google Fonts).
- **Styling:** Glassmorphism, smooth gradients (HSL based), and vibrant color palettes.
- **RTL Fluidity:** Native support for Arabic (Mirrored layouts) and seamless switching with FR/EN.

## 4. Operational Workflows

### The Trigger Matrix

- **Schema/RLS Changes:** Requires `database-expert` + `security-sentinel`.
- **UI Tweaks:** Requires `rtl-ui-auditor`.
- **Bug Fixes:** Requires `General Purpose` -> `verification`.
- **Large Refactoring:** Handled by `refactoring-expert` after a `Plan` phase.

## 5. Reference Material

Internal agents reference the [lib/aria_blueprint.md](../lib/aria_blueprint.md) for real-time grounding in these rules.
