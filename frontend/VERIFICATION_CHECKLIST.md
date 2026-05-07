# Frontend Verification Checklist

Manual verification checklist for all 8 routes and 13 MVP charts. Estimated time: ~5 minutes.

## Prerequisites

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Browser DevTools console open (F12)

---

## 1. Route Accessibility (8 routes)

Verify all routes load without errors:

- [ ] `/` - Overview page loads
- [ ] `/short-form` - Short-form trends page loads
- [ ] `/channels` - Channel growth page loads
- [ ] `/anomaly` - Anomaly & viral page loads
- [ ] `/interaction` - Interaction paradox page loads
- [ ] `/economy` - Creator economy page loads
- [ ] `/ai` - AI workspace page loads
- [ ] `/logs` - Audit logs page loads

---

## 2. Overview Page (`/`)

### KPIs (4 total)
- [ ] Total Channels displays **56**
- [ ] Total Videos displays **30,778**
- [ ] Total Views displays value **> 50 billion**
- [ ] Short-form Ratio displays percentage **between 0-100%**

### Charts (3 total)
- [ ] **Chart A1** (PieDonut): Category distribution shows 8 slices with labels
- [ ] **Chart A2** (LineChart): Views by year shows data from 2015-2026
- [ ] **Chart A3** (StackedAreaChart): Short/long ratio by year displays stacked areas

### Cross-filter
- [ ] Click on a category slice in Chart A1 (e.g., Music)
- [ ] Chart A2 and A3 update to show filtered data for that category only
- [ ] Click same slice again or reset button to clear filter

### Insight Card
- [ ] InsightCard displays with relevant insight about the data

---

## 3. Short-form Page (`/short-form`)

### FilterBar
- [ ] Year range slider present and functional
- [ ] Category select dropdown present (All + 8 categories)
- [ ] Filters update charts when changed

### Charts (2 total)
- [ ] **Chart B1** (HeatmapPlotly): Channel × year heatmap displays with color scale
- [ ] **Chart B2** (StackedBarChart): Short vs long videos by year/quarter displays

### Insight Card
- [ ] InsightCard displays insight about short-form trends

---

## 4. Channels Page (`/channels`)

### FilterBar
- [ ] Category select dropdown present (All + 8 categories)
- [ ] Subscriber tier select present (All + Mid/Large/Mega)
- [ ] Filters update charts when changed

### Charts (2 total)
- [ ] **Chart C1** (BoxPlotly): View distribution by category shows box plots
- [ ] **Chart C2** (ScatterPlotly): Subscribers vs avg views scatter plot with 56 points

### Insight Card
- [ ] InsightCard displays insight about channel growth patterns

---

## 5. Anomaly Page (`/anomaly`)

### FilterBar
- [ ] Channel name select dropdown present (All + 56 channels)
- [ ] Year range slider present and functional
- [ ] Filters update charts when changed

### Charts (2 total)
- [ ] **Chart D1** (ScatterPlotly): View count vs like/view ratio with suspect videos highlighted
- [ ] **Chart D2** (TopVideosTable): Top 15 viral videos table with horizontal bars

### Insight Card
- [ ] InsightCard displays insight about viral videos and anomalies

---

## 6. Interaction Page (`/interaction`)

### FilterBar
- [ ] Multi-select category dropdown present
- [ ] Duration group dropdown present (All + Short/Medium/Long)
- [ ] Filters update charts when changed

### Charts (2 total)
- [ ] **Chart E1** (BoxPlotly): Engagement rate by duration × tier shows grouped box plots
- [ ] **Chart E2** (HeatmapPlotly): Day × hour heatmap (7×24 grid) displays

### Insight Card
- [ ] InsightCard displays insight about golden hours and engagement patterns

---

## 7. Economy Page (`/economy`)

### FilterBar
- [ ] Year-month range selector present (default 2024-01 to current)
- [ ] Multi-select category dropdown present
- [ ] Filters update charts when changed

### Charts (2 total)
- [ ] **Chart F1** (LineChart): Commercial videos by month with **vertical line at 2024-10**
- [ ] **Chart F2** (BarChart): Commercial vs non-commercial comparison by category

### Insight Card
- [ ] InsightCard displays insight about YouTube Shopping launch impact

---

## 8. AI Workspace Page (`/ai`)

### Components
- [ ] ChatInput (textarea + submit button) present
- [ ] Monaco editor placeholder or empty state visible
- [ ] Approve button present (may be disabled initially)
- [ ] Reject button present (may be disabled initially)

### Workflow (if backend AI is functional)
- [ ] Submit a test prompt (e.g., "Vẽ biểu đồ cột số video theo thể loại")
- [ ] Code appears in Monaco editor with Vietnamese comments
- [ ] Status badge shows "pending" or "edited"
- [ ] Can edit code in Monaco
- [ ] Click Approve button
- [ ] Status changes to "executing" then "completed" or "failed"
- [ ] If completed, figures render below code editor
- [ ] Execution time displayed

---

## 9. Logs Page (`/logs`)

### Components
- [ ] Request history table displays
- [ ] Table columns: created_at, prompt (truncated), status, execution_time_ms
- [ ] Status badges display with correct colors (pending/completed/failed)

### Detail View
- [ ] Click on a log entry
- [ ] Detail view shows full prompt, code, and results
- [ ] If execution completed, figures display

---

## 10. Console Errors

Open browser DevTools (F12) and check Console tab:

- [ ] No React error messages (red errors)
- [ ] No unhandled exceptions
- [ ] Network tab shows all `/api/data/*` requests return **200 status**
- [ ] No 404 errors for static assets

---

## 11. Build Verification

Run these commands in the frontend directory:

```powershell
cd frontend
pnpm lint
pnpm build
```

- [ ] `pnpm lint` completes with **no errors** (warnings acceptable)
- [ ] `pnpm build` completes successfully
- [ ] Build output shows `.next/static` directory created

---

## Summary

**Total Checks:** 60+

**Routes:** ___/8 accessible  
**Charts:** ___/13 rendering  
**KPIs:** ___/4 correct  
**Filters:** ___/6 pages functional  
**Console:** ___/1 clean (no errors)  
**Build:** ___/2 passed (lint + build)

**Overall Status:** ☐ PASS / ☐ FAIL

**Notes:**
_Add any issues or observations here_

---

## Estimated Time

- Route accessibility: ~1 min
- Chart verification: ~2 min
- Filter interaction: ~1 min
- Console check: ~30 sec
- Build verification: ~30 sec

**Total: ~5 minutes**
