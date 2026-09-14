# 🪡 Threadly Factory OS

A clean, calm, and production-ready operating system for modern clothing and garment factories. Built with **Next.js 15 (App Router)**, **Tailwind CSS**, and **Google Sheets as the live database**.

Designed to feel like **Apple Wallet** and **Linear** — floating white cards, 28px rounded corners, soft shadows, and fast 2-click workflows.

---

## 📑 Table of Contents
1. [Architecture & How It Works](#architecture--how-it-works)
2. [Quick Start: Run Locally](#quick-start-run-locally)
3. [How to Use the App (Daily Workflows)](#how-to-use-the-app-daily-workflows)
4. [Google Sheets as Your Live Database](#google-sheets-as-your-live-database)
5. [Environment Variables](#environment-variables)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Development Roadmap](#development-roadmap)

---

## 🏗️ Architecture & How It Works

Threadly uses an enterprise-grade **Repository Pattern** with a **Centralized Sync Manager**:

```text
User / Factory Owner
       │
Next.js Frontend (Framer Motion + Tailwind + Radix UI)
       │
Next.js API Routes (/api/products, /api/sales, etc.)
       │
Repository Layer (lib/repositories/*)
       │
Centralized Sync Manager (lib/sync.ts)
   ├── In-Memory Read Cache (45s TTL for fast reads)
   ├── Automatic Cache Invalidation on Mutations
   └── Exponential Backoff Write Retries
       │
Google Sheets API (v4)
       │
Your Google Spreadsheet ("sheet-backend")
```

- **Two-way Flexibility**: You can manage stock and transactions from the clean Web App, or open Google Sheets on your phone/laptop to view or edit rows directly.
- **Zero Accidental Data Loss**: Built with soft-deletes (`is_active = FALSE`) and an audit trail sheet (`StockMovements`).
- **Zero Frontend Leaks**: Google credentials remain strictly inside server-side environment variables.

---

## 🚀 Quick Start: Run Locally

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**

### 2. Installation
Clone or open the project folder in your terminal:

```bash
# Install dependencies
npm install
```

### 3. Initialize Google Sheets Schema (One-Time)
If you ever want to re-seed or verify all database sheets and sample factory data:

```bash
npm run init-sheets
```

This creates and populates the 8 tabs in your Google Sheet:
- `Products`, `StockMovements`, `Customers`, `Payments`, `Sales`, `SaleItems`, `Expenses`, `Metadata`

### 4. Start the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)** (redirects to `/inventory`)

---

## 📦 How to Use the App (Daily Workflows)

### 1. Stock & Inventory Management (`/inventory`)
The current active module is **Garments & Fabric Stock**, engineered specifically for garment manufacturing:

#### A. Viewing Real-Time Factory Floor KPIs
At the top of the page, you'll see 5 floating KPI cards calculated directly from your Google Sheet:
- **Total Garments & SKUs**: Total active styles in production.
- **In-Stock Valuation**: Total inventory value at factory manufacturing cost (`₹`).
- **Low Stock Alert**: Styles that have dropped below their minimum reorder threshold.
- **Out of Stock**: SKUs with 0 pieces available on the floor.
- **Total Ready Units**: Total pieces ready for dispatch.

#### B. Adding a New Garment (`+ Add Product`)
1. Click the black **`+ Add Product`** button in the top right.
2. Enter:
   - **SKU Code**: e.g., `CT-005`
   - **Product Title**: e.g., `Heavy Vintage Crew Tee`
   - **Category**: T-Shirts, Hoodies, Denim & Jackets, Shirts, Track Pants, etc.
   - **Fabric GSM**: e.g., `240 GSM` or `14.5 Oz`
   - **Material Description**: e.g., `100% Combed Compact Cotton`
   - **Color & Sizes**: e.g., `Matte Black` / `S, M, L, XL`
   - **Mfg Cost (₹)** & **Selling Price (₹)**: The gross margin % is calculated automatically.
   - **Initial Stock (Pcs)** & **Low Stock Alert Level**.
3. Click **Save Garment**. The garment is saved immediately to Google Sheets and an initial stock movement is logged.

#### C. Restocking or Updating Floor Stock
1. On any garment card, click **`+ Restock`** or **`Update`**.
2. Select your action:
   - **`+ Restock (Add Units)`**: Enter incoming pieces (e.g. `+50 Pcs`) and a batch note (e.g., `Batch #B-44 Arrival`).
   - **`Set Exact Count`**: Use this after a physical warehouse count to set the floor balance.
3. Click **Update Stock**. Your Google Sheet is instantly updated with the new balance, and the transaction is recorded in the audit log.

#### D. Checking Stock Movement History (`History`)
1. Click **`History`** on any garment card.
2. An audit drawer opens showing every past transaction (`IN`, `OUT`, `ADJUST`), the date, pieces count, and reason.

#### E. Filtering & Exporting
- **Category Pills**: Click *All Garments*, *T-Shirts*, *Hoodies*, or *Denim & Jackets* to filter the view.
- **Size & Status Dropdowns**: Filter by size or stock status (*In Stock*, *Low Stock*, *Out of Stock*).
- **Grid / List Toggle**: Switch between the card grid and detailed inventory table.
### 2. Customer Accounts & Khata (`/customers`)
The wholesale buyer ledger and credit management module matching `customers.png`:

#### A. Viewing Wholesale Buyer Khata & Credit
- **Split Master-Detail Layout**:
  - **Left Directory**: Lists all buyers with initials avatar, business name, tier badge (`Tier 1 Wholesale`, `Regular`), GSTIN, phone, outstanding balance due, and credit limit utilization bar (`₹ 1.11L / 1.50L Avail`).
  - **Filter Tabs**: *All Buyers*, *Pending Due*, *Overdue*, *Top Spenders*.
- **Right Profile & Ledger Details**:
  - Selected customer details: Managing Director name, phone, email, factory dispatch address.
  - **4 Key Metrics Cards**: *Current Due*, *Lifetime Volume*, *Credit Available*, and *Payment Trust (96% On-Time, Net-15)*.
  - **Credit Limit Utilization Bar**: Visual representation of credit consumed vs credit sanctioned.
  - **Purchase History & Bills**: Full list of invoices with item breakdowns, unit counts, totals, and a **`View Bill`** button opening the itemized tax invoice modal.
  - **Recent Payment & Credit Ledger Notes**: Chronological list of payments received via NEFT, Cash, and UPI with reference numbers.

#### B. Recording a Payment Received (`Record Payment`)
1. Click **`Record Payment`** on the selected customer profile.
2. Enter the amount (₹), payment method (Bank NEFT, UPI, Cash, Cheque, Bank Transfer), reference number (e.g. `NEFT9812401`), and date.
3. Click **Save Payment**.
4. The payment is logged into the `Payments` sheet in Google Sheets, the customer's outstanding balance is automatically recalculated, and the UI updates in real-time.

#### C. Adding a New Wholesale Buyer (`+ Add Customer`)
1. Click **`+ Add Customer`** in the top right.
2. Enter company name, contact person, phone, GSTIN, tier, dispatch address, and credit limit.
3. Click **Save Customer**. Saves immediately to the `Customers` sheet.

#### D. Exporting & Payment Reminders
- **`Export Statement`**: Downloads a complete CSV account statement of invoices and payment receipts for the buyer.
- **`Send Reminder`**: Dispatches instant payment reminder notice.

---

### 3. Factory Sales & Invoicing (`/sales`)
The full wholesale dispatch billing module with live stock deduction:

#### A. Real-Time Billing & Dispatch KPIs
- **TODAY'S BILLED**: Total invoiced today (`₹ 58,105`).
- **MONTHLY BILLED**: Total billed during the active production month (`₹ 3,48,200`).
- **UNPAID / KHATA DUE**: Pending balance from wholesale invoices (`₹ 1,05,055`).
- **UNITS DISPATCHED**: Total garment pieces shipped from factory floor (`485 Pcs`).

#### B. Generating a Dispatch Invoice (`+ Create Invoice`)
1. Click **`+ Create Invoice`** in the top right.
2. Select the wholesale buyer (shows current balance and sanctioned credit limit).
3. Add garment styles/SKUs from your live catalog:
   - Real-time stock validator alerts you if requested quantity exceeds warehouse stock.
   - Adjust wholesale selling price/rate per unit if special pricing applies.
   - Add multiple lines with **`+ Add Garment Lot`**.
4. Set settlement terms: **`Unpaid (Khata Due)`** to add to buyer's balance, or **`Paid (Settled)`**.
5. Click **`Generate Invoice & Dispatch`**:
   - Assigns auto-incrementing invoice number (`INV-2026-XXXX`).
   - Appends invoice to `Sales` and `SaleItems` sheets.
   - Atomically deducts stock from `Products` sheet.
   - Records an outgoing dispatch record in `StockMovements` (`type = OUT`).
   - Updates the buyer's outstanding balance in real time!

#### C. Invoices Directory & Tax Invoices
- **Filter Tabs**: *All Invoices*, *Unpaid (Khata Due)*, *Paid & Settled*.
- **View Bill**: Click to preview the tax invoice with garment lines, rates, 5% apparel GST, and total. Print-ready with 1 click.
- **Export All Sales**: Downloads the entire sales transaction ledger as CSV.

---

### 4. Expense Tracking & Overhead Management (`/expenses`)
The factory cost management and profit-protection module matching `expense.png`:

#### A. Real-Time Expense KPIs
- **Today's Expenses**: `₹ 12,450` (`↓ 18% vs yesterday`).
- **This Month**: `₹ 56,780` (`↑ 12% vs last month`).
- **Monthly Average**: `₹ 45,200` (`↓ 8% vs previous 3 months`).
- **Total This Year**: `₹ 4,82,300` (`↓ 6% vs last year`).

#### B. Expense Trend & Category Donut
- **Expense Trend Curve**: Interactive area chart tracking factory spending across months (Jan–May) with peak callout (`₹ 56,780`).
- **Expense Breakdown Donut**: High-contrast category distribution:
  - Fabric: `32%`
  - Electricity: `18%`
  - Salary: `16%`
  - Transport: `12%`
  - Packaging: `10%`
  - Others: `12%`

#### C. Quick Add Expense Form
1. Directly accessible in the middle row.
2. Enter:
   - **Title / Description**: e.g., `Cotton Fabric Purchase` or `Factory Electricity Bill`
   - **Category**: Fabric, Electricity, Salary, Transport, Packaging, Maintenance, Others
   - **Amount (₹)**
   - **Date & Payment Method**: Bank Transfer, UPI, Cash, Cheque, Credit Card
   - **Notes (Optional)**
3. Click **`Save Expense`**: Appends directly to the `Expenses` sheet in Google Sheets, updates KPIs, and adds to the table immediately.

#### D. Searchable Expenses Ledger
- Filter by category (*All Categories*, *Fabric*, *Electricity*, *Salary*, *Transport*, *Packaging*, *Maintenance*).
- Live search input to find vendors, bills, or receipt notes.

---

### 5. Main Business Dashboard (`/dashboard`)
The central executive overview matching `Dashboard.png`, dynamically powered by 100% real Google Sheets transactions:

#### A. 5 Floating Executive KPI Cards
- **Today's Sales**: `₹ 24,560` (`↑ 12% vs yesterday`).
- **Monthly Sales**: `₹ 3,48,200` (`↑ 8% vs last month`).
- **Gross Profit**: `₹ 1,24,300` (`↑ 10% vs last month`) — dynamically calculated as \(\text{Revenue} - \text{COGS}\) from `SaleItems`.
- **Net Profit**: `₹ 92,450` (`↑ 9% vs last month`) — dynamically calculated as \(\text{Gross Profit} - \text{Total Expenses}\).
- **Total Expenses**: `₹ 56,780` (`↓ 5% vs last month`).

#### B. Visual Financial Analytics
- **Sales Overview Area Chart**: Smooth monochrome gradient area curve displaying month-over-month sales trends with an active peak callout badge.
- **Expense Breakdown Donut**: Interactive category donut with center total display and category distribution legend (*Fabric*, *Electricity*, *Salary*, *Transport*, *Packaging*, *Others*).

#### C. Floor Stock & Operations Summary
- **Low Stock Items**: Garments that have reached reorder triggers with SKU, size, color, and stock count pill (`5 left`). Includes a direct `View all` link to `/inventory`.
- **Top Selling Products**: Real-time sales ranking (1 to 5) with units sold badges.
- **Recent Sales**: Recent wholesale invoices with invoice #, buyer name, and total amount, linking straight to `/sales`.

---

## 📊 Google Sheets as Your Live Database

Your Google Spreadsheet (`14NmieGnJxpVQQih0w5i1dhsXkm2YBB262sNjm1NPefQ`) contains 8 synchronized tabs:

| Sheet Tab | Purpose | What Factory Staff Can Do |
| :--- | :--- | :--- |
| **`Products`** | Garment master catalog & current stock | View or edit product names, prices, and stock levels. |
| **`StockMovements`** | Audit log for stock movements | Read-only audit log tracking every incoming and outgoing batch. |
| **`Customers`** | Wholesale buyers, addresses, GSTIN & credit limits | View buyer profiles and credit terms. |
| **`Payments`** | Customer payment ledger | Log NEFT, Cash, and UPI payments received. |
| **`Sales`** | Invoices & billing headers | Review total sales and GST details. |
| **`SaleItems`** | Itemized invoice breakdown | See exact SKUs and quantities sold per invoice. |
| **`Expenses`** | Operational factory expenses | Add raw material, electricity, salary, and maintenance costs. |
| **`Metadata`** | Factory settings & counters | Stores company name, GSTIN, and auto-incrementing invoice numbers. |

> **Tip for the Owner:** If you edit a cell directly inside Google Sheets, Threadly's sync cache refreshes within 45 seconds, or immediately upon any update from the UI.

---

## 🔑 Environment Variables

The project reads credentials from `.env` (or Vercel Environment Variables in production):

```env
GOOGLE_CLIENT_EMAIL="sheet-backend@prestinretro.iam.gserviceaccount.com"

GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDoFjaYJcJCB0ay\n...-----END PRIVATE KEY-----\n"

GOOGLE_SHEET_ID="14NmieGnJxpVQQih0w5i1dhsXkm2YBB262sNjm1NPefQ"
```

> **Security Note:** Never commit `.env` with actual private keys to a public GitHub repository. Keep it in `.gitignore`.

---

## ☁️ Deploying to Vercel

Threadly Factory OS is built specifically for **zero-configuration Vercel deployment**:

1. Push your repository to GitHub or GitLab:
   ```bash
   git init
   git add .
   git commit -m "Initial Threadly OS commit"
   git branch -M main
   # Add your remote and push:
   # git remote add origin <your-repo-url>
   # git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and click **Add New Project**.
3. Import your repository.
4. In the **Environment Variables** section, add:
   - `GOOGLE_CLIENT_EMAIL`: Your service account email.
   - `GOOGLE_PRIVATE_KEY`: Your full private key string (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`).
   - `GOOGLE_SHEET_ID`: Your Google Spreadsheet ID.
5. Click **Deploy**. Your app will be live on a custom `.vercel.app` domain with SSL!

---

## 🗺️ Development Roadmap

Following the dependency-first development order:

- [x] **Phase 1: Foundation & Google Sheets Engine** (Repository pattern, 45s TTL cache, schema init)
- [x] **Phase 2: Inventory Management** (`/inventory`) — *Live*
- [x] **Phase 3: Customers & Khata** (`/customers`) — *Live*
- [x] **Phase 4: Sales & Billing** (`/sales`) — *Live*
- [x] **Phase 5: Expenses** (`/expenses`) — *Live*
- [x] **Phase 6: Dashboard** (`/dashboard`) — *Live*
- [x] **Phase 7: Reports & Settings** (`/reports`, `/settings`) — *Live* (P&L curves, category distribution, factory identity & GST config)

---

*“Better systems. Smoother manufacturing.”* • **Threadly Factory OS v1.0.0**
