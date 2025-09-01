import React, { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, MinusCircle,
} from "lucide-react";
import Header from "../components/Header";

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNet: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () =>
    document.cookie.split("; ").find((r) => r.startsWith("access_token="))?.split("=")[1];

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token) { setIsLoading(false); return; }

        const txRes = await fetch("http://localhost:8000/api/transactions/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txJson = await txRes.json();
        const transactions = txJson.results || txJson;

        setRecentTransactions(transactions.slice(0, 8));

        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();

        const monthly = transactions.filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m && d.getFullYear() === y;
        });

        const income = monthly
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + Number(t.amount), 0);

        const expenses = monthly
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + Number(t.amount), 0);

        setStats({
          monthlyIncome: income,
          monthlyExpenses: expenses,
          monthlyNet: income - expenses,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const $ = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const fmtDate = (s) =>
    new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-zinc-900 grid place-items-center">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-zinc-900">
      {/* Keep your Header */}
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        {/* Page titles */}
        <div className="pt-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 text-xl sm:text-2xl text-gray-600">
          Welcome to your very own <span className="text-blue-600 font-semibold">Expense Tracker</span>
        </p>
        </div>

        {/* Main grid: 5 columns -> left smaller, right wider */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Recent Transactions (2/5 width on large) */}
          <div className="lg:col-span-2 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <a href="/transactions" className="text-sm text-blue-400 hover:text-blue-300">
                View all
              </a>
            </div>

            {recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-400">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {recentTransactions.map((t, i) => (
                  <li key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          t.type === "income" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium leading-tight">
                          {t.description || "Transaction"}
                        </p>
                        <p className="text-xs text-zinc-400 leading-tight">
                          {(t.category_name || "Uncategorized") + " • " + fmtDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold ${
                        t.type === "income" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {$(t.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT — wider column (3/5) with Description first, then stats */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Description FIRST */}
            <div className="rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-sm text-zinc-300">
                Welcome to the expense tracker. This is the dashboard where you can see an overview of your income and expensesas well as some recent transactions.
                Please see the navbar above for different pages and different features of this application. Bank Account connectivity is yet to be implemented
                but is planned to be integrated in the future.
              </p>
            </div>

            {/* Stats SECOND */}
            <div className="rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-4">This Month</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile
                  label="Income"
                  value={$(stats.monthlyIncome)}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <StatTile
                  label="Expenses"
                  value={$(stats.monthlyExpenses)}
                  icon={<TrendingDown className="w-4 h-4" />}
                />
                <StatTile
                  label="Net"
                  value={$(stats.monthlyNet)}
                  icon={<MinusCircle className="w-4 h-4" />}
                  emphasize
                  positive={stats.monthlyNet >= 0}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* — UI helper — */
const StatTile = ({ label, value, icon, emphasize = false, positive = true }) => {
  let color = "";
  if (label === "Income") color = "text-green-400";
  if (label === "Expenses") color = "text-red-400";
  if (label === "Net" && emphasize) color = positive ? "text-green-400" : "text-red-400";

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">{label}</p>
        <div className="p-1.5 rounded-md bg-zinc-800">{icon}</div>
      </div>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
};

export default Dashboard;
