import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Category } from "../types";
import { Trash2 } from "lucide-react";

export default function Categories() {
  const { appUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canEdit = appUser?.role === "owner" || appUser?.role === "manager";

  useEffect(() => {
    if (!appUser?.store_id) return;
    fetchCategories();
  }, [appUser?.store_id]);

  const fetchCategories = async () => {
    try {
      const q = query(
        collection(db, "categories"),
        where("store_id", "==", appUser!.store_id),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        created_at: d.data().created_at?.toDate?.() ?? new Date(),
      })) as Category[];
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(data);
    } catch {
      // Firestore may reject if rules aren't deployed yet
    } finally {
      setLoading(false);
    }
  };

  const toPascalCase = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check for duplicates (case-insensitive)
    if (
      categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError("Category already exists.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const ref = doc(collection(db, "categories"));
      await setDoc(ref, {
        name: trimmed,
        store_id: appUser!.store_id,
        created_at: serverTimestamp(),
      });
      setName("");
      await fetchCategories();
    } catch {
      setError("Failed to add category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      {/* Add Category Form */}
      {canEdit && (
        <form onSubmit={handleAdd} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            {/* Shadow prediction text */}
            {name &&
              categories.find(
                (c) =>
                  c.name.toLowerCase().startsWith(name.toLowerCase()) &&
                  c.name.toLowerCase() !== name.toLowerCase(),
              ) && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 pointer-events-none select-none">
                  {name}
                  <span>
                    {categories
                      .find((c) =>
                        c.name.toLowerCase().startsWith(name.toLowerCase()),
                      )!
                      .name.slice(name.length)}
                  </span>
                </span>
              )}
            <input
              type="text"
              placeholder="New category name"
              value={name}
              onChange={(e) => {
                setName(toPascalCase(e.target.value));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && name) {
                  const match = categories.find(
                    (c) =>
                      c.name.toLowerCase().startsWith(name.toLowerCase()) &&
                      c.name.toLowerCase() !== name.toLowerCase(),
                  );
                  if (match) {
                    e.preventDefault();
                    setName(match.name);
                  }
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm bg-transparent relative z-10"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-sm">
          {error}
        </div>
      )}

      {/* Category List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-lg">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No categories yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-900">
                  {c.name}
                </span>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {categories.length} categor{categories.length === 1 ? "y" : "ies"} total
      </p>
    </div>
  );
}
