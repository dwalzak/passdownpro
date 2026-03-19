# PassdownPro — Project Context for Claude

## What This App Is
PassdownPro is a SaaS web application for manufacturing plant supervisors and managers. It replaces the common practice of emailing Word documents or handwritten shift reports with a structured digital form that auto-generates formatted PDF reports and surfaces trend data on a dashboard.

**Domain**: passdownpro.app
**Target User**: Plant floor supervisors, shift leads, and plant managers at small-to-mid-size manufacturing facilities.
**Core Pain Point**: Shift handoffs are messy, inconsistent, and untracked. Managers want a fast, structured way to log what happened and see patterns over time.

---

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth)
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Vercel
- **Auth**: Supabase Auth — email/password, magic link, Microsoft 365 (Azure AD OAuth), Google OAuth
- **Email**: Nodemailer via Microsoft 365 Exchange SMTP
- **Billing**: Stripe Subscriptions (Stripe Billing, not Checkout)

---

## Core Features (MVP)

### 1. Shift Report Form
Fields to capture per shift:
- Date, Shift (Day / Evening / Night), Supervisor Name
- Production Count (units produced vs. target)
- Downtime Events (machine, duration, reason)
- Safety Incidents (count, brief description)
- Quality Issues (reject count, description)
- Maintenance Requests (equipment dropdown — per-plant list, priority, description)
- Open Notes / Handoff Notes

### 2. Per-Plant Equipment Lists
- Each plant has its own equipment list stored in the `equipment` table
- Plant admins manage equipment via Settings UI (add/edit/delete) or CSV import
- Maintenance request form pulls only that plant's equipment
- Maintenance contacts are also configurable per plant (who gets emailed)

### 3. Email Notifications
- On report submit, if maintenance requests exist, fire emails via Nodemailer + M365 SMTP
- One email per maintenance request (or digest — TBD) to plant's maintenance contact(s)
- Triggered via Next.js Server Action

### 4. PDF Report Generation
- On submit, generate a clean formatted PDF via @react-pdf/renderer
- Include plant name/logo, shift summary, all form fields
- Downloadable on submit; Pro+ tier also gets it auto-emailed to manager

### 5. Dashboard
- List of recent reports with quick stats
- Trend charts: production vs. target over time, downtime frequency, safety incident count
- Filter by date range and shift type
- History depth gated by subscription tier

### 6. Multi-Tenant / Plant Setup
- Each account belongs to a "plant"
- Supervisors are invited by the plant admin
- Plant admin can configure: plant name, logo, shift names, production targets, equipment list, maintenance contacts

---

## Monetization Model
- **Free Tier**: 1 plant, up to 3 users, last 30 days of reports
- **Pro Tier ($49/mo)**: Unlimited users, 1 year history, PDF email delivery, CSV export
- **Enterprise ($149/mo)**: Multiple plants, custom branding, API access

Stripe Billing for subscriptions. Developer already has a Stripe account. No usage-based pricing.

---

## Auth Providers (all via Supabase Auth)
1. Email + password
2. Magic link (passwordless email — free via M365 SMTP)
3. Microsoft 365 / Azure AD (OAuth — register app in Azure portal)
4. Google OAuth (register app in Google Cloud Console)

---

## Design Direction
- Industrial/utilitarian aesthetic — plant floor tool, not a startup landing page
- Dark mode always on, amber/orange accent (#f59e0b) — feels like factory warning lights
- Clean data-dense layouts — supervisors want info fast
- Mobile-friendly form (tablet or phone on the floor)
- Dev server runs on port 3001

---

## File/Folder Conventions
- Use `/app` directory (Next.js App Router)
- Components in `/components`, UI primitives in `/components/ui`
- Supabase client in `/lib/supabase.ts`
- Types in `/types` (`index.ts` for app types, `database.ts` for Supabase generated types)
- DB migrations in `/supabase/migrations`
- Keep server components and client components clearly separated (`'use client'` only where needed)
- Use `.env.local` for all secrets (never hardcode)

---

## Developer Context
- Windows 11, uses Visual Studio and Xcode
- 10+ years SQL experience, manufacturing operations background
- Familiar with Next.js, Vercel, and Supabase from prior projects
- Prefers clean, readable code with comments on non-obvious logic
- Avoid over-engineering — MVP first, iterate based on user feedback
- Prior SaaS: axiombi.app (BI platform on Next.js/Vercel/Supabase) — reuse patterns where sensible

---

## Build Order (Roadmap)
1. ✅ Scaffold Next.js + Tailwind + Supabase config
2. ✅ Shift report form (mobile-friendly, dark/amber theme)
3. ✅ Rename ShiftSync → PassdownPro
4. ⬜ Supabase schema + RLS migrations
5. ⬜ Auth (login page, middleware, all 4 providers)
6. ⬜ Stripe subscription integration
7. ⬜ Plant admin settings + equipment management (UI + CSV import)
8. ⬜ Wire form to Supabase + maintenance email notifications
9. ⬜ Dashboard (charts, report history, filters)
10. ⬜ PDF generation

---

## Session Notes
- Always check `/CLAUDE.md` at the start of each session for context
- Use `/compact` if context gets long before switching tasks
- Prefer creating files over inline code dumps
- Dev server: `npm run dev` — runs on port 3001
