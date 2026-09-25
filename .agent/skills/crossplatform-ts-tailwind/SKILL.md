# Antigravity Skill: Single Codebase Web & Mobile (Vite + TS + Tailwind + Capacitor + Shadcn UI)

## Role & Purpose
Enforces development standards for a single-codebase hybrid application running React 18, Vite 6, and Tailwind CSS 3 [image_l6_BXT.png]. The codebase is compiled for the Web and wrapped inside a native iOS/Android webview container using Capacitor 8 [image_l6_BXT.png]. The agent must ensure strict type-safety, modular UI layouts based on Shadcn UI design principles, and seamless responsive execution.

## 1. Project Stack & Compilation
*   **Target Mappings:** Ensure `vite.config.ts` builds into the dynamic folder mapped inside `capacitor.config.ts` (strictly matching `webDir: "dist"`).
*   **Routing Execution:** Implement a Hash Router (`createHashRouter` via React Router) if native platform deployment exhibits white-screen or static resource asset `404` loading issues inside native Android/iOS webviews.
*   **Chart Rendering (Recharts):** Wrap all `<ResponsiveContainer>` charts from `recharts` with explicit parent width/height boundaries [image_l6_BXT.png]. Disable high-overhead entry animations on native mobile builds to ensure standard 60fps interaction rendering.

## 2. Component Design & Shadcn UI Practices
*   **Utility Resolution:** Always style components dynamically using the custom `cn` helper to blend default designs with custom classes safely:
    ```typescript
    import { clsx, type ClassValue } from "clsx";
    import { twMerge } from "tailwind-merge";
    
    export function cn(...inputs: ClassValue[]) {
      return twMerge(clsx(inputs));
    }
    ```
*   **Component Modularity:** Isolate customized Shadcn blocks inside `src/components/ui/`. Do not perform inline modification of raw vendor dependencies; extend them gracefully using structural React Props.
*   **Icon Library:** Strictly utilize `lucide-react` for application imagery and interface icons [image_l6_BXT.png]. Ensure a global size metric (e.g., `className="h-5 w-5"`) is continuously bound to avoid fluid style distortion.

## 3. Cross-Platform Native Safety
*   **Runtime Checking:** Isolate desktop/browser mechanics away from native mobile calls safely using standard core checks:
    ```typescript
    import { Capacitor } from '@capacitor/core';
    const isNativePlatform = Capacitor.isNativePlatform();
    ```
*   **Plugin Abstracting:** Wrap native interactions (e.g., Camera, Preferences, Device Info) inside custom TypeScript hooks. Implement automatic web fallback models so local development in browsers does not break.

## 4. Mobile-First Tailwind Core Layouts
*   **Device Notches:** Defend all edge layouts against modern device physical notches and system status bars using structural safety padding attributes:
    *   Top: `pt-[env(safe-area-inset-top,16px)]`
    *   Bottom: `pb-[env(safe-area-inset-bottom,16px)]`
*   **Dynamic Viewports:** Avoid standard `h-screen` styling due to structural layout shifts caused by dynamic search bar overlays in mobile browsers. Utilize `h-[100dvh]` for fixed views.
*   **Touch Targets:** Ensure interactive nodes maintain a strict touch target footprint of at least `min-w-[44px]` and `min-h-[44px]`. Isolate pointer actions using hover variants (`hover:device-hover:...`).

## 5. Automation Checklist for Agent
- [ ] Are all styles combined safely using the `cn(...)` utility helper?
- [ ] Do all interactive targets provide a minimum touch target area of 44x44px?
- [ ] Are Recharts components responsive and explicitly performance-optimized for native mobile views?
- [ ] Is layout safe area padding mapped dynamically to handle smartphone screen notches?
- [ ] Does the application pass production execution checks (`tsc --noEmit` and `vite build`) flawlessly?
