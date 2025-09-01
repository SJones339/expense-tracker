import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const TransactionList = ({ onEditTransaction, onDeleteTransaction, onRefresh }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getToken = () => Cookies.get("access_token");
  const getRefreshToken = () => Cookies.get("refresh_token");

  const checkAndRefreshToken = async () => {
    const token = getToken();
    if (!token) return false;
    try {
      const test = await fetch("http://localhost:8000/api/auth/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (test.status !== 401) return true;

      const rt = getRefreshToken();
      if (!rt) return false;
      const r = await fetch("http://localhost:8000/api/auth/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: rt }),
      });
      if (!r.ok) return false;
      const t = await r.json();
      Cookies.set("access_token", t.access, { expires: 1 });
      return true;
    } catch {
      return false;
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const ok = await checkAndRefreshToken();
      if (!ok) {
        setError("Authentication failed. Please log in again.");
        return;
      }
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/transactions/?page=${currentPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Failed to fetch transactions. Please try again.");
        return;
      }
      const data = await res.json();
      setTransactions(data.results || data || []);
      setTotalPages(Math.ceil((data.count || 0) / 20));
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [currentPage]);

  const refreshTransactions = () => {
    fetchTransactions();
    onRefresh && onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/transactions/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return alert("Failed to delete transaction.");
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      onDeleteTransaction && onDeleteTransaction(id);
    } catch {
      alert("Network error. Please check your connection.");
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amt);
  const formatDate = (s) =>
    new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">Loading transactions…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="mb-3">{error}</p>
          <button
            onClick={refreshTransactions}
            className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (transactions.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No transactions found. Create your first transaction to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center text-base font-semibold text-gray-700">Your Transactions</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(t.date)}</td>
                <td className="px-4 py-3 text-gray-800">{t.description}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {t.category_name}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{t.account_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                      (t.type === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700")
                    }
                  >
                    {t.type}
                  </span>
                </td>
                <td
                  className={
                    "px-4 py-3 font-semibold " +
                    (t.type === "income" ? "text-emerald-600" : "text-rose-600")
                  }
                >
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditTransaction(t)}
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-2 py-3 text-sm text-gray-600">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page <strong>{currentPage}</strong> of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
