 # BizFlow

BizFlow is a small-business management system for sales, products, inventory, customers, suppliers, expenses, reports, and dashboard analytics.

## Features

- Dashboard metrics for revenue, expenses, profit, and stock alerts
- Product and inventory management
- Sales recording and history
- Customer and supplier records
- Expense tracking
- Sales, revenue, expense, profit, and inventory reports
- Business settings
- Demo authentication flow
- Persistent local JSON storage for development

## Requirements

- Node.js 18 or newer
- npm

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:5050` in a browser.

For development with automatic server restarts:

```bash
npm run dev
```

The API is available under `http://localhost:5050/api`.

## Configuration

Copy `.env.example` to `.env` when environment configuration is needed:

```env
PORT=5050
CORS_ORIGIN=http://localhost:5050
```

The browser uses `/api` by default, so the frontend and backend can be hosted under the same domain. An explicit frontend API URL can be supplied before loading the application with `window.BIZFLOW_API_URL`.

## Demo Access

The development authentication flow accepts any non-empty email and password. The default demo account is:

- Email: `demo@bizflow.local`
- Password: `demo123`

This authentication implementation is intended for demonstration and development only. Production deployment requires real password hashing, session or token security, user authorization, and a hosted database.

## API Modules

The Express API exposes:

- `/api/auth`
- `/api/customers`
- `/api/dashboard`
- `/api/expenses`
- `/api/inventory`
- `/api/products`
- `/api/reports`
- `/api/sales`
- `/api/settings`
- `/api/suppliers`

Health checks are available at `/api/health` and `/api`.

## Data Storage

Development data is stored in `backend/database/data/bizflow.json`. This directory is ignored by Git so local business data is not committed accidentally.

For production use, replace the JSON store with PostgreSQL, MySQL, or another managed database before storing real business records.

## GitHub Handoff

After installing Git, run these commands from the project folder:

```bash
git init
git add .
git commit -m "Prepare BizFlow application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bizflow.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `bizflow` with the GitHub account and repository name you create.

## Production Notes

Before using BizFlow with real customers or financial records:

1. Replace demo authentication with secure authentication.
2. Move persistence to a managed database.
3. Set a restricted `CORS_ORIGIN` value.
4. Configure backups and error monitoring.
5. Review authorization for every data-changing endpoint.