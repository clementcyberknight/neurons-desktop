# 🏢 BAU Copilot (Neurons) — Modular Offline Business OS

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Electron](https://img.shields.io/badge/Electron-35.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Dexie](https://img.shields.io/badge/Dexie.js-IndexedDB-2563EB)](https://dexie.org/)
[![Model](https://img.shields.io/badge/Model-bau--small--1.5b-10B981?logo=huggingface&logoColor=white)](https://huggingface.co/cyberknine/bau-qwen)

**BAU Copilot** is a high-performance, **modular, offline-first desktop business operating system** built specifically for African small-and-medium enterprises (SMEs). Powered by a fine-tuned edge language model (`bau-small-1.5b.gguf`), BAU Copilot enables local retail stores, pharmacies, warehouses, and distributors to manage staff payroll, inventory, point of sale, tasks, and financials with **zero cloud dependencies** and **sub-second edge inference**.

---

## ✨ Key Features & The 6 Core Modules

```
+-------------------------------------------------------------------+
|  📄 Documents   |  📊 POS & Sales  |  📦 Inventory & Zones        |
|  👨 Staff Rota  |  📈 Finance P&L  |  📃 Kanban Task Management   |
+-------------------------------------------------------------------+
```

### 1. 📄 Documents & SOPs
- Notion-style rich Markdown workspace for store guidelines, tax filing checklists, and operational memos.
- Autonomous AI document generation (`DOCUMENT_OUTPUT` schema) with live editing and instant persistence.

### 2. 📊 Point of Sale (POS) & Cashier Reconciliation
- Real-time cashier checkout terminal with instant barcode scanning, discount calculations, and automatic inventory stock deduction.
- **Fraud & Anomaly Guard**: Flags unauthorized discount overrides and float shortfalls in real time (`RED_FLAG_ALERT` schema).

### 3. 📦 Warehouse & Stock Inventory
- Multi-zone warehouse tracking (**Zone A–D**: Pharmaceuticals, Supplies, FMCG, and Equipment).
- Interactive **Generative SKU Distribution Charts** (`GENERATIVE_CHART` schema) with low-stock threshold alerts.

### 4. 👨 Staff Directory & Shift Schedulers
- Employee directory with role assignments, hourly rate calculations, and monthly payroll tracking.
- Interactive weekly shift rota board (Monday–Sunday) with **1-Click AI Rota Generation** (`SHIFT_SCHEDULE` schema).

### 5. 📈 Finance & P&L Analytics
- Real-time gross profit, expenditure tracking, and net profit margin KPI calculations.
- Integrated **Deep Research Forensic Auditing** (`DEEP_RESEARCH` schema) to investigate expense variances.

### 6. 📃 Kanban Task Board
- 3-Column Task Management (`To Do`, `In Progress`, `Done`) with priority badges (`HIGH`, `MEDIUM`, `LOW`).
- **1-Click AI Task Creation** (`AUTO_TASK` schema) directly linked to audit logs and store action items.

---

## 🤖 100% Offline AI Copilot

BAU Copilot features a ChatGPT-style sliding assistant drawer (`Ctrl + K`) integrated directly with the local inference engine.

- **Base Model:** Qwen2.5-1.5B-Instruct
- **Quantization:** `IQ3_XS` (GGUF, ~698 MB binary footprint)
- **Peak RAM Usage:** **892.4 MB** (< 0.87 GB / 7.0 GB ADTC hardware budget)
- **Time to First Token (TTFT):** **~510 ms** on standard 4-thread CPU
- **Local JSON Schema Support:** 
  - `GENERATIVE_CHART`, `RED_FLAG_ALERT`, `SHIFT_SCHEDULE`, `AUTO_TASK`, `DOCUMENT_OUTPUT`, `DEEP_RESEARCH`, `CONVERSATIONAL_CHAT`, `TOOL_CALL`, `ACTION_CONFIRMATION`

---

## 🛠️ Architecture & Tech Stack

```
neurons/
├── electron/
│   ├── main.ts            # Electron main process & IPC window lifecycle
│   ├── preload.ts         # Secure contextBridge API bindings
│   └── ai-bridge.ts       # Local llama-server connector & offline engine
├── src/
│   ├── components/
│   │   ├── ai/            # Schema renderers (Chart, Schedule, Alert, Task, Doc)
│   │   │   ├── CopilotDrawer.tsx
│   │   │   ├── GenerativeChartCard.tsx
│   │   │   ├── ShiftScheduleCard.tsx
│   │   │   ├── RedFlagAlertCard.tsx
│   │   │   ├── AutoTaskCard.tsx
│   │   │   ├── DeepResearchCard.tsx
│   │   │   └── SchemaRenderer.tsx
│   │   └── layout/        # Notion-style sidebar, top header, & shell
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── AppLayout.tsx
│   ├── db/
│   │   ├── localDb.ts     # Dexie.js (IndexedDB) multi-table reactive database
│   │   ├── seedData.ts    # Initial African SME seed records (Pharma, Retail)
│   │   └── syncEngine.ts  # Network observer & cloud synchronization queue
│   ├── modules/           # The 6 core application modules
│   │   ├── documents/
│   │   ├── pos/
│   │   ├── inventory/
│   │   ├── staff/
│   │   ├── finance/
│   │   └── tasks/
│   ├── types/             # TypeScript schemas & DB entity models
│   ├── App.tsx            # Main application router
│   ├── main.tsx           # React DOM root entry
│   └── index.css          # Tailwind CSS v4 design system
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (Node v22+ recommended)
- **npm**: v9.0.0 or later

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
*Launches Vite HMR with live Electron desktop window.*

### 3. Build Production Bundle
```bash
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open / Close AI Copilot Assistant Drawer |
| `Escape` | Dismiss modal dialogs / drawers |

---

## 📊 ADTC 2026 Benchmark Performance

Tested under **African Deep Tech Challenge 2026** Standard Laptop constraints (Intel Core i5 / Ryzen 5, 8 GB RAM, CPU-only):

| Metric | Measured Value | Constraint / Target | Status |
| :--- | :--- | :--- | :--- |
| **Peak Memory Footprint** | **892.4 MB** | $\le 7,000\text{ MB}$ (7.0 GB) | ✅ **PASS** |
| **Time to First Token (TTFT)** | **510 ms** | $\le 2,500\text{ ms}$ | ✅ **PASS** |
| **Prompt Evaluation Speed** | **9.1 t/s** | CPU 4 threads | ✅ **PASS** |
| **Generation Speed** | **3.76 t/s** | CPU 4 threads | ✅ **PASS** |
| **Schema Accuracy Score** | **95.2 / 100** | JSON Schema Adherence | ✅ **PASS** |
| **Thermal Throttle Penalty** | **0.00 pts** | $P_{\text{thermal}}$ | ✅ **PASS** |

---

## 📜 License

Distributed under the **Apache-2.0 License**. See `LICENSE` for details.

**Author:** Akhimien Clement ([@clementcyberknight](https://github.com/clementcyberknight))  
**Hugging Face Model:** [cyberknine/bau-qwen](https://huggingface.co/cyberknine/bau-qwen)
