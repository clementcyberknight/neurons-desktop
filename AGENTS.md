# Neurons Engineering Charter & Agent Guidelines (AGENTS.md)

This document defines the strict engineering, architectural, performance, security, and type-safety
standards for all AI agents and developers contributing to the **Neurons Desktop** codebase (Electron).

Read this entire document before writing or modifying any code. If a change conflicts with this
charter, stop and flag it — do not silently deviate.

---

## 0. Required Reading Before Touching Electron Code

Every agent must read (or re-confirm familiarity with) the following official Electron docs before
building, refactoring, or reviewing Electron-specific code. These are not optional background reading —
several of the rules below only make sense with this context:

- **Process Model** — https://www.electronjs.org/docs/latest/tutorial/process-model
- **Security Guidelines** — https://www.electronjs.org/docs/latest/tutorial/security
- **Context Isolation** — https://www.electronjs.org/docs/latest/tutorial/context-isolation
- **IPC (Inter-Process Communication)** — https://www.electronjs.org/docs/latest/tutorial/ipc
- **Preload Scripts** — https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
- **Performance** — https://www.electronjs.org/docs/latest/tutorial/performance
- **App Packaging (electron-builder)** — https://www.electron.build/
- **Process Sandboxing** — https://www.electronjs.org/docs/latest/tutorial/sandbox
- **Native Node Modules** — https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
- **Worker Threads (Node.js)** — https://nodejs.org/api/worker_threads.html (relevant for the local AI model, see §6)

---

## 1. Zero-Type-Cheating Policy (Strict TypeScript)

> **Rule:** Every single line of TypeScript in this repository must be predictable, type-safe, and self-documenting. Type cheating compromises runtime safety and breaks developer ergonomics.

- **Prohibition of `any`**: The use of `any`, `(x as any)`, `Record<string, any>`, or similar loose type escapes is strictly forbidden.
- **Prohibition of `unknown` as an Escape Hatch**: `unknown` should only be used where data is truly unbounded at the boundary (e.g. raw JSON deserialization, IPC payloads, LLM output), and must be narrowed immediately with type guards before use.
- **Explicit Domain Types**: Always use explicit union types, enums, or indexed database interfaces (e.g., `POSTransaction['status']`, `FinanceRecord['paymentType']`).
- **Discriminated Unions**: AI schemas, component action payloads, IPC channel messages, and network messages must use discriminated unions (e.g., `LLMOutputSchema` discriminated by `output_type`, `IpcRequest` discriminated by `channel`).
- **Platform & Window APIs**: Platform APIs (Electron IPC, Browser APIs) must be typed via ambient declaration files (`src/types/*.d.ts`) rather than `(window as any)`.

---

## 2. Electron Process Architecture & Security Standards

Neurons must follow Electron's official process model and security checklist without exception.
These are non-negotiable — violating them is treated the same as introducing an `any` type.

### 2.1 Process Separation

- **Main process**: owns windows, native menus, filesystem, the database, and the local AI model runtime. No UI/DOM code here.
- **Renderer process**: UI only. Must never have direct Node.js or filesystem access.
- **Preload script**: the _only_ bridge between renderer and main, exposed via `contextBridge.exposeInMainWorld`.

### 2.2 Mandatory Security Flags

Every `BrowserWindow` must be created with:

```ts
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // required, never false
    nodeIntegration: false, // required, never true
    sandbox: true, // required unless a documented native-module exception exists
    preload: path.join(__dirname, "preload.js"),
  },
});
```

- `nodeIntegration: true` or `contextIsolation: false` is an automatic PR rejection, no exceptions.
- Never disable `webSecurity`.
- Validate and sanitize every value crossing the preload bridge — treat renderer input as untrusted, the same way you'd treat a network request.

### 2.3 IPC Discipline

- All IPC channels must be named, typed, and enumerated in a single `src/types/ipc.d.ts` (discriminated union of channel → payload → response).
- Use `ipcMain.handle` / `ipcRenderer.invoke` (promise-based) over `send`/`on` for request/response patterns.
- Never expose a generic `ipcRenderer.send`/`invoke` passthrough in the preload script — expose specific, narrow functions (e.g. `getTransactions(page)`, not `invoke(channel, ...args)`).

---

## 3. Performance, Speed & Smoothness

Electron apps feel slow when the main thread blocks or when the renderer does heavy work. Follow these
rules to keep Neurons responsive at 100k+ records and with a local model resident in memory.

### 3.1 Startup Performance

- Defer non-critical `require`/`import` calls until after the window is shown (lazy-load heavy modules).
- Use `app.whenReady()` correctly — do not do heavy synchronous work before `ready`.
- Show the window only after first meaningful paint (`ready-to-show` event), not immediately on construction, to avoid a blank white flash.
- Keep the main process bundle lean; avoid pulling large libraries into main if they're only needed in a worker.

### 3.2 Never Block the Main or Renderer Thread

- Any CPU-heavy work (DB aggregation, file parsing, AI inference) must run off the main UI-affecting thread — use `utilityProcess` (Electron) or `worker_threads` (Node), never inline in `ipcMain.handle`.
- The renderer's JS thread must stay free for input/paint — heavy computation belongs in main or a worker, not in a React event handler.

### 3.3 Rendering Smoothness

- Virtualize all long lists/tables (e.g. `@tanstack/react-virtual`) — never render 1,000+ DOM rows at once.
- Debounce/throttle search, filter, and resize handlers.
- Avoid layout thrashing: batch DOM reads/writes, avoid synchronous style reads in loops.
- Use `will-change`/GPU-friendly CSS transforms sparingly and only where profiling shows benefit — don't apply blindly.

### 3.4 Memory

- Profile with Chrome DevTools' Memory tab and Electron's `process.getProcessMemoryInfo()` regularly on the 100k-record dataset.
- Destroy `BrowserWindow`/`webContents` references and remove all listeners on window close.
- Watch for detached DOM nodes and closures retaining large arrays (a common leak source when a `.toArray()` snuck in — see §5.1).

---

## 4. Component Architecture & State Management

- **Modular UI Components**: Reusable UI blocks (tables, modals, notification banners, metric cards) must live in `src/components/ui/` (e.g. `<DataTable>`, `<ConfirmDeleteModal>`, `<Toast>`).
- **Zero Inline Code Duplication**: Do not duplicate table rendering, pagination toolbars, or action dropdowns in individual modules. Always leverage shared generic components.
- **Event Listener & Timer Cleanups**: Every `addEventListener`, `setTimeout`, `setInterval`, or Electron IPC listener (`ipcRenderer.on`) inside `useEffect` MUST return a cleanup function to prevent memory leaks in long-running desktop sessions.
- **Memoization of Heavy Calculations**: Wrap column definitions, filter pipelines, and action arrays in `useMemo` / `useCallback` to prevent unnecessary component re-renders.

---

## 5. Local-First Database, Sync Integrity & Scalability (100,000+ Records)

Neurons is designed to run offline-first with blistering speed even when managing **100,000+ transaction records** on low-spec hardware.

### 5.1 Unbounded Queries are Strictly Forbidden

- **Never call `.toArray()` on unbounded collections.** Loading 100,000 objects into the JavaScript heap consumes ~100MB+ RAM and locks the V8 garbage collector, causing UI freezes and dropped frames.
- **Always paginate at the database layer:**

  ```ts
  // ✅ Correct: Database-level pagination
  const totalCount = await query.count();
  const pageItems = await query
    .offset((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  // ❌ Prohibited: In-memory slicing of full tables
  const all = await db.transactions.toArray();
  const pageItems = all.slice(start, start + pageSize);
  ```

### 5.2 Streaming Cursor Aggregations for KPIs

- When computing summary metrics (e.g., total sales revenue, total expense outflow, average ticket size), use cursor iteration (`.each()`) or indexed ranges rather than materializing 100k arrays:
  ```ts
  // ✅ Correct: Streaming iteration without array allocation
  let totalRevenue = 0;
  await db.transactions.each((txn) => {
    totalRevenue += txn.totalAmount;
  });
  ```

### 5.3 Compound & Sorting Indexes in Dexie

- Every query filter and sort combination must be backed by an index in `src/db/localDb.ts`.
- Use Dexie compound indexes (e.g., `[type+transactionDate]`, `[status+createdAt]`, `[category+updatedAt]`) to enable sub-millisecond range scans across 100k+ records.

### 5.4 Database Instance & Audit Fields

- **Database Instance**: `db` from `@/db/localDb.ts` is the single source of truth for all business data.
- **Audit Fields**: Every database record must include standard timestamps and sync flags:
  - `createdAt: number` (epoch timestamp)
  - `updatedAt: number` (epoch timestamp)
  - `synced: 0 | 1` (0 = pending sync to cloud, 1 = synced)
- **Immutable Financial Records**: Financial ledger items must maintain traceable IDs, reference numbers, and timestamps.

---

## 6. Local AI Model Integration (~800MB, On-Device Inference)

Neurons will ship a local AI model (~800MB on disk) that runs entirely on-device — no data leaves the
machine for inference. This is a first-class architectural concern, not a bolt-on feature.

### 6.1 Where the Model Lives and Runs

- Model inference **must** run in the **main process via a dedicated `utilityProcess`** (preferred) or a `worker_threads` worker — never in the renderer, and never inline in `ipcMain.handle` blocking the main event loop.
- The model file itself should not be bundled inside the ASAR archive (`asar: false` for that resource, or `extraResources` in electron-builder) — large binary blobs inside ASAR hurt startup and packaging performance.
- Load the model lazily, only when the AI feature is first invoked, or during an explicit "warming up" step after `ready-to-show` — never synchronously during app boot.

### 6.2 Memory & Resource Management

- 800MB resident in RAM is significant on low-spec hardware — treat it as a scarce shared resource:
  - Only one model instance loaded at a time; never spin up duplicate instances per window/tab.
  - Provide an explicit unload/dispose path (e.g. after N minutes idle) if memory pressure is detected.
  - Monitor total app memory (`process.getProcessMemoryInfo()` across processes) and surface a warning in dev builds if the AI process pushes the app over an agreed ceiling.
- Stream inference output token-by-token back over IPC (`ipcRenderer.on` subscription, not a single blocking `invoke`) so the UI stays responsive and the user sees progressive output.

### 6.3 Type Safety for Model I/O

- Model requests/responses must be discriminated unions in `src/types/ai.d.ts` (e.g. `AIRequest` discriminated by `task`, `AIResponse` discriminated by `status: 'streaming' | 'done' | 'error'`).
- Never type raw model output as `any` — validate/narrow it with a schema (e.g. zod) at the boundary where it re-enters typed application code.

### 6.4 Packaging

- Confirm the packaged installer size and first-run download strategy with the team before bundling — 800MB affects installer size, auto-update payloads, and first-run experience. Consider downloading the model on first run instead of bundling it, if update bandwidth is a concern.

---

## 7. Optimization Techniques Checklist

Apply these proactively, not just when something is measured as slow:

- [ ] Lazy-load routes/screens and heavy dependencies (code-splitting in the renderer bundle).
- [ ] Virtualize all long lists and tables.
- [ ] Debounce search/filter inputs (150–300ms) before hitting the database.
- [ ] Use compound Dexie indexes for every filter+sort combination (§5.3).
- [ ] Use `.each()`/cursor iteration for aggregation, never `.toArray()` on full tables (§5.1–5.2).
- [ ] Run AI inference and any CPU-heavy work in a `utilityProcess`/worker thread (§3.2, §6.1).
- [ ] Stream long-running results (AI tokens, large exports) over IPC instead of one big payload.
- [ ] Memoize expensive derived data and stable callbacks (`useMemo`/`useCallback`).
- [ ] Clean up every listener/timer/IPC subscription on unmount (§4).
- [ ] Profile startup time, memory, and interaction latency on low-spec hardware, not just dev machines.
- [ ] Keep main-process bundle size small; avoid importing renderer-only or heavy libraries into main.

---

## 8. Do / Don't Summary

**Do:**

- Do keep `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on every window.
- Do expose a narrow, typed API surface from the preload script.
- Do paginate and index every database query touching a growing table.
- Do run the local AI model in a separate process/thread from the UI.
- Do stream AI output and long-running results back to the renderer incrementally.
- Do write ambient `.d.ts` declarations for every platform/window API.
- Do clean up listeners, timers, and IPC subscriptions on unmount/close.

**Don't:**

- Don't set `nodeIntegration: true` or `contextIsolation: false`, ever.
- Don't call `.toArray()` on an unbounded/growing collection.
- Don't run AI inference or heavy computation inline on the main or renderer thread.
- Don't use `any`, `(x as any)`, or untyped `Record<string, any>` anywhere.
- Don't expose a generic passthrough `invoke(channel, ...args)` from the preload script.
- Don't bundle the 800MB model inside ASAR without checking startup/packaging impact.
- Don't block `app.whenReady()` or window creation with synchronous heavy work.
- Don't duplicate table/pagination/modal UI instead of using shared components.

---

## 9. Verification Checklist for Every Change

Before completing any task or pull request, verify:

1. `npx tsc --noEmit` passes with **0 errors**.
2. Zero instances of `as any` or `any` added.
3. No unbounded `.toArray()` calls introduced on growing tables (`transactions`, `finance`, `inventory`, `documents`).
4. All open/close modals, menus, listeners, and timers properly clean up on unmount.
5. No `BrowserWindow` created with `nodeIntegration: true` or `contextIsolation: false`.
6. Any new IPC channel is typed as a discriminated union in `src/types/ipc.d.ts`.
7. Any AI/inference work runs off the main UI thread and streams results back over IPC.
8. Memory and startup-time impact has been sanity-checked on a low-spec profile, especially for changes touching §5 or §6.
