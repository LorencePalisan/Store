import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
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
import { useToast } from "../contexts/ToastContext";
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
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canEdit = appUser?.role === "owner" || appUser?.role === "manager";

  useEffect(() => {
    if (!appUser?.store_id) return;
    fetchProducts();
    fetchCategories();
  }, [appUser?.store_id]);

  useEffect(() => {
    if (showCamera && !capturedImage && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  }, [showCamera, capturedImage]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
    try {
      if (editing) {
        await updateDoc(doc(db, "products", editing.id), {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          image_url: form.image_url,
        });
        showToast(`"${form.name}" updated successfully.`);
      } else {
        const ref = doc(collection(db, "products"));
        await setDoc(ref, {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          store_id: appUser!.store_id,
          created_at: serverTimestamp(),
        });
        showToast(`"${form.name}" added successfully.`);
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyProduct);
      fetchProducts();
    } catch {
      showToast("Failed to save product.", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      showToast(`"${name}" deleted.`, "info");
      fetchProducts();
    } catch {
      showToast("Failed to delete product.", "error");
    }
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

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCapturedImage(null);
      setShowCamera(true);
    } catch {
      showToast("Cannot access camera.", "error");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
  };

  const uploadToImageKit = async (file: File | string): Promise<string> => {
    const authRes = await fetch("/api/imagekit-auth");
    if (!authRes.ok) throw new Error("Auth failed");
    const auth = (await authRes.json()) as {
      token: string;
      expire: number;
      signature: string;
    };

    const formData = new FormData();
    if (typeof file === "string") {
      formData.append("file", file);
      formData.append("fileName", `product_${Date.now()}.jpg`);
    } else {
      formData.append("file", file);
      formData.append("fileName", file.name);
    }
    formData.append(
      "publicKey",
      import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string,
    );
    formData.append("signature", auth.signature);
    formData.append("token", auth.token);
    formData.append("expire", String(auth.expire));
    formData.append("folder", "products");
    formData.append("useUniqueFileName", "true");

    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message ?? "Upload failed");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  };

  const usePhoto = async () => {
    if (!capturedImage) return;
    setUploading(true);
    try {
      const url = await uploadToImageKit(capturedImage);
      setForm((f) => ({ ...f, image_url: url }));
      stopCamera();
    } catch {
      showToast("Failed to save photo.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const url = await uploadToImageKit(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch {
      showToast("Failed to upload image.", "error");
    } finally {
      setUploading(false);
    }
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
              <div className="space-y-2">
                {form.image_url && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openCamera}
                    disabled={uploading}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📷 Take Photo
                  </button>
                  <label
                    className={`flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition text-center ${
                      uploading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {uploading ? "Uploading…" : "🖼 Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <input
                  placeholder="Or paste image URL"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
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
                    onClick={() => handleDelete(p.id, p.name)}
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
                        onClick={() => handleDelete(p.id, p.name)}
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

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md">
            <div className="bg-black aspect-video flex items-center justify-center">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="p-4 flex gap-3 justify-center">
              {capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={usePhoto}
                    disabled={uploading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading…" : "Use Photo"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                >
                  📷 Capture
                </button>
              )}
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
