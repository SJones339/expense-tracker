# Expense Tracker

A full‑stack expense tracker built with a Django REST API backend and a React (Vite) frontend. The goal of this project is to make day‑to‑day money tracking fast and “visual”: you can connect accounts (manual or Plaid sandbox), import transactions, categorize spending, and then see how it rolls up into accounts, analytics, and budgets.

## What you can do in the app

This app is designed around a simple workflow: track accounts → record/import transactions → categorize them → view summaries and allocate money into budget buckets. The UI is intentionally straightforward so you can demo it quickly (create a user, connect a sandbox bank, sync, and immediately see the rest of the product update).

## Accounts & balances

Accounts are the foundation of the app. You can create accounts manually (checking, savings, cash, investment, credit), or create them automatically when importing via Plaid. Balances update as transactions are created/edited/deleted, and credit card balances follow “debt-style” logic (spending increases what you owe; payments decrease it).

## Transactions & categories

Transactions support income, expenses, and transfers. Categories are user-owned, and the API enforces consistency (e.g., an expense transaction must use an expense category). When importing from Plaid, transactions are first cached and then converted into the app’s native `Transaction` records so they appear everywhere (transactions list, dashboard, analytics).

## Analytics

Analytics pages summarize your spending/income patterns over time and by category. These views are built on the same transaction data, so anything you add manually or import via Plaid automatically feeds the charts.

## Budgets (bucket allocator)

Budgets use a bucket model: you allocate available money into named buckets (e.g., Groceries, Rent, Savings). Bucket progress bars use the bucket’s chosen color, and “Unallocated Money” is calculated from **account balances (excluding credit cards)** minus what you’ve allocated into buckets—so it reflects real available cash rather than “income total”.

## Plaid integration (portfolio-safe demo)

This project integrates Plaid primarily for **sandbox demos**. In sandbox mode, you can connect a fake institution, sync test transactions, and watch them flow through the app exactly like real imports—without using real bank credentials or real financial data.

Plaid flow in this app:
- Connect → exchange public token → store Plaid accounts
- Sync → cache Plaid transactions
- Convert → create native app `Account` + `Transaction` records so the rest of the product updates

## Getting started (local)

### Backend

Run the API with your virtualenv enabled:

```bash
cd /Users/stephenjones/Desktop/expense-tracker
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

Run the React app:

```bash
cd /Users/stephenjones/Desktop/expense-tracker/expense-tracker-frontend
npm install
npm run dev
```

## Plaid (sandbox) setup

Create a `.env` file in the project root:

```text
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
```

Get credentials from [Plaid Dashboard](https://dashboard.plaid.com/).

### Sandbox test logins

Use these in Plaid Link for demo data:
- **Username**: `user_transactions_dynamic`
- **Password**: `pass_good`

You can also search for sandbox institutions like “First Platypus Bank” to get pre-populated transactions.

## API quick reference

These are the main endpoints you’ll hit from the frontend:

- **Auth**
  - `POST /api/auth/register/`
  - `POST /api/auth/login/`
  - `POST /api/auth/token/refresh/`
  - `GET/PUT /api/auth/profile/`

- **Plaid**
  - `POST /api/plaid/create-link-token/`
  - `POST /api/plaid/exchange-token/`
  - `POST /api/plaid/sync-transactions/`
  - `POST /api/plaid/convert-transactions/`
  - `GET /api/plaid/accounts/`
  - `DELETE /api/plaid/accounts/<id>/disconnect/`

- **Core**
  - `GET/POST /api/transactions/`
  - `GET/POST /api/accounts/`
  - `GET/POST /api/categories/`
  - `GET /api/transactions/summary/`
  - `GET /api/transactions/analytics/`
  - `GET/POST /api/budgets/buckets/`

## Notes

- This repo is intended for local development + portfolio demos. For a real production deployment, you’d add standard hardening (HTTPS, production settings, encrypted secrets at rest, etc.).