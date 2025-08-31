import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, TrendingDown, DollarSign, CreditCard, 
    Calendar, AlertCircle, ArrowUpRight, ArrowDownRight,
    User, LogOut, Menu, BarChart3
} from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNet: 0,
        totalAccounts: 0,
        totalTransactions: 0
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [timeRange, setTimeRange] = useState('month');
    const [isLoading, setIsLoading] = useState(true);

    const getToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
    };

    const fetchDashboardData = async () => {
        try {
            const token = getToken();
            if (!token) return;

            // Fetch accounts for balance
            const accountsResponse = await fetch('http://localhost:8000/api/accounts/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const accountsData = await accountsResponse.json();
            const accounts = accountsData.results || accountsData;

            // Fetch recent transactions
            const transactionsResponse = await fetch('http://localhost:8000/api/transactions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const transactionsData = await transactionsResponse.json();
            const transactions = transactionsData.results || transactionsData;

            // Calculate stats
            const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
            
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            });

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            setStats({
                totalBalance,
                monthlyIncome,
                monthlyExpenses,
                monthlyNet: monthlyIncome - monthlyExpenses,
                totalAccounts: accounts.length,
                totalTransactions: transactions.length
            });

            // Get recent transactions (last 5)
            setRecentTransactions(transactions.slice(0, 5));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Header - Dark Gray */}
            <div className="bg-gray-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* App Title - Centered */}
                        <div className="flex-1"></div>
                        <div className="flex-1 flex justify-center">
                            <h1 className="text-2xl font-bold text-white">Expense Tracker</h1>
                        </div>
                        
                        {/* Profile & Logout - Right Side */}
                        <div className="flex-1 flex justify-end items-center space-x-3">
                            <div className="relative">
                                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                                    <span className="text-sm">Welcome, user</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex">
                {/* Left Sidebar - Dark Gray */}
                <div className="w-64 bg-gray-800 min-h-screen p-4">
                    {/* Hamburger Menu */}
                    <div className="mb-6">
                        <button className="text-white p-2">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Navigation Links */}
                    <nav className="space-y-2">
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white bg-gray-700 rounded-lg">
                            <span>Dashboard</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg">
                            <span>Transactions</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg">
                            <span>Categories</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg">
                            <span>Accounts</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg">
                            <span>Analytics</span>
                        </a>
                    </nav>
                </div>

                {/* Main Content Area - White Background */}
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Recent Transactions */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-200 rounded-lg p-6 h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                                        <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        {recentTransactions.length > 0 ? (
                                            recentTransactions.slice(0, 3).map((transaction, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{transaction.category_name || 'Uncategorized'}</p>
                                                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                                                    </div>
                                                    <p className={`font-semibold ${
                                                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {formatCurrency(transaction.amount)}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No transactions yet
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Add transaction
                                    </button>
                                </div>
                            </div>

                            {/* Right Column - Income, Expenses, Net Summary */}
                            <div className="lg:col-span-2">
                                <div className="space-y-6">
                                    {/* Time Period Selector */}
                                    <div className="flex justify-end">
                                        <select
                                            value={timeRange}
                                            onChange={(e) => setTimeRange(e.target.value)}
                                            className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
                                        >
                                            <option value="week">week</option>
                                            <option value="month">month</option>
                                            <option value="year">year</option>
                                        </select>
                                    </div>

                                    {/* Three Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Income Card */}
                                        <div className="bg-gray-200 rounded-lg p-4 text-center">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Income</h4>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</p>
                                        </div>

                                        {/* Expenses Card */}
                                        <div className="bg-gray-200 rounded-lg p-4 text-center">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Expenses</h4>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses)}</p>
                                        </div>

                                        {/* Net Card */}
                                        <div className="bg-gray-200 rounded-lg p-4 text-center">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Net</h4>
                                            <p className={`text-2xl font-bold ${
                                                stats.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(stats.monthlyNet)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Note about icons */}
                                    <p className="text-sm text-gray-500 text-center">
                                        Add icons here for decor and net will be green if its positive
                                    </p>

                                    {/* Analytics Graph Placeholder */}
                                    <div className="bg-gray-200 rounded-lg p-6">
                                        <div className="bg-black rounded-lg p-8 text-center">
                                            <p className="text-white text-lg">One or two Graph of analytics</p>
                                        </div>
                                        <div className="mt-4">
                                            <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                View Analytics
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;