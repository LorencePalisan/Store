# Store Manager

A web-based store management system built with React, TypeScript, and Firebase. Designed for small businesses to manage products, process sales via a POS interface, track reports, and control staff access with role-based permissions.

---

## Features

- **Point of Sale (POS)** — Click-to-add product grid, cart management, and checkout with stock auto-decrement
- **Product Management** — Add, edit, and delete products with image URL, price, stock, and category support
- **Category Management** — Create and manage product categories with autocomplete suggestions
- **Sales Reports** — Filter by Today / This Week / This Month, view totals, and export to CSV
- **User Management** — Owner approves/rejects registrations and assigns roles (Manager, Viewer)
- **Role-Based Access** — Owner, Manager, and Viewer roles with route-level protection
- **Authentication** — Email/password sign-in, registration, password reset
- **Owner Setup Flow** — First registered user claims ownership and sets up the store
- **Landing Page** — Marketing page with features, roles, and how-it-works sections

---

## Tech Stack

| Layer        | Technology                  |
| ------------ | --------------------------- |
| Frontend     | React 19 + TypeScript       |
| Build Tool   | Vite 8                      |
| Styling      | Tailwind CSS 4              |
| Routing      | React Router v7             |
| Backend / DB | Firebase (Auth + Firestore) |
| Icons        | Lucide React                |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication (Email/Password) enabled

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd store

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> `.env` is listed in `.gitignore` and will not be committed.

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## Firestore Rules

Deploy the included `firestore.rules` file to your Firebase project:

```bash
# Using Firebase CLI
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` directly into the Firebase Console under **Firestore → Rules**.

---

## Project Structure

```
src/
├── assets/
├── components/
│   ├── Layout.tsx          # Sidebar navigation and app shell
│   └── ProtectedRoute.tsx  # Role-based route guard
├── contexts/
│   └── AuthContext.tsx     # Firebase auth + Firestore user state
├── pages/
│   ├── Landing.tsx         # Public marketing page
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ForgotPassword.tsx
│   ├── Pending.tsx         # Awaiting approval screen
│   ├── SetupStore.tsx      # First-user owner setup
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Categories.tsx
│   ├── POS.tsx
│   ├── Reports.tsx
│   └── UserManagement.tsx
├── types/
│   └── index.ts            # TypeScript interfaces
├── firebase.ts             # Firebase initialization
├── App.tsx                 # Routes
└── main.tsx
```

---

## User Roles

| Role        | Access                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| **Owner**   | Full access — Dashboard, Products, Categories, POS, Reports, User Management |
| **Manager** | Dashboard, Products, Categories, POS, Reports                                |
| **Viewer**  | Dashboard, Products, Reports (read-only)                                     |

---

## First-Time Setup

1. Register an account
2. If no store exists yet, you'll be prompted: **"Are you the store owner?"**
3. Click **Yes** → enter your store name → store is created and you become the Owner
4. Subsequent users register and wait for the Owner to approve them in **User Management**

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
