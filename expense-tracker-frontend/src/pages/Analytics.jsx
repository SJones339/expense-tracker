import React, { useState, useEffect } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from 'chart.js';
import Header from '../components/Header';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
);

const Analytics = () => {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // month, quarter, year
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        totalTransactions: 0
    });

    const getToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
    };

    const fetchData = async () => {
        try {
            const token = getToken();
            if (!token) return;

            // Fetch transactions
            const transactionsResponse = await fetch('http://localhost:8000/api/transactions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData.results || transactionsData);

            // Fetch accounts
            const accountsResponse = await fetch('http://localhost:8000/api/accounts/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const accountsData = await accountsResponse.json();
            setAccounts(accountsData.results || accountsData);

            // Fetch categories
            const categoriesResponse = await fetch('http://localhost:8000/api/categories/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData.results || categoriesData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate statistics
    useEffect(() => {
        if (transactions.length > 0) {
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            setStats({
                totalIncome: income,
                totalExpenses: expenses,
                netBalance: income - expenses,
                totalTransactions: transactions.length
            });
        }
    }, [transactions]);

    // Filter transactions by time range
    const getFilteredTransactions = () => {
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        return transactions.filter(t => new Date(t.date) >= startDate);
    };

    // Prepare chart data
    const getChartData = () => {
        const filteredTransactions = getFilteredTransactions();
        
        // Group by date
        const groupedByDate = filteredTransactions.reduce((acc, t) => {
            const date = new Date(t.date).toLocaleDateString();
            if (!acc[date]) acc[date] = { income: 0, expense: 0 };
            
            if (t.type === 'income') {
                acc[date].income += parseFloat(t.amount);
            } else {
                acc[date].expense += parseFloat(t.amount);
            }
            return acc;
        }, {});

        const dates = Object.keys(groupedByDate).sort();
        const incomeData = dates.map(date => groupedByDate[date].income);
        const expenseData = dates.map(date => groupedByDate[date].expense);

        return {
            labels: dates,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.1
                }
            ]
        };
    };

    // Category breakdown data
    const getCategoryData = () => {
        const filteredTransactions = getFilteredTransactions();
        const expenses = filteredTransactions.filter(t => t.type === 'expense');
        
        const categoryTotals = expenses.reduce((acc, t) => {
            const categoryName = t.category_name || 'Unknown';
            acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
        ];

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
    };

    // Account balance data
    const getAccountData = () => {
        const labels = accounts.map(a => a.name);
        const data = accounts.map(a => parseFloat(a.balance));
        const colors = accounts.map(a => 
            parseFloat(a.balance) >= 0 ? '#10B981' : '#EF4444'
        );

        return {
            labels,
            datasets: [{
                label: 'Account Balance',
                data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#374151'
            }]
        };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Header />
                <div className="flex">
                    <main className="flex-1 p-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex">
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-gray-600 mt-2">Track your spending patterns and financial insights</p>
                        </div>

                        {/* Time Range Selector */}
                        <div className="mb-6">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="month">Last Month</option>
                                <option value="quarter">Last Quarter</option>
                                <option value="year">Last Year</option>
                            </select>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Income</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            ${stats.totalIncome.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <TrendingDown className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            ${stats.totalExpenses.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Net Balance</p>
                                        <p className={`text-2xl font-semibold ${
                                            stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            ${stats.netBalance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <CreditCard className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Transactions</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {stats.totalTransactions}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Income vs Expenses Line Chart */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Over Time</h3>
                                <Line 
                                    data={getChartData()}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function(value) {
                                                        return '$' + value.toFixed(2);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Category Breakdown Pie Chart */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                                <Pie 
                                    data={getCategoryData()}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                        return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Account Balances Bar Chart */}
                            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balances</h3>
                                <Bar 
                                    data={getAccountData()}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function(value) {
                                                        return '$' + value.toFixed(2);
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Analytics;