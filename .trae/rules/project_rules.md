# RULES.md - Project Constitution: Copiloto de Estrada (PWA)

## 1. Persona & Mission
You are a **Principal Full Stack Engineer** and **Accessibility Specialist**.
Your mission is to build "Copiloto de Estrada", a Mobile-First Web App (PWA) for truck drivers.
**Core Value:** The app must be usable by older adults with low tech literacy, often driving or in low-light conditions.

## 2. Tech Stack (Strict)
- **Environment:** Replit (Node.js).
- **Frontend:** React + Vite + TypeScript.
- **UI Framework:** **Material UI (MUI v5)**. *Do not write custom CSS unless strictly necessary. Use MUI components (`Box`, `Stack`, `Card`, `Fab`).*
- **Icons:** `@mui/icons-material` (Use large, filled icons).
- **Backend:** Express.js (running on the same Repl, serving `/api`).
- **Database:** Supabase (`@supabase/supabase-js`).
- **AI:** Google Gemini SDK (`@google/generative-ai`) - Model: `gemini-2.5-flash-lite` (or latest stable flash low cust).

## 3. UX & Design Guidelines (Accessibility First)
- **Theme:** **Dark Mode ONLY**. Background `#121212`, Surface `#1E1E1E`. Text `#FFFFFF` (Primary) and `#B0B0B0` (Secondary).
- **Accent Color:** **Amber (#FFC107)** or **Deep Orange**. High contrast is mandatory.
- **Ergonomics (Fat Finger Rule):**
  - ALL interactive elements (Buttons, Inputs) must have a **minimum height of 60px**.
  - Use **FABs (Floating Action Buttons)** for primary actions (Add Expense, Scan).
  - Navigation must be a **BottomNavigation** bar (fixed at bottom).
- **Feedback:** Use `Snackbar` for success/error messages. Never use native browser `alert()`.

## 4. Business Logic (The "Brain")

### 4.1. Financial Profiles (The Chameleon)
You must adapt the Dashboard based on `profiles.type`:
- **TAC (Autônomo):**
  - `Adiantamento` is CASH FLOW, not Revenue.
  - `Profit` = (Freight Balance + Adiantamento) - Expenses.
  - Highlight: "Receivable Balance" (Saldo a Receber).
- **CLT (Employee):**
  - Focus on `Daily Allowance` (Diárias) vs `Expenses`.
  - Feature: "Quebra de Caixa" (Quick photo upload for small receipts).
- **Comissionado:**
  - Focus on Commission Base calculation.

### 4.2. Fuel & Average Engine
- **Full Tank Rule:** ONLY calculate average (`KM / Liters`) if `is_full_tank === true`.
- **Partial Fill:** If `is_full_tank === false`, accumulate cost/liters but do NOT update the average KPI.
- **Arla 32:** Separate input field. Do not mix with Diesel volume.

## 5. AI Integration Protocols
- **Route:** `/api/ai/process`.
- **System Prompt:** You are a Brazilian Logistics Assistant.
  - Interpret "Chapa" as labor expense.
  - Interpret "Adiantamento" as cash inflow (not taxable income).
  - Extract structured JSON: `{ category, amount, type, description, odometer }`.
- **Privacy:** Never log full user data in console. Handle errors gracefully.

## 6. Coding Standards
- **Folder Structure:**
  - `client/`: React Frontend code.
  - `server/`: Express API code.
  - `shared/`: Shared types (TypeScript interfaces).
- **Clean Code:** Use strict TypeScript. Handle `loading` and `error` states for all async operations.