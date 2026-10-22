# Contributing to Tuck

Thank you for your interest in contributing to **Tuck**! Whether you are fixing a bug, suggesting a new feature, improving documentation, or optimizing performance, your contributions are welcome and greatly appreciated.

---

## 🌟 How to Contribute

### 1. Give the Project a Star ⭐
If you find Tuck helpful, giving the repository a star on GitHub helps increase visibility, attracts more contributors, and validates the project!

### 2. Reporting Bugs
- Search the [Issues tab](https://github.com/raviattrash-pro/tuck-vault/issues) first to ensure the bug hasn't already been reported.
- If it hasn't, open a new issue using our **Bug Report Template**.
- Provide reproduction steps, browser/OS versions, and console screenshots if possible.

### 3. Suggesting Features
- We love hearing ideas for new modules, privacy features, or UI improvements.
- Open an issue using our **Feature Request Template** with a clear explanation of the problem and the proposed solution.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18.x or later
- npm or pnpm or yarn
- Git

### Steps
1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/tuck-vault.git
   cd tuck-vault
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Setup environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase and Google OAuth keys (or leave them empty to test purely offline IndexedDB mode).
5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🧪 Coding Standards & Guidelines

- **TypeScript**: Tuck is written in strict TypeScript. Avoid `any` types wherever possible.
- **Tailwind CSS**: Follow our warm cream `#FAF8F5` aesthetic and accessible contrast standards (WCAG AA).
- **Offline-First Principle**: All reads and writes should go through Dexie IndexedDB first so the app functions seamlessly without internet connectivity.
- **Clean Commits**: Write clear, descriptive commit messages (e.g., `feat: add export to JSON in settings` or `fix: card mask toggle on mobile`).
- **Build Verification**: Always verify that `npm run build` succeeds cleanly before opening a pull request.

---

## 🚀 Submitting a Pull Request (PR)

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat: add my new feature"
   ```
3. Push to your fork:
   ```bash
   git push origin feat/my-new-feature
   ```
4. Open a Pull Request against the `main` branch of `raviattrash-pro/tuck-vault`.
5. Fill out the PR template with a summary of changes and testing steps.

---

## 📜 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender identity, race, or background. Please treat everyone with respect and empathy.
