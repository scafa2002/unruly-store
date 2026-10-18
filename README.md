# Unruly store

1. Install Node.js 22.13 or newer (nodejs.org). No other installs needed.
2. In VS Code, open this folder, open the terminal and run: `node server.js`
3. Visit http://localhost:3000
4. Admin: go to /admin-login.html, choose Create account, and use the admin code printed in the terminal (default UNRULY-ADMIN).
   Set your own code before going live: `ADMIN_CODE=your-secret node server.js` (Windows PowerShell: `$env:ADMIN_CODE="your-secret"; node server.js`)

All data lives in `unruly.db` (SQLite) next to server.js: customers, admins, products, orders and email sign-ups. Back that file up.
