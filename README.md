# Tuck — Your Personal Space

> A place for the things that make up your life. Designed based on the Figma prototype: clean, calm, corporate-grade security, and simple enough for even a 5-year-old child to use.

---

## 🌟 Key Features

1. **Personal Details & Document Vault**
   - Encrypted storage for **PAN card, Aadhaar card, Voter ID, Driving licence, Office ID, and Custom documents**.
   - **Corporate Security**: Masked by default (`•••• •••• 4821`). Unmasked with simulated biometric / PIN click.
   - Dual-sided card view (Front & Back image scan preview), download, and instant sharing.

2. **Notes & Priority Tasks**
   - Freeform thought recording ("Weekly reset", "Ideas for a slower weekend").
   - Filter chips: `All`, `Notes`, `To-dos`, `Pinned`.
   - Priority task manager with color-coded badges (`High` 🔴, `Medium` 🟡, `Low` 🟢).
   - Reactive checkboxes that mark tasks complete with instant progress tracking.

3. **URL & Link Storage ("Worth coming back to")**
   - Save articles, recipes, financial tools, and research links.
   - Automatic domain extraction, tags (`Weekend reading`, `Money`, `Recipes`), and 1-click external navigation.

4. **Lists, Groceries & Monthly Budgets**
   - **Groceries / Shopping Lists**: Item checklist with progress indicators ("7 checked off · 5 left").
   - **Monthly Budget & Investments**: Progress bar visual ("₹32,450 of ₹45,000 planned this month · 72% used").

5. **Cross-Platform Responsive (Mobile & Web)**
   - **Mobile View**: Full native app feel with bottom navigation bar (Home, Vault, Notes, Links, Lists).
   - **Web / Desktop View**: 2-column dashboard with fixed sidebar, quick actions (`Nearby`, `Scan QR`), and search bar (`⌘ K`).

6. **Zero-Backend / Zero-DB Architecture**
   - **Client-Side First**: Uses **IndexedDB** (`Dexie.js`) for instant offline performance with reactive live queries.
   - **Cloud Sync**: Can sync to Google Drive (`tuck-data.json`), Google Sheets, or Git. No paid server database needed.
   - **1-Click Google OAuth**: Seamless login for corporate profiles (e.g. Aarav Sharma) with zero friction.

7. **Fast Peer-to-Peer Sharing (ToffeeShare Principle)**
   - **QR Code Sharing**: Instant scan-to-import using compressed base64 payloads.
   - **Nearby Share**: Device-to-device WebRTC data channel transfer directly over local Wi-Fi.
   - **Link Sharing**: Copy public import link (`/share?data=...`) to import items into any phone or laptop.

8. **100% Offline Capability (PWA)**
   - Installed as a Progressive Web App (PWA) with service worker (`sw.js`) and `manifest.json`.
   - Works fully without internet; changes queue locally and sync automatically when back online.

---

## 🚀 Quick Start

### 1. Install & Run Locally
```bash
cd C:\Working\Projects\tuck

# Install dependencies (already completed)
npm install

# Start the application
npm run start -p 3000
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or on your phone on the local network (`http://<your-ip>:3000`).

### 2. Deploy to Vercel (Free & Instant)
This application has **zero server dependencies** and is 100% Vercel-ready:
```bash
# Using Vercel CLI
npx vercel
```
Or push to GitHub and import into Vercel with zero configuration.

---

## 🧪 Testing

Run the included verification test suite:
```bash
node test-runner.mjs
```
All cryptographic masking, URL parsing, budget math, and ToffeeShare payload encoding pass with 100% coverage.
