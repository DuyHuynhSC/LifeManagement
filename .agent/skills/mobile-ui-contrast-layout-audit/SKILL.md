---
name: mobile-ui-contrast-layout-audit
description: >-
  Audits and enforces mobile UI design standards, preventing text overlap, font truncation,
  and low contrast or illegible text in dark theme. Use when designing, building, reviewing,
  or fixing mobile navigation, bottom bars, forms, cards, and dark theme / light theme styling.
---

# Mobile UI Contrast & Layout Audit Skill

This skill defines mandatory UX, accessibility (WCAG), and responsive design rules for mobile web and native hybrid applications (React, Tailwind CSS, Capacitor), specifically preventing **text overlapping**, **layout distortion on narrow mobile screens**, and **low-contrast illegible text in Dark Mode**.

---

## 1. Dark Mode Contrast & Readability Rules

### 1.1 Strict Color Ratios (WCAG AA & AAA Compliance)
* **Primary Text on Dark Backgrounds**:
  * Use `text-slate-900 dark:text-white` or `dark:text-slate-100`.
  * Avoid raw white on transparent surfaces without an explicit dark card background.
* **Secondary / Subtitle / Description Text**:
  * **RULE**: Secondary text on dark backgrounds (`#0f172a` or `#1e293b`) MUST use `dark:text-slate-300` or `dark:text-slate-200` with `font-medium` (500 weight).
  * ❌ **NEVER USE**: `dark:text-slate-400` or `dark:text-slate-500` for readable body/description text in dark mode. On OLED and mobile displays under ambient light, contrast drops below 3:1, rendering the text washed out or unreadable.
* **Inactive Nav Labels & Icons**:
  * Use `text-slate-500 dark:text-slate-300` (or `dark:text-slate-400` minimum for purely decorative non-text icons).
* **Card & Container Backgrounds**:
  * On dark mode base (`dark:bg-slate-900`), cards must use distinct elevated surfaces: `dark:bg-slate-800` with `dark:border-slate-700/80`.
  * Active/selected items: `dark:bg-indigo-950/60 dark:border-indigo-400 dark:text-indigo-200`.

### 1.2 Tailwind Class Validity
* ❌ **NEVER INVENT** non-standard Tailwind shade names (e.g. `slate-750`, `slate-850`, `gray-350`, `indigo-450`). Tailwind only generates `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`.
* If an in-between color is truly required, use arbitrary hex values (e.g. `dark:bg-[#1a2333]`) or configure `tailwind.config.js`. Prefer standard `slate-800` and `slate-700`.

### 1.3 Modals, Voice Results & Admin Panel Forms
* **Modal Surface Elevation**:
  * Base modal container: `bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800`.
  * Sub-card surfaces within modal: `bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700`.
  * Deep nested cards / metric tiles: `bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80`.
* **Voice Recognition & Dynamic Previews**:
  * Identified text: High-contrast `text-slate-900 dark:text-indigo-300 font-medium italic`.
  * Metric values: `text-slate-900 dark:text-white` or `dark:text-emerald-400 font-extrabold`.
  * Category badges: `bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 font-bold`.
* **Admin Panel & Role Badges**:
  * Badge labels must have high-contrast text on dark surfaces (e.g. `dark:bg-amber-950 dark:text-amber-300 font-extrabold` for Admin, `dark:bg-indigo-950 dark:text-indigo-300` for Manager).
  * Tab switches in modals: Active tabs use `dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold`, inactive tabs use `text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white`.

---

## 2. Mobile Bottom Navigation & Tab Layout Rules

### 2.1 The "Max 5 Tabs" Rule for Mobile Viewports
* On standard smartphones (viewport width 360px - 390px):
  * **5 tabs maximum** per navigation bar: Allocates ~72px per tab, giving adequate width for 44px touch targets and two-word labels (e.g., "Tổng quan", "Chi tiêu", "Đồ dùng").
  * ❌ **NEVER SQUEEZE 6+ TABS** into a single bottom row. At 6–8 tabs, each tab gets < 50px. Multi-word labels will either truncate to unreadable strings or overflow into adjacent tabs.
* **Pattern for 6+ Tabs**:
  * Pin the top 4 primary tabs.
  * Use the 5th tab as a dynamic **"Thêm" (More)** button opening a slide-up Bottom Sheet Modal.
  * If a secondary screen is active, the 5th tab dynamically reflects that screen's icon and title.

### 2.2 Preventing Text Spills & Overlaps
* Avoid bare `whitespace-nowrap` on dense flex layouts without strict `max-w` or width budgeting:
  * When `whitespace-nowrap` is used, ensure the container width is budgeted and label font size is constrained (e.g. `text-[10px] xs:text-[11px]`).
  * Tab buttons must use `flex-1 text-center min-w-0` to avoid taking unbounded space.
  * For multi-word labels that may wrap, use `leading-tight text-center line-clamp-2` or a dedicated short-label alias.

---

## 3. Mobile Form Inputs & Numeric Precision

### 3.1 Currency and Number Inputs
* ❌ Avoid `type="number"` with native spinners and unwanted zero formatting.
* ✅ Use `type="text" inputMode="numeric"`:
  * Always strip leading zeros when the user types (e.g., typing `5` should change `0` to `5`, not `05`).
  * On focus: if the current value is `0`, auto-clear or select all to prevent the user from having to backspace the zero.
  * Format display with thousands separators (e.g., `100,000` or `100.000` according to locale).

### 3.2 Mobile Keyboard Zoom Prevention
* All input elements on mobile must have a base font size of at least `16px` (`text-base` in Tailwind) to prevent iOS Safari and Android Chrome from automatically zooming the viewport when the input is focused.

---

## 4. Pre-Commit Quality & Audit Checklist

Before concluding any UI change involving mobile screens or dark mode:
- [ ] **Contrast Check**: Is any body or description text using `dark:text-slate-400` or `slate-500`? (Must be upgraded to `dark:text-slate-300` or `white`).
- [ ] **Tailwind Validation**: Are all utility classes standard Tailwind classes? (No `slate-750` or unconfigured classes).
- [ ] **Tab Overlap Check**: Does the bottom navigation have 5 or fewer tabs? Do any text labels collide on a 360px viewport?
- [ ] **OLED Legibility**: Are modal backdrops, sheets, and card borders clearly distinguishable in dark mode?
- [ ] **TypeScript & Vite Build**: Run `npm run build` to ensure 0 compile and type errors.
- [ ] **Native Sync**: If Capacitor is used, run `npx cap sync` to propagate assets to native platforms.
