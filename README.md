# REHAN AI

> **"Your AI Assistant for Coding, Learning & Productivity"**

REHAN AI is a complete, full-stack AI and coding assistant web application built with React, Vite, TypeScript, Tailwind CSS, Express, Google Gemini API, Firebase Firestore & Authentication, and Razorpay payment gateway integration.

---

## Features

1. **ChatGPT-Style AI Assistant**
   - Multi-turn conversation memory stored in Firebase Cloud Firestore.
   - Streaming responses with stop generation & regenerate capabilities.
   - Rich Markdown rendering: syntax-highlighted code blocks, copy-to-clipboard, tables, blockquotes, and lists.
   - File and image attachment analysis (Images, PDFs, Text files, Code files).
   - Fast switching between Gemini 3.8 Flash and Gemini 3.1 Pro models.

2. **Full-Featured Coding Workspace**
   - Multi-file in-browser project editor with file explorer (HTML, CSS, JS, TS, Python, SQL, etc.).
   - AI Code Copilot: Explain code, find and fix bugs, refactor for performance, generate unit tests, and generate documentation.
   - "Apply AI Changes Directly" button to paste AI fixes straight into project files.
   - One-click project export.

3. **Google Authentication & Firebase Security**
   - Single-click Google Sign-In with Firebase Authentication (`signInWithPopup`).
   - Hardened `firestore.rules` enforcing ABAC (Attribute-Based Access Control) and zero-trust data access.
   - Users can only access their own private chats and messages.

4. **Tiered Subscription & Razorpay Integration**
   - **Free Plan**: 30 messages/day with general chat and basic coding assistance.
   - **Monthly Pro**: ₹99 / 1 month.
   - **3 Months Quarter**: ₹249 / 3 months.
   - **6 Months Half-Year**: ₹449 / 6 months.
   - **Yearly Ultimate**: ₹799 / 12 months (Best value - 33% discount).
   - Razorpay payment order generation and cryptographic HMAC-SHA256 signature verification.
   - Razorpay webhook receiver with replay attack prevention and idempotency.

5. **Owner-Only Admin Dashboard (`/admin`)**
   - Private administrative panel reserved strictly for the owner email (`rehanvipmd@gmail.com`).
   - Verified server-side on every request (non-owner requests are rejected with 403 Forbidden).
   - Live metrics: Total users, active premium users, gross revenue, transaction log, and AI token requests.
   - User directory with status view and suspension controls.
   - Dynamic plan pricing editor and daily free quota adjusters.
   - Audit logs for all administrative actions.

---

## Getting Started & Configuration

### 1. Firebase Project Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In the left navigation, click **Authentication** > **Sign-in method** > enable **Google**.
3. Under **Firestore Database**, create a Firestore database in your preferred region.
4. Under **Storage**, create a default storage bucket.
5. In **Project Settings**, add a Web App (`</>`) and copy the configuration credentials into `firebase-applet-config.json`.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:

```bash
# Gemini API Key (injected automatically in AI Studio)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Owner Email for Admin Access
OWNER_ADMIN_EMAIL="rehanvipmd@gmail.com"

# Razorpay Credentials
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Firebase Admin Service Account (for production webhooks)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Deploy Firestore & Storage Rules
Deploy the provided security rules to your Firebase project:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules
```

### 4. Running the Development Server
Install dependencies and launch the dev server:

```bash
npm install
npm run dev
```

The application will start on `http://localhost:3000`.

### 5. Building for Production
Build the optimized client bundle and start the full-stack server:

```bash
npm run build
npm start
```

---

## Security Invariants

- Normal users can never escalate their own privileges or modify their `role`, `planId`, or `subscriptionStatus`.
- Razorpay payments are verified strictly server-side using cryptographic HMAC SHA256 digests; subscriptions are never granted from frontend callbacks alone.
- Non-owner emails attempting to query `/api/admin/*` endpoints receive a `403 Forbidden` response.
- All code assistance complies with standard security and defensive engineering practices.
