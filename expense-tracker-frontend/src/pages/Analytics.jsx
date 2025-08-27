import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">Financial analytics coming soon!</p>
              <p className="text-sm mt-2">Get insights into your spending patterns, trends, and financial health.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;