import { useEffect, useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Product, CartItem } from "../types";

export default function POS() {
  const { appUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cash, setCash] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!appUser?.store_id) return;
    const fetchProducts = async () => {
      const q = query(
        collection(db, "products"),
        where("store_id", "==", appUser.store_id),
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
    fetchProducts();
  }, [appUser?.store_id]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      if (product.stock <= 0) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(qty, item.product.stock) }
            : item,
        ),
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);

    try {
      const saleRef = doc(collection(db, "sales"));
      await setDoc(saleRef, {
        store_id: appUser!.store_id,
        products: cart.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total_amount: total,
        created_by: appUser!.id,
        created_by_email: appUser!.email,
        created_at: serverTimestamp(),
      });

      // Update stock
      for (const item of cart) {
        await updateDoc(doc(db, "products", item.product.id), {
          stock: increment(-item.quantity),
        });
      }

      // Update local product stock
      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((c) => c.product.id === p.id);
          return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
        }),
      );

      setCart([]);
      setCash("");
    } finally {
      setProcessing(false);
    }
  };

  // Auto-open cart on mobile when first item is added
  useEffect(() => {
    if (cart.length === 1) setCartOpen(true);
  }, [cart.length]);

  // Keyboard shortcut: Enter to checkout
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey && cart.length > 0) {
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, processing]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products... (click to add)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`text-left p-3 rounded-xl border transition ${
                p.stock <= 0
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-green-400 hover:shadow-sm active:scale-[0.98]"
              }`}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300 text-xs">
                  No image
                </div>
              )}
              <p className="text-sm font-medium text-gray-900 truncate">
                {p.name}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-semibold text-green-700">
                  ₱{p.price.toFixed(2)}
                </span>
                <span
                  className={`text-xs ${p.stock <= 5 ? "text-red-500" : "text-gray-400"}`}
                >
                  Stock: {p.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        {/* Mobile: collapsible header */}
        <button
          className="lg:hidden px-4 py-3 border-b border-gray-100 flex items-center justify-between w-full text-left"
          onClick={() => setCartOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">Cart</span>
            {cart.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <span className="text-sm font-bold text-green-700">
                ₱{total.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            )}
            {cartOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Desktop: static header */}
        <div className="hidden lg:flex px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
        </div>

        {/* Cart body: hidden on mobile when collapsed */}
        <div
          className={`${
            cartOpen ? "flex" : "hidden"
          } lg:flex flex-1 flex-col min-h-0 max-h-[55vh] lg:max-h-none`}
        >
          <div className="flex-1 overflow-auto divide-y divide-gray-100">
            {cart.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">
                Cart is empty
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        ₱{item.product.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-400 hover:text-red-600 ml-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                    <span className="ml-auto text-sm font-semibold text-gray-900">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">
                Total
              </span>
              <span className="text-xl font-bold text-green-700">
                ₱{total.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {/* Cash & Change */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 w-16 shrink-0">
                  Cash
                </label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-16 shrink-0">
                  Change
                </span>
                <span
                  className={`flex-1 text-right text-sm font-semibold px-3 py-1.5 rounded-lg ${
                    cash !== "" && Number(cash) < total
                      ? "bg-red-50 text-red-600"
                      : "bg-gray-50 text-gray-900"
                  }`}
                >
                  {cash === ""
                    ? "—"
                    : `₱${Math.max(0, Number(cash) - total).toLocaleString("en", { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={
                cart.length === 0 ||
                processing ||
                (cash !== "" && Number(cash) < total)
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {processing ? "Processing..." : "Checkout (Ctrl+Enter)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
