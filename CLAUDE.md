# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WordLoop (`app.json` name; package name `@workspace/mobile`) is an Expo/React Native prototype for learning English vocabulary through themed stories, quizzes, and flashcards. It runs on iOS, Android, and web via `react-native-web`. All content is Turkish-UI with English learning material; there is no real backend — everything is mock/local data and in-memory context state.

This app was originally scaffolded/iterated on in Replit; some scripts (`scripts/build.js`, `dev` script in `package.json`) reference Replit-specific env vars (`REPLIT_DEV_DOMAIN`, `REPL_ID`, etc.) and are not required for local development outside that environment.

## Commands

Package manager is `pnpm` (see `dev`/`build` scripts), though `npm` lockfiles are also present — check which is in use before installing.

- `pnpm exec expo start` — start the Metro dev server (the `dev` script in `package.json` wraps this with Replit-only env vars; run `expo start` directly for local work)
- `pnpm typecheck` — `tsc -p tsconfig.json --noEmit`, no separate lint script exists
- `node scripts/build.js` — produces a static Expo Go deployment bundle (starts Metro, downloads iOS/Android bundles+manifests, rewrites asset URLs); requires a reachable deployment domain env var (`REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or `EXPO_PUBLIC_DOMAIN`)
- `node server/serve.js` — zero-dependency Node HTTP server that serves the `static-build/` output produced by `build.js`, plus an Expo manifest endpoint (routes on the `expo-platform` header) and a landing page

There is no test suite in this repo.

## Architecture

**Routing.** File-based routing via `expo-router`, with typed routes enabled (`experiments.typedRoutes` in `app.json`). All screens live under `app/`. The root stack is declared explicitly in `app/_layout.tsx` (every route must be registered there as a `<Stack.Screen>`). `app/(tabs)/` is a route group holding the bottom-tab screens (`home`, `explore`, `stories`, `words`, `profile`).

**Bottom nav bar placement rule.** The tab bar (`app/(tabs)/_layout.tsx`, `CustomTabBar`) is only visible for screens that live inside `app/(tabs)/`. When a new screen belongs to one of the tabs (i.e. it's a sub-screen reached by drilling into "Kelimelerim", "Keşfet", etc.), it must be added to that tab's own nested route group with its own `_layout.tsx` `<Stack>` — e.g. `app/(tabs)/words/` (`index` + `all`) and `app/(tabs)/explore/` (`index` + `word-cards-hub`) are the reference pattern. Do **not** register it as a sibling `<Stack.Screen>` in the root `app/_layout.tsx` — that renders it outside the `Tabs` navigator and the bottom nav bar disappears. Registering a new screen in the root stack is only correct for genuinely tab-bar-less flows (onboarding/auth, the `create.tsx` flow-start screen reached from the tab-agnostic FAB, and immersive learning-session/practice screens like `learn/*`, `flashcards-practice`, `story-reader`). When in doubt, ask: "does this screen belong to exactly one tab's drill-down flow?" — if yes, nest it under that tab; if it's a cross-tab or full-screen flow, root stack is correct.

**Primary user flow** (see `HANDOFF_NOTES.md` §5 for the canonical description):
1. `app/index.tsx` (onboarding) → `app/auth.tsx` (login/signup) → `app/(tabs)/home.tsx`
2. From home, the "+" action opens `app/create.tsx`, which branches into two flows:
   - **Kelimeler (words) flow**: `words-info` → `words-entry` → `story-loading` → `learn/*`
   - **Görseller (images/themes) flow**: `themes` → `theme/[id]` → `scene/[id]` → `learn/*`
3. `learn/story.tsx` → `learn/quiz.tsx` → `learn/flashcards.tsx` → `learn/summary.tsx` is the shared learning session sequence, driven by a `LearnSession` object (see `data/mock.ts`) that is set into `ProgressContext` via `startSession()`.

**State.** `context/ProgressContext.tsx` is the single global state container (React Context, no Redux/Zustand). It tracks `recentWords`, `customStories`, per-theme level-unlock progress (`themeProgress`), and the `currentSession` being learned. `@tanstack/react-query`'s `QueryClient` is also mounted at the root (`app/_layout.tsx`) but there are no real network calls yet — it's scaffolding for future API integration.

**Mock data.** `data/mock.ts` is the sole source of learning content: word dictionary, themes/scenes, stories, quiz generation. It defines the core domain types (`Word`, `Story`, `Scene`, `Theme`, `QuizQuestion`, `LearnSession`) that flow through the whole app — read this file first when tracing how content is shaped. New sample content should follow its existing generator patterns rather than being hand-authored inline elsewhere.

**Design system.** The app is intentionally dark-only (violet/neon "premium" aesthetic); `constants/colors.ts` defines a single palette used for both `light` and `dark` keys, so `useColorScheme()` has no visible effect. Always read colors through `hooks/useColors.ts` (`useColors()`) rather than importing `constants/colors.ts` directly in screens. Shared visual primitives to reuse instead of rebuilding:
- `GradientBackground` — atmospheric violet-glow background, wraps most screens
- `GlowCard` — the standard card surface
- `PrimaryButton` — the standard CTA button
- `ScreenHeader`, `AnimatedReveal`, `Chip` — header, reveal animation, and pill/tag primitives

`constants/app.ts` exports `APP_NAME`; never hardcode the app name elsewhere.

**Path aliasing.** `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/components/GlowCard`, `@/data/mock`.

**Error handling.** `components/ErrorBoundary.tsx` (class component, required by React for catching render errors) + `components/ErrorFallback.tsx` wraps the whole app in `app/_layout.tsx`.

## Working in this codebase

`HANDOFF_NOTES.md` (Turkish) documents standing product/design constraints from prior work; the rules below are the binding, expanded version of it and apply to every task unless the user explicitly overrides them for that task. Act as a mobile frontend developer continuing the existing Replit-produced design language — never reinvent it, and never design a new screen without a screenshot/reference from the user.

**Protected reference screens.** Do not redesign, restyle, simplify, or change spacing/font/radius/glow on these. Only touch them for a minimal fix if something is technically broken:
- `app/index.tsx` (onboarding)
- `app/auth.tsx` (login/signup)
- `app/(tabs)/home.tsx` (ana sayfa)
- `app/create.tsx` (the flow-start screen opened by the home "+" button)

**Design standard for new screens.** Dark/black/violet premium background, violet/magenta neon glow, rounded cards, glass feel, controlled gradients, large-but-not-oversized headings, readable body text, consistent spacing, responsive (no overflow on iPhone/Android). New screens must look like they belong to the same family as the protected screens — not a generic, heavy-fonted, unevenly-spaced demo screen.

**Scope discipline.** Do exactly the screen/task given — no whole-app refactors, no inventing extra screens, no touching working navigation beyond wiring the one new route/button needed. If a screen comes out wrong, prefer a clean replacement over messy incremental commits.

**Forbidden regardless of task:** adding a backend, API, database, Supabase/Firebase, real OpenAI/AI integration, real auth, payments, analytics, or deploy/publish actions; unnecessary `npm`/`pnpm install`s or new heavy dependencies; project-wide refactors; unnecessary changes to the existing navigation structure; edits to protected screens.

**Data rule.** Everything is local/mock — no real user data, real uploads, real AI analysis, or real database. Buttons that need a backend can open a frontend-only placeholder or mock flow instead.

**Language rule.** All visible UI text is Turkish. English is only for the vocabulary content itself (learned words, example sentences) since that's the subject matter. Technical/file names stay English.

## Assets

Do not add assets uncontrolled:
- Never `require()`/`import` an image file that doesn't exist in `assets/`.
- Never commit new `.png`/`.jpg`/`.webp`/`.svg` or docs/review/screenshot assets without explicit need.
- Never add reference images to the repo.

If a screen needs imagery: first try to build the illustration feel with `View`/`LinearGradient`/icons/glow/shapes (no asset). If a real asset is genuinely required, ask the user for explicit approval first — don't add it silently. If approved, the file must actually be added under `assets/` and called out in the PR description.

## Testing

Before calling a task done, run what you can:
- `npx tsc -p tsconfig.json --noEmit` (or `pnpm typecheck`)
- Leave the app in a state where `npx expo start --clear` can be used for manual verification

If a check couldn't be run, say so explicitly and explain why — never report a test as passing when it wasn't actually run or when it failed.

## Branches & PRs

- For each significant UI task, branch fresh from `main` — don't keep pushing onto a branch that's already messy/outdated.
- If a screen came out wrong, open a new clean replacement PR rather than layering fix commits onto a bad one.
- Before opening a PR, run `git diff --name-status origin/main...HEAD` and confirm only the files relevant to the task changed — clean up first if anything else is there.
- PR description must include: changed files; which route(s) changed; explicit confirmation protected screens were not touched; explicit confirmation no backend/API/database/auth/payment/analytics/deploy was added; explicit answer ("Hayır" if true) on whether any new binary/image/docs asset was added; and the test result (including any test that couldn't be run and why).

## UI quality self-check

Before considering a screen finished, verify: it visually belongs to the same family as the protected/Replit screens; fonts aren't heavy/coarse; cards aren't oversized or too narrow; no text is clipped; no icon/text overlap; the CTA is clear; it doesn't overflow on mobile; the glow reads as premium, not muddy; there's no wasted/awkward whitespace; and no protected screen was accidentally touched. If any of these fail, the task isn't done.
