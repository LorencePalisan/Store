import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Store, Crown } from "lucide-react";

export default function SetupStore() {
  const { firebaseUser, appUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"ask" | "form">("ask");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Only allow if no store has been set up yet
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const snap = await getDoc(doc(db, "metadata", "app_config"));
        setAllowed(!snap.exists());
      } catch {
        setAllowed(false);
      }
      setChecking(false);
    };
    checkAccess();
  }, []);

  // If not the only user, redirect away
  useEffect(() => {
    if (!checking && !allowed) {
      navigate("/pending");
    }
  }, [checking, allowed, navigate]);

  const handleYes = () => setStep("form");

  const handleNo = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !firebaseUser || !appUser) return;
    setError("");
    setLoading(true);

    try {
      const storeRef = doc(collection(db, "stores"));
      await setDoc(storeRef, {
        name: storeName.trim(),
        owner_id: firebaseUser.uid,
        created_at: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        role: "owner",
        status: "approved",
        store_id: storeRef.id,
      });
      // Mark setup as complete so future users don't see this page
      await setDoc(doc(db, "metadata", "app_config"), {
        setup_complete: true,
        store_id: storeRef.id,
      });
      await refreshUser();
      navigate("/dashboard");
    } catch {
      setError("Failed to create store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {step === "ask" ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Crown className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Are you the store owner?
            </h2>
            <p className="text-gray-500 mb-8">
              If you're the owner, you'll set up your store and get full access
              to manage everything.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleYes}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Yes, I'm the Owner
              </button>
              <button
                onClick={handleNo}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
              >
                No, Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Set Up Your Store
                </h2>
                <p className="text-sm text-gray-500">
                  Give your store a name to get started
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="e.g. My Retail Store"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Creating store..." : "Create Store"}
              </button>
            </form>

            <button
              onClick={() => setStep("ask")}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
