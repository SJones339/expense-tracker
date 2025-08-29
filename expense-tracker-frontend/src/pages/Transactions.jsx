import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

const Transactions = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshList, setRefreshList] = useState(null);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSuccess = (result) => {
    console.log('Transaction saved:', result);
    setShowForm(false);
    setEditingTransaction(null);
    // TODO: Refresh transaction list
    if (refreshList) {
        refreshList();
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId) => {
    console.log('Delete transaction:', transactionId);
    // TODO: Implement delete functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
              <button 
                onClick={handleAddTransaction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                + Add Transaction
              </button>
            </div>

            {showForm ? (
              <TransactionForm
                transaction={editingTransaction}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            ) : (
              <TransactionList
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onRefresh={() => {
                    // Parent can do any additional logic here if needed
                    console.log('List refreshed');
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Transactions;