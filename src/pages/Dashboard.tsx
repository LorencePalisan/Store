import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Sale } from "../types";

function getDateRange(period: "day" | "week" | "month") {
  const now = new Date();
  const start = new Date(now);
  if (period === "day") start.setHours(0, 0, 0, 0);
  else if (period === "week") start.setDate(now.getDate() - 7);
  else start.setMonth(now.getMonth() - 1);
  return start;
}

export default function Dashboard() {
  const { appUser } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.store_id) return;
    const fetchSales = async () => {
      const monthAgo = getDateRange("month");
      const q = query(
        collection(db, "sales"),
        where("store_id", "==", appUser.store_id),
        where("created_at", ">=", Timestamp.fromDate(monthAgo)),
        orderBy("created_at", "desc"),
        limit(100),
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
  }, [appUser?.store_id]);

  const todaySales = sales.filter((s) => s.created_at >= getDateRange("day"));
  const weekSales = sales.filter((s) => s.created_at >= getDateRange("week"));

  const totalToday = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalWeek = weekSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalMonth = sales.reduce((sum, s) => sum + s.total_amount, 0);

  const cards = [
    {
      label: "Today's Sales",
      value: totalToday,
      count: todaySales.length,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "This Week",
      value: totalWeek,
      count: weekSales.length,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "This Month",
      value: totalMonth,
      count: sales.length,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl p-6 ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">
              ₱{card.value.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm mt-1 opacity-70">
              {card.count} transaction{card.count !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {sales.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">
              No sales recorded yet.
            </p>
          ) : (
            sales.slice(0, 10).map((sale) => (
              <div
                key={sale.id}
                className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sale.products.length} item
                    {sale.products.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sale.created_at.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-700 shrink-0">
                  ₱
                  {sale.total_amount.toLocaleString("en", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
