#Setup

# Expense Tracker Application

## 🎯 Project Goal

A comprehensive expense tracking application built with Django REST API backend and React frontend. Users can track income, expenses, manage categories, monitor account balances, and analyze spending patterns with detailed analytics.

## ��️ Project Structure
expense-tracker/
├── expense_tracker_backend/ # Django REST API Backend
│ ├── accounts/ # User authentication & management
│ ├── transactions/ # Core expense tracking logic
│ └── expense_tracker_backend/ # Django project settings
└── expense-tracker-frontend/ # React Frontend Application
├── src/
│ ├── components/ # Reusable UI components
│ ├── pages/ # Full page components
│ ├── context/ # Global state management
│ ├── services/ # API calls & external services
│ ├── utils/ # Helper functions
│ └── hooks/ # Custom React hooks
└── package.json # Frontend dependencies


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
- `GET/POST /api/transactions/` - CRUD operations
- `GET /api/transactions/summary/` - Monthly summaries
- `GET /api/transactions/analytics/` - Detailed analytics
- `POST /api/transactions/bulk_create/` - Bulk operations

### Categories & Accounts
- Full CRUD operations for both models
- Custom actions (by_type, adjust_balance)

## 🚀 Getting Started

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

## 📚 Learning Focus

This project demonstrates:
- **Full-stack development** with Django + React
- **JWT authentication** implementation
- **REST API design** best practices
- **Modern React patterns** (hooks, context, functional components)
- **State management** without external libraries
- **API integration** between frontend and backend

## �� Development Status

- ✅ **Backend Complete** - All API endpoints working
- 🔄 **Frontend In Progress** - Setting up React foundation
- ⏳ **Authentication UI** - Next step
- ⏳ **Core Features** - Dashboard, transactions, analytics
- ⏳ **Production Deployment** - Final step