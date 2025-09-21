#Setup

# Expense Tracker Application

## 🎯 Project Goal

A comprehensive expense tracking application built with Django REST API backend and React frontend. Users can track income, expenses, manage categories, monitor account balances, and analyze spending patterns with detailed analytics.



## �� Features

### Backend (Django REST API)
- **JWT Authentication** - Secure user login with token-based auth
- **User Management** - Registration, login, profile management
- **Transaction Tracking** - Income, expenses, transfers between accounts
- **Category Management** - Customizable transaction categories
- **Account Management** - Multiple financial accounts with balance tracking
- **Analytics** - Monthly summaries, spending trends, category breakdowns
- **Rate Limiting** - Protection against abuse
- **Data Validation** - Comprehensive input validation and error handling

### Frontend (React)
- **Modern UI** - Built with React 18 and Vite
- **Responsive Design** - Works on desktop and mobile
- **Protected Routes** - Secure navigation based on authentication
- **Real-time Updates** - Live data from Django API
- **Interactive Charts** - Visual representation of financial data

## �� Technology Stack

### Backend
- **Django 5.2.5** - Web framework
- **Django REST Framework** - API framework
- **JWT Authentication** - Secure token-based auth
- **SQLite** - Development database
- **PostgreSQL** - Production database ready

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management

## �� API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT tokens
- `GET/PUT /api/auth/profile/` - User profile management

### Transactions
- `GET/POST /api/transactions/`
- `GET /api/transactions/summary/` - Monthly summaries
- `GET /api/transactions/analytics/` - Detailed analytics
- `POST /api/transactions/bulk_create/` - Bulk operations

### Categories & Accounts
- Full CRUD operations for both models
- Custom actions (by_type, adjust_balance)

##Getting Started

### Backend Setup
```bash
cd expense_tracker_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd expense-tracker-frontend
npm install
npm run dev
```