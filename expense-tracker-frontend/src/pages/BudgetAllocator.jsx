import React, { useEffect, useMemo, useState } from "react";
import { Plus, Wallet, PiggyBank, Percent } from "lucide-react";
import Header from "../components/Header";

// --- helpers ---
const $ = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// --- page ---
export default function BudgetAllocator() {
    const [buckets, setBuckets] = useState([]);
    const [incomeTransactions, setIncomeTransactions] = useState([]);
    const [alloc, setAlloc] = useState({}); // {bucketId: number}
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

    const token = document.cookie.split("; ").find(r => r.startsWith("access_token="))?.split("=")[1];

  // Load buckets
    useEffect(() => {
        (async () => {
        try {
            const res = await fetch("http://localhost:8000/api/budgets/buckets/", {
            headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) {
            throw new Error(`Failed to load buckets: ${res.status}`);
            }
            
            const data = await res.json();
            setBuckets(data.results || data);
        } catch (error) {
            console.error("Error loading buckets:", error.message);
            // You could show a toast notification here
        }
        })();
    }, [token]);

  // Load income transactions
    useEffect(() => {
        (async () => {
        try {
            const res = await fetch("http://localhost:8000/api/budgets/buckets/income_transactions/", {
            headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) {
            throw new Error(`Failed to load income transactions: ${res.status}`);
            }
            
            const data = await res.json();
            setIncomeTransactions(data);
        } catch (error) {
            console.error("Error loading income transactions:", error.message);
            setIncomeTransactions([]); // Set empty array on error
        }
        })();
    }, [token]);

  // Calculate total income
    const totalIncome = useMemo(
        () => incomeTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        [incomeTransactions]
    );

  // Calculate total allocated across all buckets (from actual bucket balances)
    const totalAllocated = useMemo(
        () => buckets.reduce((sum, b) => sum + (Number(b.current_balance) || 0), 0),
        [buckets]
    );
  
  // Calculate remaining unallocated money
    const remaining = totalIncome - totalAllocated;

  // Create bucket
    async function createBucket(e) {
        e.preventDefault();
        const form = new FormData(e.target);
        const payload = {
        name: form.get("name"),
        monthly_target: Number(form.get("target") || 0),
        color: form.get("color") || "#3b82f6"
        };
        
        try {
        setIsSaving(true);
        
        const res = await fetch("http://localhost:8000/api/budgets/buckets/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to create bucket");
        }
        
        const newBucket = await res.json();
        setBuckets((b) => [...b, newBucket]);
        e.target.reset();
        showNotification("Bucket created successfully!", "success");
        
        } catch (error) {
        console.error("Error creating bucket:", error.message);
        showNotification(`Error: ${error.message}`, "error");
        } finally {
        setIsSaving(false);
        }
    }
    // Show notification
    function showNotification(message, type = "success") {
        setNotification({ show: true, message, type });
        setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
        }, 3000); // Hide after 3 seconds
    }

    // Delete bucket
    async function deleteBucket(bucketId, bucketName) {
        if (!confirm(`Are you sure you want to delete the bucket "${bucketName}"? Any money in this bucket will be returned to unallocated money.`)) {
        return;
        }
        
        try {
        setIsSaving(true);
        
        const response = await fetch(`http://localhost:8000/api/budgets/buckets/${bucketId}/delete_bucket/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete bucket");
        }
        
        const result = await response.json();
        
        // Remove bucket from local state
        setBuckets((prev) => prev.filter((bucket) => bucket.id !== bucketId));
        
        showNotification(result.message, "success");
        
        } catch (error) {
        console.error("Error deleting bucket:", error.message);
        showNotification(`Error: ${error.message}`, "error");
        } finally {
        setIsSaving(false);
        }
    }

  // Save allocations
    async function saveAllocation() {
        if (totalAlloc <= 0 || remaining < 0) return;
        setIsSaving(true);
        try {
        const allocations = Object.entries(alloc)
            .filter(([_, v]) => Number(v) > 0)
            .map(([bucketId, v]) => ({ bucket_id: Number(bucketId), amount: Number(v) }));

        await fetch("http://localhost:8000/api/budgets/buckets/allocate/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ allocations })
        });

        // optimistic UI: update local bucket balances
        setBuckets((prev) =>
            prev.map((b) => {
            const found = allocations.find((a) => a.bucket_id === b.id);
            return found ? { ...b, current_balance: Number(b.current_balance) + found.amount } : b;
            })
        );
        setAlloc({});
        } finally {
        setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-zinc-900">
        <Header />
        {/* Notification */}
        {notification.show && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === "success" 
            ? "bg-green-500 text-white" 
            : "bg-red-500 text-white"
        }`}>
            <div className="flex items-center gap-2">
            <span>{notification.type === "success" ? "✅" : "❌"}</span>
            <span>{notification.message}</span>
            </div>
        </div>
        )}

        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
            <div className="pt-6 mb-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Budgets</h1>
            <p className="mt-2 text-gray-600">Allocate your income into buckets (envelopes).</p>
            </div>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Allocation form */}
            <section className="lg:col-span-2 rounded-2xl bg-white border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="w-4 h-4" /> Allocate Income</h2>

                {/* Unallocated Money Bucket */}
                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-green-800">💰 Unallocated Money</div>
                    <div className="text-sm text-green-600">Available to allocate</div>
                </div>
                <div className="mt-2 text-lg font-semibold text-green-700">
                {$(remaining)}
                </div>
                </div>

                {/* Income Transactions List */}
                <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Income Transactions</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {incomeTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No income transactions found</p>
                    ) : (
                    incomeTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                            <div className="font-medium text-sm text-green-800">{transaction.description}</div>
                            <div className="text-xs text-green-600">
                                {transaction.category_name} • {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-green-700">
                            +${Number(transaction.amount).toFixed(2)}
                        </div>
                        </div>
                    ))
                    )}
                </div>
                </div>

                <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Allocate to buckets</h3>
                <div className="space-y-3">
                    {buckets.map((b) => {
                    const cap = Number(b.monthly_target) || 0;
                    const cur = Number(b.current_balance) || 0;
                    const pct = cap > 0 ? Math.min(100, Math.round((cur / cap) * 100)) : 0;
                    const allocAmount = Number(alloc[b.id] || 0);
                    
                    return (
                        <div key={b.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">{b.name}</div>
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500">Target: {$(cap)}</div>
                                <button
                                onClick={() => deleteBucket(b.id, b.name)}
                                disabled={isSaving}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                title="Delete bucket"
                                >
                                ✕
                                </button>
                            </div>
                            </div>
                        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                            className="h-full bg-blue-600"
                            style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current: {$(cur)} ({pct}%)</span>
                            <div className="flex items-center gap-2">
                        <span className="text-gray-600">Amount:</span>
                        <input
                            type="number"
                            step="0.01"
                            value={alloc[b.id] || ""}
                            onChange={(e) =>
                            setAlloc((a) => ({ ...a, [b.id]: e.target.value }))
                            }
                            className="w-24 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="0.00"
                        />
                        <button
                            onClick={async () => {
                                const amount = Number(alloc[b.id] || 0);
                                if (amount > 0 && amount <= remaining) {
                                try {
                                    // Show loading state
                                    setIsSaving(true);
                                    
                                    const response = await fetch(`http://localhost:8000/api/budgets/buckets/${b.id}/allocate_money/`, {
                                    method: "POST",
                                    headers: { 
                                        "Content-Type": "application/json", 
                                        Authorization: `Bearer ${token}` 
                                    },
                                    body: JSON.stringify({
                                        amount: amount,
                                        transaction_type: "add"
                                    })
                                    });
                                    
                                    if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || "Failed to add money");
                                    }
                                    
                                    const result = await response.json();
                                    
                                    // Update local state with server response
                                    setBuckets((prev) =>
                                    prev.map((bucket) =>
                                        bucket.id === b.id
                                        ? { ...bucket, current_balance: result.new_balance }
                                        : bucket
                                    )
                                    );
                                    
                                    // Clear the input
                                    setAlloc((a) => ({ ...a, [b.id]: "" }));
                                    
                                    // Show success message
                                    showNotification(result.message, "success");
                                    
                                } catch (error) {
                                    console.error("Error adding money:", error.message);
                                    showNotification(`Error: ${error.message}`, "error");
                                } finally {
                                    setIsSaving(false);
                                }
                                }
                            }}
                            disabled={allocAmount <= 0 || allocAmount > remaining || isSaving}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            {isSaving ? "Adding..." : "Add"}
                            </button>
                            <button
                                onClick={async () => {
                                    const amount = Number(alloc[b.id] || 0);
                                    const currentBalance = Number(b.current_balance);
                                    if (amount > 0 && amount <= currentBalance) {
                                    try {
                                        setIsSaving(true);
                                        
                                        const response = await fetch(`http://localhost:8000/api/budgets/buckets/${b.id}/allocate_money/`, {
                                        method: "POST",
                                        headers: { 
                                            "Content-Type": "application/json", 
                                            Authorization: `Bearer ${token}` 
                                        },
                                        body: JSON.stringify({
                                            amount: amount,
                                            transaction_type: "remove"
                                        })
                                        });
                                        
                                        if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || "Failed to remove money");
                                        }
                                        
                                        const result = await response.json();
                                        
                                        setBuckets((prev) =>
                                        prev.map((bucket) =>
                                            bucket.id === b.id
                                            ? { ...bucket, current_balance: result.new_balance }
                                            : bucket
                                        )
                                        );
                                        
                                        setAlloc((a) => ({ ...a, [b.id]: "" }));
                                        showNotification(result.message, "success");
                                        
                                    } catch (error) {
                                        console.error("Error removing money:", error.message);
                                        showNotification(`Error: ${error.message}`, "error");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                    }
                                }}
                                disabled={allocAmount <= 0 || allocAmount > cur || isSaving}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                {isSaving ? "Removing..." : "Remove"}
                                </button>
                        </div>
                        </div>
                        </div>
                    );
                    })}
                </div>

                <div className="mt-4">
                    <p className="text-sm text-gray-600">
                    Unallocated Money: <strong className="text-green-600">{$(remaining)}</strong>
                    </p>
                </div>
                </div>
            </section>

            {/* RIGHT: Create bucket */}
            <aside className="rounded-2xl bg-white border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" /> Create Bucket
                </h2>
                <form onSubmit={createBucket} className="space-y-4">
                <label className="block">
                    <span className="text-sm text-gray-600">Name</span>
                    <input name="name" required className="mt-1 w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500" placeholder="Groceries" />
                </label>
                <label className="block">
                    <span className="text-sm text-gray-600">Monthly target</span>
                    <input name="target" type="number" step="0.01" required className="mt-1 w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500" placeholder="300" />
                </label>
                <label className="block">
                    <span className="text-sm text-gray-600">Color</span>
                    <input name="color" type="color" defaultValue="#3b82f6" className="mt-1 h-10 w-16 rounded" />
                </label>
                <button className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white px-4 py-2">
                    <Plus className="w-4 h-4" /> Add Bucket
                </button>
                </form>

                <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Tips
                </h3>
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Use fixed amounts for rent & subscriptions.</li>
                    <li>Use percentages for savings/investing (add later with rules).</li>
                    <li>If a bucket exceeds its target, the bar stays full.</li>
                </ul>
                </div>
            </aside>
            </div>
        </main>
        </div>
    );
}