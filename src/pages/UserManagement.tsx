import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { AppUser } from "../types";

export default function UserManagement() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.store_id) return;
    fetchUsers();
  }, [appUser?.store_id]);

  const fetchUsers = async () => {
    // Fetch users in the store
    const storeQuery = query(
      collection(db, "users"),
      where("store_id", "==", appUser!.store_id),
    );
    // Also fetch pending users not yet assigned to a store
    const pendingQuery = query(
      collection(db, "users"),
      where("store_id", "==", ""),
      where("status", "==", "pending"),
    );
    const [storeSnap, pendingSnap] = await Promise.all([
      getDocs(storeQuery),
      getDocs(pendingQuery),
    ]);
    const seen = new Set<string>();
    const data: AppUser[] = [];
    for (const snap of [storeSnap, pendingSnap]) {
      for (const d of snap.docs) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        data.push({
          id: d.id,
          ...d.data(),
          created_at: d.data().created_at?.toDate?.() ?? new Date(),
        } as AppUser);
      }
    }
    setUsers(data);
    setLoading(false);
  };

  const handleApprove = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), {
      status: "approved",
      store_id: appUser!.store_id,
    });
    fetchUsers();
  };

  const handleReject = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { status: "rejected" });
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await updateDoc(doc(db, "users", userId), { role });
    fetchUsers();
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const activeUsers = users.filter((u) => u.status === "approved");
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Pending Approval ({pendingUsers.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    Requested {u.created_at.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Active Users ({activeUsers.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.created_at.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== appUser?.id && (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Rejected ({rejectedUsers.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {rejectedUsers.map((u) => (
              <div
                key={u.id}
                className="px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-500">{u.email}</p>
                </div>
                <button
                  onClick={() => handleApprove(u.id)}
                  className="px-4 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition"
                >
                  Re-approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
