import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Transactions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transactions</h2>
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-lg">Transaction management coming soon!</p>
              <p className="text-sm mt-2">You'll be able to add, edit, and track all your expenses and income here.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;