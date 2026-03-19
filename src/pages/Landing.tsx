import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Store,
  PlusCircle,
  TrendingUp,
  Crown,
  UserCog,
  Eye,
  Search,
  Plus,
  Calculator,
  CreditCard,
  ArrowRight,
  Facebook,
  Twitter,
  Github,
  Menu,
  X,
  Check,
} from "lucide-react";

/* ───── scroll-fade hook ───── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return {
    ref,
    className: `transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
  };
}

/* ────────────────────────────────────────────── */
/*  NAVBAR                                        */
/* ────────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Roles", href: "#roles" },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-green-700 font-bold text-xl"
        >
          <Store className="w-6 h-6" /> StoreFlow
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-green-700 font-medium transition"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="text-sm text-gray-700 font-medium hover:text-green-700 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-5 py-2.5 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-700"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 pb-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-gray-600 hover:text-green-700 font-medium py-1"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="block text-sm text-gray-700 font-medium py-1"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block text-center text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-5 py-2.5 transition"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ────────────────────────────────────────────── */
/*  HERO                                          */
/* ────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 -z-10" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-green-200/30 blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold rounded-full px-4 py-1.5 mb-6">
            <ShoppingCart className="w-3.5 h-3.5" /> Store Management Made
            Simple
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Manage Your Store{" "}
            <span className="text-green-600">Smarter, Faster,</span> and Easier
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto lg:mx-0">
            All-in-one store management system with POS, inventory tracking, and
            real-time sales analytics.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-7 py-3.5 transition shadow-lg shadow-green-600/20"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 text-gray-700 font-semibold rounded-lg px-7 py-3.5 transition"
            >
              View Features
            </a>
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="flex-1 max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400">Dashboard</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BarChart3, label: "Sales Today", value: "₱12,450" },
                { icon: Package, label: "Products", value: "128" },
                { icon: ShoppingCart, label: "Transactions", value: "34" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-green-50 rounded-xl p-3 text-center"
                >
                  <c.icon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-[10px] text-gray-500">{c.label}</p>
                  <p className="text-sm font-bold text-gray-900">{c.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[75, 55, 90].map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {w}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  FEATURES                                      */
/* ────────────────────────────────────────────── */
const features = [
  {
    title: "Smart Dashboard",
    desc: "Track daily, weekly, and monthly sales with real-time insights.",
    icon: BarChart3,
  },
  {
    title: "Product Management",
    desc: "Manage inventory, stock levels, and categories effortlessly.",
    icon: Package,
  },
  {
    title: "Fast POS System",
    desc: "Quick and intuitive checkout system designed for speed.",
    icon: ShoppingCart,
  },
  {
    title: "Reports & Analytics",
    desc: "Generate reports with filters and export to CSV.",
    icon: FileText,
  },
  {
    title: "User Role Management",
    desc: "Owner, Manager, Viewer — granular access control.",
    icon: Users,
  },
];

function Features() {
  const fade = useFadeIn();
  return (
    <section id="features" className="py-20 lg:py-28 bg-white">
      <div
        ref={fade.ref}
        className={`max-w-7xl mx-auto px-6 ${fade.className}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Everything you need to run your store
          </h2>
          <p className="mt-4 text-gray-500">
            Powerful tools designed for small business owners and retail
            managers.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-gray-50 hover:bg-white border border-transparent hover:border-green-100 rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  HOW IT WORKS                                  */
/* ────────────────────────────────────────────── */
const steps = [
  { title: "Create Your Store", icon: Store },
  { title: "Add Products", icon: PlusCircle },
  { title: "Start Selling", icon: ShoppingCart },
  { title: "Track Performance", icon: TrendingUp },
];

function HowItWorks() {
  const fade = useFadeIn();
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
      <div
        ref={fade.ref}
        className={`max-w-7xl mx-auto px-6 ${fade.className}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Up and running in minutes
          </h2>
        </div>
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-green-200" />
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-green-200 text-green-600 flex items-center justify-center shadow-sm mb-4">
                <s.icon className="w-8 h-8" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  ROLES                                         */
/* ────────────────────────────────────────────── */
const roles = [
  {
    name: "Owner",
    icon: Crown,
    color: "bg-amber-100 text-amber-600",
    caps: [
      "Full system access",
      "Approve users",
      "Assign roles",
      "View reports",
    ],
  },
  {
    name: "Manager",
    icon: UserCog,
    color: "bg-blue-100 text-blue-600",
    caps: ["Manage products", "Handle sales", "View reports"],
  },
  {
    name: "Viewer",
    icon: Eye,
    color: "bg-purple-100 text-purple-600",
    caps: ["View products", "View reports"],
  },
];

function Roles() {
  const fade = useFadeIn();
  return (
    <section id="roles" className="py-20 lg:py-28 bg-white">
      <div
        ref={fade.ref}
        className={`max-w-7xl mx-auto px-6 ${fade.className}`}
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            Access Control
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Role-based permissions
          </h2>
          <p className="mt-4 text-gray-500">
            Securely manage your team with granular access levels.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {roles.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div
                className={`w-14 h-14 rounded-xl ${r.color} flex items-center justify-center mx-auto mb-4`}
              >
                <r.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {r.name}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 text-left">
                {r.caps.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  POS PREVIEW                                   */
/* ────────────────────────────────────────────── */
const posFeatures = [
  { text: "Quick product search", icon: Search },
  { text: "Add to cart instantly", icon: Plus },
  { text: "Real-time totals", icon: Calculator },
  { text: "Fast checkout", icon: CreditCard },
];

function POSPreview() {
  const fade = useFadeIn();
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div
        ref={fade.ref}
        className={`max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 ${fade.className}`}
      >
        {/* POS mock */}
        <div className="flex-1 max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400">Point of Sale</span>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 h-9 bg-gray-100 rounded-lg flex items-center px-3">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="ml-2 text-xs text-gray-400">
                  Search products...
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["Coffee", "Bread", "Milk"].map((p) => (
                <div
                  key={p}
                  className="bg-green-50 rounded-lg p-3 text-center text-xs font-medium text-gray-700"
                >
                  {p}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">3 items</span>
              <span className="text-lg font-bold text-green-700">₱245.00</span>
            </div>
            <button className="mt-3 w-full bg-green-600 text-white text-sm font-semibold rounded-lg py-2.5">
              Checkout
            </button>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">
            POS System
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Experience a fast and modern POS
          </h2>
          <p className="text-gray-500 mb-8">
            Designed for speed and simplicity — ring up sales in seconds, not
            minutes.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {posFeatures.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  CTA                                           */
/* ────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="py-20 lg:py-24 bg-green-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent)] -z-0" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Start Managing Your Store Today
        </h2>
        <p className="text-green-100 text-lg mb-8">
          Simple, powerful, and built for your business.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold rounded-lg px-8 py-4 text-lg hover:bg-green-50 transition shadow-lg"
        >
          Create Your Store Now <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*  FOOTER                                        */
/* ────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-lg"
        >
          <Store className="w-5 h-5" /> StoreFlow
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white transition">
            How It Works
          </a>
          <a href="#roles" className="hover:text-white transition">
            Roles
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="hover:text-white transition"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="hover:text-white transition"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="hover:text-white transition"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} StoreFlow. All rights reserved.
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────── */
/*  LANDING PAGE                                  */
/* ────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Roles />
      <POSPreview />
      <CTA />
      <Footer />
    </div>
  );
}
