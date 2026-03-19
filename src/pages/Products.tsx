import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Product, Category } from "../types";

const emptyProduct = {
  name: "",
  price: 0,
  stock: 0,
  category: "",
  image_url: "",
};

export default function Products() {
  const { appUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);

  const canEdit = appUser?.role === "owner" || appUser?.role === "manager";

  useEffect(() => {
    if (!appUser?.store_id) return;
    fetchProducts();
    fetchCategories();
  }, [appUser?.store_id]);

  const fetchCategories = async () => {
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
  };

  const fetchProducts = async () => {
    const q = query(
      collection(db, "products"),
      where("store_id", "==", appUser!.store_id),
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      created_at: d.data().created_at?.toDate?.() ?? new Date(),
    })) as Product[];
    setProducts(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updateDoc(doc(db, "products", editing.id), {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        image_url: form.image_url,
      });
    } else {
      const ref = doc(collection(db, "products"));
      await setDoc(ref, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        store_id: appUser!.store_id,
        created_at: serverTimestamp(),
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm(emptyProduct);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image_url: p.image_url,
    });
    setShowForm(true);
  };

  const categoryNames = categories.map((c) => c.name);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStock = products.filter((p) => p.stock <= 5);

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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyProduct);
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          ⚠️ {lowStock.length} product{lowStock.length > 1 ? "s" : ""} with low
          stock (≤5): {lowStock.map((p) => p.name).join(", ")}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
        >
          <option value="">All Categories</option>
          {categoryNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Product" : "Add Product"}
            </h2>
            <div className="space-y-3">
              <input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Price"
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock || ""}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select category</option>
                {categoryNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
              >
                {editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Product Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-8 text-gray-400">
            No products found.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex gap-3">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-14 h-14 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
                    N/A
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category || "—"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{p.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-medium ${p.stock <= 5 ? "text-red-600" : "text-gray-500"}`}
                    >
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Product Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Image</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Stock</th>
              {canEdit && (
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 6 : 5}
                  className="text-center py-8 text-gray-400"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.category || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    ₱{p.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        p.stock <= 5
                          ? "text-red-600 font-semibold"
                          : "text-gray-900"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
