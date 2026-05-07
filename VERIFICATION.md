# Verification Guide

End-to-end verification for Vietnam YouTube Analytics Dashboard + AI Module before demo.

**Estimated Total Time:** < 10 minutes

---

## Quick Start (TL;DR)

```powershell
# 1. Backend verification (~2 min)
cd backend
.\verify_backend.ps1

# 2. AI flow verification (~2 min)
cd ..\tests
.\verify_ai_flow.ps1

# 3. RO test cases (~5 min)
.\verify_ro_tests.ps1

# 4. Frontend verification (~5 min)
# Open frontend/VERIFICATION_CHECKLIST.md and follow manual steps

# 5. Build check (~30 sec)
cd ..\frontend
pnpm lint
pnpm build
```

---

## Prerequisites

Before running verification, ensure:

1. **Backend running** on http://localhost:8000
   ```powershell
   conda activate vn-dataviz-ai
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Frontend running** on http://localhost:3000
   ```powershell
   cd frontend
   pnpm dev
   ```

3. **CSV files present** in `backend/data/`:
   - `videos_processed.csv` (30,778 rows, ~20.8MB)
   - `channels_processed.csv` (56 rows, ~16KB)

4. **GEMINI_API_KEY set** in `.env` file at repo root:
   ```
   GEMINI_API_KEY=your-actual-api-key-here
   ```

5. **Dependencies installed**:
   - Backend: `pip install -r backend/requirements.txt`
   - Frontend: `pnpm install` (in frontend directory)

---

## 1. Backend Verification

**Script:** `backend/verify_backend.ps1`  
**Time:** ~2 minutes  
**Tests:** 9 endpoint checks + CSV validation

### Run

```powershell
cd backend
.\verify_backend.ps1
```

### Expected Output

```
========================================
Backend Verification Script
========================================

ℹ Checking prerequisites...
✓ CSV files found

ℹ Testing: Health Endpoint
✓ Health Endpoint - PASS

ℹ Testing: Schema Endpoint
✓ Schema Endpoint - PASS

ℹ Testing: Overview Endpoint
✓ Overview Endpoint - PASS

... (6 more endpoints)

========================================
Summary
========================================
✓ Health Endpoint
✓ Schema Endpoint
✓ Overview Endpoint
✓ Overview Category Filter
✓ Short-form Endpoint
✓ Channels Endpoint
✓ Anomaly Endpoint
✓ Interaction Endpoint
✓ Economy Endpoint

----------------------------------------
Passed: 9
Failed: 0
Total:  9

✓ All tests passed!
```

### What It Validates

- **Health endpoint** returns `{"ok": true}`
- **Schema endpoint** returns 37 videos columns + 25 channels columns
- **Overview endpoint** returns 4 KPIs (56 channels, 30778 videos, views>50B, short_form_ratio 0-1) + 3 chart datasets
- **Category filter** works on overview endpoint
- **5 RO endpoints** (short-form, channels, anomaly, interaction, economy) return chart data
- **CSV files** exist before running tests

---

## 2. AI Flow Verification

**Script:** `tests/verify_ai_flow.ps1`  
**Time:** ~2 minutes  
**Tests:** Full AI workflow from prompt to figure

### Run

```powershell
cd tests
.\verify_ai_flow.ps1
```

### Expected Output

```
========================================
AI Flow Verification Script
========================================

ℹ Step 1: Validating GEMINI_API_KEY...
✓ GEMINI_API_KEY is set

ℹ Step 2: Submitting test prompt to AI...
✓ Code generation successful

ℹ Step 3: Validating response structure...
✓ Response structure valid

ℹ Step 4: Validating generated code...
✓ Code quality checks passed

ℹ Step 5: Executing generated code...
✓ Code execution completed in 3.45s

ℹ Step 6: Validating execution results...
✓ Generated 1 valid figure(s)
✓ Execution validation passed

ℹ Step 7: Verifying log retrieval...
✓ Log retrieval successful

========================================
Summary
========================================
✓ All AI flow tests passed!
  - Code generation: OK
  - Code execution: OK
  - Figure generation: OK
  - Log persistence: OK
```

### What It Validates

- **GEMINI_API_KEY** is configured in .env
- **Code generation** returns request_id, ai_code, explanation, status=pending
- **Code quality** includes Vietnamese comments, plt.savefig, matplotlib.use
- **Code execution** completes within 30 seconds
- **Figures** are generated as valid base64 PNG strings
- **Logs** are persisted and retrievable via /api/logs/{id}
- **Retry logic** with exponential backoff for API failures

---

## 3. RO Test Cases

**Script:** `tests/verify_ro_tests.ps1`  
**Time:** ~5 minutes (5 tests × ~1 min each)  
**Tests:** 5 Research Objective test cases

### Run

```powershell
cd tests
.\verify_ro_tests.ps1
```

### Expected Output

```
========================================
RO Test Runner
========================================

ℹ Loading test cases from ro_test_cases.json...
✓ Loaded 5 test cases

----------------------------------------
RO1: Xu hướng Short-form
----------------------------------------
ℹ Prompt: Heatmap tỉ lệ short-form theo kênh và năm...
ℹ Generating code...
✓ Code generated (request_id: abc123)
ℹ Validating code quality...
✓ Code quality checks passed
ℹ Executing code...
ℹ Validating execution results...
✓ Execution time: 2.34s
✓ Generated 1 valid figure(s)
✓ Execution validation passed
✓ RO1: Xu hướng Short-form - PASS

... (4 more RO tests)

========================================
Summary
========================================
✓ RO1: Xu hướng Short-form
✓ RO2: Tăng trưởng kênh
✓ RO3: Bất thường & Viral
✓ RO4: Nghịch lý tương tác
✓ RO5: Creator Economy

----------------------------------------
Passed: 5 / 5
Failed: 0 / 5

✓ All RO tests passed!
```

### Test Cases

1. **RO1: Xu hướng Short-form**
   - Prompt: "Heatmap tỉ lệ short-form theo kênh và năm, kèm top 5 kênh xoay trục mạnh nhất"
   - Validates: short_form_ratio, channel_name, year columns; heatmap generation

2. **RO2: Tăng trưởng kênh**
   - Prompt: "Median view/video của 8 thể loại, chia theo 3 tier subscriber"
   - Validates: channel_category, subscriber_tier, avg_views_per_video; median calculation

3. **RO3: Bất thường & Viral**
   - Prompt: "Top 10 video có suspect_fake_view=True, sắp xếp theo view_count"
   - Validates: suspect_fake_view, view_count, title, channel_name; filtering and sorting

4. **RO4: Nghịch lý tương tác**
   - Prompt: "Heatmap day_of_week × hour_posted để tìm giờ vàng đăng video"
   - Validates: day_of_week, hour_posted; pivot table and heatmap

5. **RO5: Creator Economy**
   - Prompt: "Số video commercial theo tháng từ 2024-01, vẽ vertical line tại 2024-10"
   - Validates: is_commercial, published_at; time series with vertical line

### What It Validates

For each RO test:
- **Code generation** succeeds with Vietnamese comments
- **Expected columns** are referenced in code
- **Required patterns** present (plt.savefig, matplotlib.use, specific functions)
- **Execution** completes within 30 seconds
- **Status** is "completed" (not "failed")
- **Figures** are generated as valid base64 PNG
- **No hallucinated columns** (basic check via pattern matching)

---

## 4. Frontend Verification

**Checklist:** `frontend/VERIFICATION_CHECKLIST.md`  
**Time:** ~5 minutes  
**Method:** Manual testing

### Run

1. Open `frontend/VERIFICATION_CHECKLIST.md`
2. Follow the checklist step-by-step
3. Check off each item as you verify it
4. Note any issues in the summary section

### What It Validates

- **8 routes** are accessible and render without errors
- **13 MVP charts** display real data:
  - Overview: 3 charts (A1 PieDonut, A2 LineChart, A3 StackedAreaChart)
  - Short-form: 2 charts (B1 Heatmap, B2 StackedBar)
  - Channels: 2 charts (C1 BoxPlot, C2 Scatter)
  - Anomaly: 2 charts (D1 Scatter, D2 TopVideosTable)
  - Interaction: 2 charts (E1 BoxPlot, E2 Heatmap)
  - Economy: 2 charts (F1 LineChart, F2 BarChart)
- **4 KPIs** on Overview page show correct values
- **Cross-filtering** works on Overview page (click A1 → updates A2, A3)
- **FilterBars** on 6 dashboard pages update charts
- **AI workspace** components render (ChatInput, Monaco, buttons)
- **Logs page** displays request history
- **Console** has no React errors or network failures
- **Build** succeeds (`pnpm lint` and `pnpm build`)

---

## 5. Pass Criteria

Verification passes if ALL of the following are met:

### Backend (REQUIREMENTS.md §11 criteria 1-3)

- ✓ All 9 endpoint tests pass
- ✓ Schema returns 37 videos + 25 channels columns
- ✓ Overview KPIs: 56 channels, 30778 videos, views>50B, short_form_ratio 0-1
- ✓ All 5 RO endpoints return chart data

### AI Module (REQUIREMENTS.md §11 criteria 4-6)

- ✓ AI flow test passes (generation → execution → figures)
- ✓ Code has Vietnamese comments
- ✓ Code uses only valid columns (no hallucinations)
- ✓ Execution completes within 30 seconds
- ✓ At least one figure generated as base64 PNG
- ✓ Logs persist to SQLite and are retrievable

### RO Test Cases (REQUIREMENTS.md §8)

- ✓ 5/5 RO tests pass
- ✓ Each generates code with Vietnamese comments
- ✓ Each executes successfully within 30 seconds
- ✓ Each produces at least one figure

### Frontend (REQUIREMENTS.md §11 criteria 7-10)

- ✓ All 8 routes accessible
- ✓ 13/13 charts render with real data
- ✓ 4 KPIs display correct values
- ✓ Cross-filter works on Overview page
- ✓ FilterBars functional on 6 pages
- ✓ AI workspace components render
- ✓ Logs page displays request history
- ✓ No console errors (React or network)
- ✓ `pnpm build` succeeds

### Evaluation Criteria (REQUIREMENTS.md §7)

Maps to 8 evaluation criteria:

1. **Data accuracy** → Backend tests validate KPIs and schema
2. **Visualization quality** → Frontend checklist validates 13 charts
3. **Storytelling** → InsightCards on each page (manual check)
4. **Interactivity** → Cross-filter and FilterBars (manual check)
5. **AI module** → AI flow + RO tests validate full workflow
6. **Code quality** → Vietnamese comments, plt.savefig, no hallucinations
7. **Technical implementation** → Build succeeds, no console errors
8. **Demo readiness** → All verification passes in < 10 minutes

---

## 6. Troubleshooting

### Backend Tests Fail

**Issue:** "CSV files not found"  
**Solution:** Ensure `videos_processed.csv` and `channels_processed.csv` are in `backend/data/`

**Issue:** "Connection refused" or "Cannot connect to localhost:8000"  
**Solution:** Start backend with `uvicorn app.main:app --reload` in conda env `vn-dataviz-ai`

**Issue:** "Schema validation failed" (wrong column count)  
**Solution:** Check that CSV files are not corrupted. Expected: 37 videos columns, 25 channels columns

**Issue:** "KPI values incorrect"  
**Solution:** Verify CSV files are the correct dataset (30,778 videos, 56 channels)

### AI Flow Test Fails

**Issue:** "GEMINI_API_KEY not configured"  
**Solution:** Create `.env` file at repo root with `GEMINI_API_KEY=your-key-here`

**Issue:** "Code generation failed" or "API error"  
**Solution:** 
- Check GEMINI_API_KEY is valid (not expired, has quota)
- Check internet connection
- Retry (script has exponential backoff)

**Issue:** "Execution timeout" (> 30 seconds)  
**Solution:**
- Check sandbox permissions (can write to `backend/sandbox/`)
- Check CSV files are accessible from sandbox
- Try simpler prompt or increase timeout in script header

**Issue:** "No figures generated"  
**Solution:**
- Check generated code includes `plt.savefig()`
- Check sandbox has write permissions
- Check `matplotlib.use('Agg')` is in code

### RO Tests Fail

**Issue:** "Missing pattern: plt.savefig"  
**Solution:** LLM didn't generate correct code. Check system prompt in `backend/app/services/llm/prompts.py`

**Issue:** "No Vietnamese comments"  
**Solution:** LLM prompt may need adjustment. Check `build_system_prompt()` includes Vietnamese requirement

**Issue:** "Possibly missing columns"  
**Solution:** LLM may be hallucinating columns. Check schema injection in prompt

**Issue:** Multiple RO tests timeout  
**Solution:** Increase timeout in `ro_test_cases.json` or check system performance

### Frontend Verification Fails

**Issue:** Routes return 404  
**Solution:** Check frontend is running on port 3000. Check Next.js 16 routing structure.

**Issue:** Charts don't render  
**Solution:**
- Check API endpoints return data (use backend verification)
- Check browser console for errors
- Check Plotly dynamic imports (`ssr: false`)

**Issue:** KPIs show wrong values  
**Solution:** Check `/api/data/overview` response. May need to clear cache or restart backend.

**Issue:** Cross-filter doesn't work  
**Solution:** Check CategoryFilterContext is wired correctly in Overview page

**Issue:** `pnpm build` fails  
**Solution:**
- Run `pnpm lint` first to see TypeScript errors
- Check for missing dependencies (`pnpm install`)
- Check Next.js 16 compatibility issues

### General Issues

**Issue:** "Port already in use"  
**Solution:** Kill existing process on port 8000 or 3000, or change port in config

**Issue:** Verification takes > 10 minutes  
**Solution:** 
- Run scripts in parallel where possible
- Skip RO tests if AI module already validated
- Frontend checklist can be done while scripts run

---

## 7. Pre-Demo Checklist

Run this checklist 30 minutes before demo:

- [ ] **Prerequisites met** (backend running, frontend running, CSV files present, API key set)
- [ ] **Backend verification** passes (9/9 tests)
- [ ] **AI flow verification** passes (all 7 steps)
- [ ] **RO test cases** pass (5/5 tests)
- [ ] **Frontend checklist** complete (8 routes, 13 charts, 4 KPIs, cross-filter, build)
- [ ] **No console errors** in browser DevTools
- [ ] **Demo data ready** (know which prompts to use for demo)
- [ ] **Backup plan** (if Gemini API fails, have pre-generated examples)

**Estimated time:** 10 minutes

**If any step fails:** Use troubleshooting section above. If issue persists, document it and prepare workaround for demo.

---

## 8. Continuous Verification

During development, run verification incrementally:

- **After backend changes:** Run `backend/verify_backend.ps1`
- **After AI module changes:** Run `tests/verify_ai_flow.ps1`
- **After frontend changes:** Run `pnpm lint` and check affected routes manually
- **Before committing:** Run full verification suite
- **Before demo:** Run pre-demo checklist

---

## Summary

**Total verification time:** < 10 minutes  
**Scripts:** 3 PowerShell scripts (backend, AI flow, RO tests)  
**Manual checks:** 1 frontend checklist (~5 min)  
**Pass criteria:** All tests pass + build succeeds + no console errors  
**Troubleshooting:** See section 6 above

**Questions?** Check `PLAN.md` §Verification plan or `REQUIREMENTS.md` §11 Definition of Done.
