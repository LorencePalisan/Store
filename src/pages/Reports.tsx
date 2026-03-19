import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Sale } from "../types";

export default function Reports() {
  const { appUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    if (!appUser?.store_id) return;
    const fetchSales = async () => {
      setLoading(true);
      const now = new Date();
      const start = new Date(now);
      if (period === "day") start.setHours(0, 0, 0, 0);
      else if (period === "week") start.setDate(now.getDate() - 7);
      else start.setMonth(now.getMonth() - 1);

      const q = query(
        collection(db, "sales"),
        where("store_id", "==", appUser.store_id),
        where("created_at", ">=", Timestamp.fromDate(start)),
        orderBy("created_at", "desc"),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        created_at: d.data().created_at?.toDate?.() ?? new Date(),
      })) as Sale[];
      setSales(data);
      setLoading(false);
    };
    fetchSales();
  }, [appUser?.store_id, period]);

  const totalAmount = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalItems = sales.reduce(
    (sum, s) => sum + s.products.reduce((ps, p) => ps + p.quantity, 0),
    0,
  );

  const exportCSV = () => {
    const headers = ["Date", "Sold By", "Items", "Total Amount"];
    const rows = sales.map((s) => [
      s.created_at.toLocaleString(),
      s.created_by_email || "",
      s.products.map((p) => `${p.name} x${p.quantity}`).join("; "),
      s.total_amount.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2 flex-wrap">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                period === p
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "day"
                ? "Today"
                : p === "week"
                  ? "This Week"
                  : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 text-green-700 rounded-xl p-5">
          <p className="text-sm font-medium opacity-80">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">
            ₱{totalAmount.toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-blue-50 text-blue-700 rounded-xl p-5">
          <p className="text-sm font-medium opacity-80">Transactions</p>
          <p className="text-2xl font-bold mt-1">{sales.length}</p>
        </div>
        <div className="bg-purple-50 text-purple-700 rounded-xl p-5">
          <p className="text-sm font-medium opacity-80">Items Sold</p>
          <p className="text-2xl font-bold mt-1">{totalItems}</p>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportCSV}
          disabled={sales.length === 0}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {/* Mobile Sale Cards */}
      <div className="md:hidden space-y-3">
        {sales.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-8 text-gray-400">
            No sales for this period.
          </div>
        ) : (
          sales.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-gray-500">
                  {s.created_at.toLocaleString()}
                </p>
                <span className="text-sm font-semibold text-green-700 ml-2 shrink-0">
                  ₱{s.total_amount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {s.created_by_email || "—"}
              </p>
              <p className="text-sm text-gray-900">
                {s.products.map((p) => `${p.name} ×${p.quantity}`).join(", ")}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Desktop Sales Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Sold By</th>
              <th className="text-left px-4 py-3 font-medium">Items</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No sales for this period.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {s.created_at.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.created_by_email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {s.products
                      .map((p) => `${p.name} ×${p.quantity}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    ₱{s.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
