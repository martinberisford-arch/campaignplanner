# CampaignOS — The Ultimate Campaign Planner

**Enterprise-grade campaign planning platform with AI automation, real-time collaboration, governance workflows, and multi-user sync.**

CampaignOS is a SaaS-grade campaign planning tool designed for mid-to-large organisations — particularly public sector teams such as NHS systems, universities, government departments, and non-profits. It helps communications teams plan, execute, track, and report on campaigns from start to finish.

---

## Table of Contents

1. [What Does This Application Do?](#what-does-this-application-do)
2. [Key Concepts (Plain English)](#key-concepts-plain-english)
3. [Deploying to Vercel (Step-by-Step)](#deploying-to-vercel-step-by-step)
4. [Setting Up Upstash Redis for Real-Time Sync (Step-by-Step)](#setting-up-upstash-redis-for-real-time-sync-step-by-step)
5. [Connecting Upstash to Vercel](#connecting-upstash-to-vercel)
6. [How to Log In](#how-to-log-in)
7. [User Roles Explained](#user-roles-explained)
8. [Feature Guide](#feature-guide)
   - [Dashboard](#1-dashboard)
   - [Campaign Calendar](#2-campaign-calendar)
   - [Campaigns (Boards)](#3-campaigns-boards)
   - [AI Brief Generator](#4-ai-brief-generator)
   - [Approvals](#5-approvals)
   - [KPI Dashboard](#6-kpi-dashboard)
   - [Asset Library](#7-asset-library)
   - [Campaign Detail & Governance](#8-campaign-detail--governance)
   - [Settings](#9-settings)
9. [Real-Time Sync — How It Works](#real-time-sync--how-it-works)
10. [Creating New Users](#creating-new-users)
11. [Troubleshooting](#troubleshooting)
12. [Technical Architecture](#technical-architecture)

---

## What Does This Application Do?

CampaignOS is a **campaign planner** — think of it as a specialised project management tool for communications and marketing teams. It helps you:

- **Plan campaigns** from scratch with structured briefs, goals, audiences, and channels
- **Visualise timelines** on calendars and Gantt charts
- **Organise work** across Kanban boards, tables, and lists
- **Use AI** to auto-generate campaign briefs, messaging, and strategy recommendations
- **Get approvals** through structured review workflows with audit trails
- **Track performance** with KPI dashboards connected to analytics data
- **Manage assets** like images, documents, and brand guidelines in one place
- **Enforce governance** with mandatory checklists, risk assessments, and launch gates
- **Collaborate in real-time** — changes made by one user appear for all other users within seconds

---

## Key Concepts (Plain English)

If you're not familiar with communications/marketing terminology, here's what the key terms mean:

| Term | What It Means |
|------|--------------|
| **Campaign** | A planned communications effort with a specific goal (e.g., "Recruit 500 primary care coaches over 8 weeks") |
| **Brief** | A structured document describing what a campaign aims to achieve, who it's for, and how it will be delivered |
| **Channel** | The method of reaching your audience — social media, email, paid ads, events, PR, etc. |
| **KPI** | Key Performance Indicator — a measurable number that tells you if your campaign is working (e.g., "10,000 website visits") |
| **Kanban Board** | A visual board with columns (e.g., To Do → In Progress → Done) where you move cards/tasks between stages |
| **Gantt Chart** | A horizontal bar chart showing when tasks start and end, displayed along a timeline |
| **Approval Workflow** | A structured process where work gets reviewed and signed off before it goes live |
| **Governance** | Rules and checklists that ensure campaigns meet quality standards before launching |
| **Stakeholder** | Anyone who has an interest in the campaign — could be a manager, client, or subject-matter expert |
| **Asset** | Any file used in a campaign — images, videos, documents, templates, brand guidelines |
| **ROI** | Return on Investment — how much value you get back compared to what you spent |
| **Workspace** | A container for all your team's campaigns, like a shared folder for your organisation |

---

## Deploying to Vercel (Step-by-Step)

These instructions assume you have never used Vercel before.

### Step 1: Create a GitHub Account (if you don't have one)

1. Go to [github.com](https://github.com)
2. Click **Sign up**
3. Follow the steps to create your account
4. Verify your email address

### Step 2: Get the Code into GitHub

1. If you have the CampaignOS code as a folder on your computer:
   - Go to [github.com/new](https://github.com/new)
   - Name the repository (e.g., `campaignos`)
   - Set it to **Private** (recommended)
   - Click **Create repository**
   - Follow GitHub's instructions to push your code
2. If someone shared a GitHub repository link with you:
   - Click **Fork** in the top-right corner to make your own copy

### Step 3: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub** (easiest option)
4. Authorise Vercel to access your GitHub account

### Step 4: Deploy the Project

1. In Vercel's dashboard, click **Add New → Project**
2. Find your `campaignos` repository in the list and click **Import**
3. Vercel will auto-detect the settings. Ensure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**
5. Wait 1–2 minutes for the build to complete
6. Vercel will give you a URL like `https://campaignos-abc123.vercel.app` — this is your live site

### Step 5: Set Up a Custom Domain (Optional)

1. In your Vercel project, go to **Settings → Domains**
2. Add your domain (e.g., `planner.yourorg.com`)
3. Follow the DNS instructions Vercel provides

---

## Setting Up Upstash Redis for Real-Time Sync (Step-by-Step)

Without Upstash, CampaignOS works in **local mode** — each browser has its own copy of the data. With Upstash, **all users see the same data in real-time**.

### Step 1: Create an Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Click **Sign Up** or **Get Started**
3. You can sign up with GitHub, Google, or email
4. The **free tier** is all you need — it includes:
   - 10,000 commands per day
   - 256 MB storage
   - No credit card required

### Step 2: Create a Redis Database

1. Once logged in, you'll see the Upstash Console
2. Click **Create Database**
3. Fill in:
   - **Name**: `campaignos` (or anything you like)
   - **Region**: Choose the closest to your users (e.g., `eu-west-1` for UK)
   - **Type**: Leave as **Regional**
4. Click **Create**

### Step 3: Get Your Credentials

1. After creating the database, you'll see a details page
2. Scroll down to the **REST API** section
3. You need two values:
   - **UPSTASH_REDIS_REST_URL** — looks like `https://xxxx-xxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN** — a long string of letters and numbers
4. Click the **copy** icon next to each value — you'll need them in the next step

### Important: These are secrets — never share them publicly or commit them to Git.

---

## Connecting Upstash to Vercel

### Step 1: Open Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com) and open your CampaignOS project
2. Click **Settings** (tab at the top)
3. Click **Environment Variables** (in the left sidebar)

### Step 2: Add the Two Variables

Add each variable one at a time:

**First variable:**
- **Key**: `UPSTASH_REDIS_REST_URL`
- **Value**: Paste the URL you copied from Upstash (e.g., `https://xxxx-xxxx.upstash.io`)
- **Environment**: Check all three boxes (Production, Preview, Development)
- Click **Save**

**Second variable:**
- **Key**: `UPSTASH_REDIS_REST_TOKEN`
- **Value**: Paste the token you copied from Upstash
- **Environment**: Check all three boxes
- Click **Save**

### Step 3: Redeploy

1. Go to the **Deployments** tab
2. Find the most recent deployment
3. Click the **⋯** (three dots) menu next to it
4. Click **Redeploy**
5. Wait for the build to finish (1–2 minutes)

### Step 4: Verify Sync Is Working

1. Open your CampaignOS site
2. Look at the header bar — you should see a **green "Synced"** indicator instead of "Local Only"
3. Open the site in a different browser or incognito window
4. Log in as a different user
5. Make a change (e.g., create a campaign) — it should appear in the other browser within 3 seconds

---

## How to Log In

CampaignOS comes with pre-configured demo accounts. Use these to log in:

| Role | Email | Password | What They Can Do |
|------|-------|----------|-----------------|
| **Admin** | `admin@campaignos.com` | `admin123` | Everything — full access |
| **Editor** | `editor@campaignos.com` | `editor123` | Create, edit, approve campaigns |
| **Contributor** | `contributor@campaignos.com` | `contributor123` | Create campaigns, submit for approval |
| **Viewer** | `viewer@campaignos.com` | `viewer123` | View only — cannot edit anything |

### To log in:
1. Open your CampaignOS URL
2. Enter the email and password from the table above
3. Click **Sign In**

### To switch accounts:
1. Click your avatar/name at the bottom of the left sidebar
2. Click the **logout** icon (door with arrow)
3. Confirm sign out
4. Log in with a different account

---

## User Roles Explained

CampaignOS uses **role-based access control** (RBAC). Each user has one role that determines what they can see and do:

### 🔴 Admin
- **Full access** to everything
- Can create, edit, and **delete** campaigns
- Can **approve or reject** submissions
- Can create and manage user accounts
- Can change workspace settings and integrations
- Can view audit logs and compliance data
- Can export reports and data

### 🟢 Editor
- Can **create and edit** campaigns
- Can **approve or reject** submissions
- Can upload assets
- Can export reports
- Can add manual KPI data
- **Cannot** delete campaigns, manage users, or change settings

### 🟡 Contributor
- Can **create** new campaigns
- Can **submit** campaigns for approval
- Can upload assets
- Can use the AI Brief Generator
- **Cannot** edit other people's campaigns
- **Cannot** approve/reject or delete anything

### ⚪ Viewer
- **Read-only access**
- Can view dashboards, campaigns, calendars, and reports
- **Cannot** create, edit, delete, upload, or approve anything
- Useful for stakeholders who need visibility but not editing rights

---

## Feature Guide

### 1. Dashboard

**What it is:** Your home screen — a snapshot of everything happening across your campaigns.

**What you'll see:**
- **Campaign pipeline** — how many campaigns are in each stage (Draft, Planning, In Review, Active, etc.)
- **Task progress** — a ring chart showing overall task completion
- **AI insights** — automated observations about your campaigns' performance
- **Recent activity** — a timeline of recent changes made by your team
- **Pending approvals banner** — if items need your review, you'll see them here

**How to use it:**
- Click any campaign card to jump to its detail page
- Click "View All" on sections to navigate to the relevant page
- The dashboard updates automatically when data changes

---

### 2. Campaign Calendar

**What it is:** A visual calendar showing when campaigns are scheduled.

**Views available:**
- **Monthly grid** — see campaigns as coloured bars spanning their date ranges
- **Timeline / Gantt** — horizontal timeline showing campaigns as bars with drag handles

**How to use it:**
- Use the **← →** arrows to navigate between months
- Click **Today** to jump back to the current month
- Click on a campaign bar to open its detail page
- Campaign colours match their priority (red = critical, amber = high, blue = medium, green = low)

---

### 3. Campaigns (Boards)

**What it is:** The main area for viewing and managing all your campaigns.

**Four view modes:**

| View | Best For |
|------|----------|
| **Kanban** | Dragging campaigns between stages (Draft → Planning → Active → Done) |
| **List** | Seeing campaigns as a simple vertical list with key details |
| **Table** | Spreadsheet-style view with sortable columns |
| **Timeline** | Seeing campaigns on a horizontal date timeline |

**How to create a new campaign:**
1. Click the **+ New Campaign** button (top right)
2. Fill in the 3-step form:
   - **Step 1**: Title, description, priority, status, dates
   - **Step 2**: Goals, audiences, budget
   - **Step 3**: Select channels and review
3. Click **Create Campaign**

**How to use Kanban drag-and-drop:**
1. Switch to **Kanban** view
2. Grab any campaign card (your cursor will change to a hand)
3. Drag it to a different column (e.g., from "Draft" to "Planning")
4. The campaign's status updates automatically
5. Drop zones highlight in blue when you hover over them

**How to open a campaign:**
- Click on any campaign card in any view to open its detail page

---

### 4. AI Brief Generator

**What it is:** An AI tool that creates a full campaign brief from a simple text prompt.

**How to use it:**
1. Go to **AI Brief Generator** from the sidebar
2. Type a description of your campaign in plain English, for example:
   > "Plan a nation-wide staff recruitment campaign for primary care coaches over 8 weeks with budget £150k"
3. Click **Generate Brief**
4. Wait for the AI to generate (takes about 5 seconds with simulated processing)
5. The AI produces a complete brief with:
   - Campaign overview and objectives
   - Target audiences
   - Channel recommendations with budget allocation
   - Week-by-week timeline
   - Budget breakdown
   - Risk assessment with mitigations
   - Messaging framework
   - KPI targets and measurement methods

**What to do with the generated brief:**
- **Copy** sections to use in other documents
- **Export** the entire brief
- Use it as a starting point and edit as needed
- The AI brief is a suggestion — always review and adapt for your context

---

### 5. Approvals

**What it is:** A workflow system where campaigns and documents get formally reviewed and signed off before going live.

**Why it matters:** In large organisations (especially public sector), nothing should go live without proper sign-off. Approvals create an audit trail of who reviewed what and when.

**How to submit something for approval:**
1. Click the **Submit for Approval** button at the top of the Approvals page
2. Fill in:
   - **Title** (e.g., "Q1 Social Media Strategy")
   - **Type** (Brief, Strategy, Asset, Copy, or Budget)
   - **Campaign** (link it to an existing campaign)
   - **Document content** (paste or type the content being reviewed)
   - **Reviewers** (select team members who need to review)
3. Click **Submit for Review**

**How to approve or reject (Editors and Admins only):**
1. Find the pending item in the Approvals list
2. You can:
   - Click **✓ Approve** or **✗ Reject** directly from the list
   - Or expand the item for more detail
3. If expanded:
   - Read the document content
   - Type an optional comment
   - Click **Approve**, **Request Changes**, or **Reject**
4. The system records who approved/rejected, when, and any comments

**Status meanings:**
- 🟡 **Pending** — Waiting for reviewers
- 🟢 **Approved** — All reviewers have approved
- 🟠 **Changes Requested** — Reviewer wants modifications before approving
- 🔴 **Rejected** — Not approved

---

### 6. KPI Dashboard

**What it is:** A data dashboard showing how your campaigns are performing.

**What you'll see:**
- **Top-line metrics** — Total impressions, clicks, leads, conversion rate, ROI, sentiment score
- **Charts** — Line charts, area charts, bar charts, and pie charts showing trends over time
- **Channel breakdown** — How each channel (social, email, paid, etc.) is performing
- **AI performance summary** — Automated insights and recommendations

**How to add data manually:**
1. Click **+ Manual Entry** button
2. Fill in:
   - **Metric name** (e.g., "Impressions", "Clicks")
   - **Value** (the number)
   - **Week** and **Channel**
3. Click **Add Entry**
4. Your manual data appears in the dashboard alongside other data

**How to export reports:**
1. Click the **Export** dropdown button
2. Choose format:
   - **PDF** — Opens a printable report in a new tab (use browser's Print → Save as PDF)
   - **CSV** — Downloads a spreadsheet file you can open in Excel
   - **JSON** — Downloads raw data for technical use

---

### 7. Asset Library

**What it is:** A central repository for all files used in your campaigns — images, videos, documents, templates, and brand guidelines.

**How to use it:**
- **Browse** assets in grid or list view
- **Filter** by type (Images, Videos, Documents, Templates, Guidelines)
- **Search** by name, tag, or AI-generated tag
- **Click** any asset to see its details, tags, and metadata

**AI tagging:** Assets are automatically categorised with AI-generated tags to make them easier to find.

---

### 8. Campaign Detail & Governance

**What it is:** The full detail page for an individual campaign, including task management and governance controls.

**Task Management:**
- **Add tasks** — Click "Add Task" and fill in title, description, priority, status, and due date
- **Edit tasks** — Hover over a task and click the pencil icon
- **Delete tasks** — Hover over a task and click the trash icon (Admin only)
- **Change status** — Use the dropdown on each task row to move it between To Do, In Progress, Review, and Done

**Campaign Governance & Quality Engine (CGQE):**

This is a quality control system that ensures campaigns meet standards before launching.

**How to enable governance:**
1. Open any campaign's detail page
2. Click **Enable Governance**
3. Choose campaign type:
   - **Social Media Campaign** (22 checklist items)
   - **Website Update** (18 checklist items)
   - **Generic Campaign** (18 checklist items)

**How the governance panel works:**
- A panel appears on the right side showing:
  - **Governance Score** (0-100) with a colour-coded progress bar
  - **Risk Flag** (Green / Amber / Red) — click to set
  - **Launch Status** — shows whether the campaign can go live
  - **Checklist** — grouped by category, with individual items to tick off

**Mandatory items:** Some checklist items are marked as **MANDATORY** — these must be completed before the campaign can launch.

**Launching a campaign:**
The campaign **cannot** move to "Live/Active" unless:
- ✅ All mandatory checklist items are completed
- ✅ At least one KPI is defined
- ✅ A risk level is selected (Green, Amber, or Red)
- ✅ An owner is assigned
- ✅ All approval-required items are completed

If you try to launch when requirements aren't met, a **"Campaign Launch Blocked"** modal appears listing exactly what's missing.

**AI Scan:**
- Click **AI Scan** to run automated quality checks:
  1. **Objective Quality Validator** — flags vague goals
  2. **KPI Sufficiency Checker** — warns if too few KPIs
  3. **Risk Suggestion Generator** — identifies unaddressed risks
  4. **Accessibility Compliance Reminder** — checks accessibility items
  5. **Duplication Detector** — finds duplicate checklist items

**Exporting the audit trail:**
- Click **Export Audit** to generate a PDF report containing the governance score, checklist status, risk assessment, and compliance data

---

### 9. Settings

**What it is:** Configuration centre for your workspace, security, integrations, team, and compliance.

**Tabs:**

| Tab | What It Does |
|-----|-------------|
| **General** | Change workspace name, organisation, sector. Toggle notification preferences. |
| **Security & Access** | View authentication settings, RBAC matrix, and audit logs |
| **Integrations** | Connect/disconnect external services (Google Analytics, Slack, Salesforce, etc.) |
| **Team & Users** | View, create, edit, and deactivate user accounts |
| **Compliance** | View compliance standards status (UK GDPR, ISO 27001, Cyber Essentials, etc.) |

**Changing the workspace name:**
1. Go to Settings → General
2. Edit the Workspace Name field
3. Click **Save Changes**
4. The name updates immediately in the sidebar

**Toggling notifications:**
1. Go to Settings → General → Notifications section
2. Click the toggle switch next to any notification type
3. The change takes effect immediately

**Connecting integrations:**
1. Go to Settings → Integrations
2. Click **Connect** next to an available service
3. The service will show as "Connected"
4. To disconnect, hover over a connected service and click **Disconnect**

---

## Real-Time Sync — How It Works

When Upstash Redis is configured, CampaignOS provides **real-time data synchronisation** across all users and browsers:

### The Basics
- Every change you make (creating campaigns, updating tasks, approving items, etc.) is automatically saved to Upstash Redis within **1.5 seconds**
- Every **3 seconds**, the app checks for changes made by other users
- If another user made changes, your screen updates automatically — no refresh needed

### Sync Status Indicators (in the header bar)

| Indicator | Meaning |
|-----------|---------|
| 🟢 **Synced** | All data is up to date and saved to the cloud |
| 🔵 **Syncing...** | Your recent changes are being saved |
| 🔴 **Offline** | Can't reach the server — click to retry |
| 🟡 **Local Only** | Upstash isn't configured — data stays in your browser only |
| ⚪ **Connecting...** | Initial connection being established |

### What Gets Synced
- ✅ Campaigns and all their tasks, checklists, KPIs
- ✅ Approval items and their review status
- ✅ Assets
- ✅ Notifications
- ✅ Team member accounts
- ✅ Workspace settings
- ✅ Integration connection status
- ✅ Manual KPI data

### What Stays Local (Per-Browser)
- Your login session (which account you're logged in as)
- UI preferences (sidebar open/closed, current page view)

### Limitations
- If two users edit the same thing at the exact same moment, the last save wins
- Polling interval is 3 seconds, so changes may take up to 3 seconds to appear
- The free Upstash tier allows 10,000 commands per day — sufficient for small teams but may need upgrading for larger deployments

---

## Creating New Users

Only **Admin** users can create new accounts.

### Step-by-step:
1. Log in as an Admin (e.g., `admin@campaignos.com` / `admin123`)
2. Go to **Settings** → **Team & Users** tab
3. Click **Create User** button (top right)
4. Fill in:
   - **Full Name** — e.g., "Jane Smith"
   - **Email Address** — e.g., "jane.smith@nhs.net"
   - **Password** — minimum 6 characters (this is their login password)
   - **Role** — choose Admin, Editor, Contributor, or Viewer
   - **Department** — e.g., "Marketing" (optional)
5. Click **Create User**
6. The new user can now log in with the email and password you set
7. When sync is enabled, the new user account is available across all browsers immediately

### Editing Users
1. Find the user in the Team list
2. Click the **pencil icon** next to their name
3. Change their role or department
4. Click **Save Changes**

### Deactivating Users
1. Click the **trash icon** next to the user
2. The user is marked as "DEACTIVATED" and cannot log in
3. Their data is preserved — you can reactivate them later

### Reactivating Users
1. Find the deactivated user (shown greyed out with "DEACTIVATED" label)
2. Click the **refresh icon** next to their name
3. They can log in again

---

## Troubleshooting

### "Local Only" status — sync not working
**Cause:** Upstash Redis environment variables are not set in Vercel.
**Fix:** Follow the [Connecting Upstash to Vercel](#connecting-upstash-to-vercel) section above. Make sure you've set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, then redeployed.

### "Offline" status — can't connect
**Cause:** Network issue or Upstash service disruption.
**Fix:** 
1. Click the "Offline" indicator to retry
2. Check your internet connection
3. Check [Upstash status page](https://status.upstash.com)
4. Verify your environment variables are correct in Vercel

### Can't log in
**Cause:** Wrong email/password or deactivated account.
**Fix:** 
1. Double-check the email and password from the [login table](#how-to-log-in)
2. Passwords are case-sensitive
3. If your account was created by an admin, ask them for the correct credentials
4. If your account has been deactivated, ask an admin to reactivate it

### Changes not appearing for other users
**Cause:** Sync might be delayed or not configured.
**Fix:**
1. Check the sync status indicator in the header
2. If it shows "Local Only", configure Upstash (see setup guide above)
3. Wait up to 3 seconds for changes to propagate
4. Try refreshing the page in the other browser

### Campaign won't launch / "Launch Blocked"
**Cause:** Not all governance requirements are met.
**Fix:** The "Launch Blocked" modal lists exactly what's missing. Complete all mandatory checklist items, add KPIs, set a risk level, and ensure required approvals are in place.

### Can't see certain pages or buttons
**Cause:** Your role doesn't have permission.
**Fix:** Each role has specific permissions. See the [User Roles Explained](#user-roles-explained) section. Contact an admin to change your role if needed.

### Data seems to have reset
**Cause:** If Upstash was recently configured, it may have replaced local data with server data.
**Fix:** This is expected behaviour. The server data is the "source of truth" when sync is enabled. Any data created before sync was enabled lives only in that browser's local session.

### Need to completely reset all data
**Admin only:** Open browser developer tools (F12 → Console) and run:
```javascript
fetch('/api/state', { method: 'DELETE' }).then(r => r.json()).then(console.log)
```
Then refresh the page. This clears all shared data and starts fresh with defaults.

---

## Technical Architecture

For developers and technical teams:

```
┌─────────────────────────────────────────────────┐
│                  BROWSER (User)                  │
│                                                  │
│  React SPA (Vite + Tailwind CSS)                │
│  ├── AppContext (State Management)               │
│  ├── Sync Engine (fetch polling, 3s interval)   │
│  ├── Role-Based Access Control (client-side)    │
│  └── UI Components (pages, layouts, modals)     │
│                                                  │
│  Sync: POST /api/state (push)                   │
│  Sync: GET /api/state?version=N (poll)          │
└───────────────┬──────────────┬──────────────────┘
                │              │
                ▼              ▼
┌──────────────────────────────────────────────────┐
│              VERCEL (Hosting + API)              │
│                                                  │
│  Static Files: dist/index.html (SPA)            │
│  Serverless Function: /api/state.ts             │
│  ├── GET: Read state from Redis                 │
│  ├── POST: Write state to Redis                 │
│  └── DELETE: Reset state (admin debug)          │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│             UPSTASH REDIS (Database)             │
│                                                  │
│  Key: campaignos:state → Full app state (JSON)  │
│  Key: campaignos:version → Integer (auto-incr)  │
│                                                  │
│  Free tier: 10K commands/day, 256MB storage     │
│  REST API over HTTPS (no persistent connection) │
└──────────────────────────────────────────────────┘
```

### Sync Protocol
1. **Initial load**: Client calls `GET /api/state?version=0` → receives full state
2. **State changes**: Client debounces (1.5s) then calls `POST /api/state` with full state
3. **Polling**: Every 3s, client calls `GET /api/state?version=N` → server returns new state only if version > N
4. **Version tracking**: Server increments a version number on each write. Client tracks its last-seen version to avoid unnecessary data transfer.
5. **Remote update guard**: A `skipNextPush` ref prevents the app from pushing back data it just received from the server (avoiding infinite sync loops).

### Environment Variables

| Variable | Where to Set | Value |
|----------|-------------|-------|
| `UPSTASH_REDIS_REST_URL` | Vercel → Settings → Environment Variables | From Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel → Settings → Environment Variables | From Upstash Console |

### File Structure
```
/
├── api/
│   └── state.ts          # Vercel serverless function for Redis sync
├── src/
│   ├── App.tsx            # Main router
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   ├── types.ts           # TypeScript type definitions
│   ├── store/
│   │   └── AppContext.tsx  # State management + sync engine
│   ├── components/
│   │   └── Layout.tsx     # App shell (sidebar, header, nav)
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── Campaigns.tsx
│   │   ├── AIBriefGenerator.tsx
│   │   ├── Approvals.tsx
│   │   ├── KPIDashboard.tsx
│   │   ├── Assets.tsx
│   │   ├── CampaignDetail.tsx
│   │   ├── Settings.tsx
│   │   └── LoginPage.tsx
│   ├── utils/
│   │   ├── cn.ts          # Tailwind class merge utility
│   │   ├── permissions.ts # Role-based permission definitions
│   │   └── governance.ts  # Governance engine logic
│   └── data/
│       └── mockData.ts    # Default/demo data
├── vercel.json            # Vercel routing + function config
├── index.html             # SPA entry point
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite build config
```

---

## Cost Summary

| Service | Tier | Cost |
|---------|------|------|
| **Vercel** | Hobby (personal) or Pro (team) | Free / $20/month |
| **Upstash Redis** | Free tier | Free (10K commands/day) |
| **Upstash Redis** | Pay-as-you-go | $0.2 per 100K commands |
| **Custom domain** | Optional | Varies by registrar |

For most small-to-medium teams (under 20 users), the **completely free tier** of both Vercel and Upstash is sufficient.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the Vercel deployment logs (Vercel Dashboard → Deployments → click on a deployment → Functions tab)
3. Check the browser console (F12 → Console tab) for error messages

---

*CampaignOS — Built for teams who take campaign planning seriously.*
