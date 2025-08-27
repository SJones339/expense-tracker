import React from 'react';
import Header from '../components/Header';  
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Your Dashboard!
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Quick Stats Cards */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900">Total Balance</h3>
                  <p className="text-2xl font-bold text-blue-600">$0.00</p>
                  <p className="text-sm text-blue-700">Across all accounts</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900">This Month</h3>
                  <p className="text-2xl font-bold text-green-600">$0.00</p>
                  <p className="text-sm text-green-700">Income vs Expenses</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900">Transactions</h3>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-purple-700">This month</p>
                </div>
              </div>
  
              <div className="text-center text-gray-500">
                <p>Your dashboard is ready! More features coming soon.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };
  
  export default Dashboard;