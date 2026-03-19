import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function Pending() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [storeSetupDone, setStoreSetupDone] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const snap = await getDoc(doc(db, "metadata", "app_config"));
        setStoreSetupDone(snap.exists());
      } catch {
        setStoreSetupDone(false);
      }
      setChecking(false);
    };
    checkSetup();
  }, []);

  // If user is already approved, redirect to dashboard
  if (appUser?.status === "approved") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is in setup status, redirect to setup page
  if (appUser?.status === "setup") {
    return <Navigate to="/setup-store" replace />;
  }

  // If no store has been set up yet and user is pending, redirect to setup
  if (!checking && !storeSetupDone && appUser?.status === "pending") {
    return <Navigate to="/setup-store" replace />;
  }

  // Show loading while checking
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const status = appUser?.status ?? "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === "pending" ? (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Awaiting Approval
            </h2>
            <p className="text-gray-500 mb-6">
              Your account is pending approval from the store owner. You'll get
              access once approved.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
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
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500 mb-6">
              Your account has been rejected. Contact the store owner for
              details.
            </p>
          </>
        )}
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
