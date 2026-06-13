# GxP Compliance Group — Static HTML/CSS/JS + PHP/MySQL Version

This is a 1:1 conversion of the original React + Node/Express + PostgreSQL app
into plain HTML, CSS, JavaScript and PHP — compatible with Hostinger's
shared/premium hosting plans (no VPS / Node required).

## File overview

- `index.html` — Home page (all sections: hero, about, services, reach, contact form, locations)
- `careers.html` — Careers page
- `login.html` — Business portal login
- `dashboard.html` — Inquiry dashboard (requires login)
- `admin.html` — User management (admin role only)
- `style.css`, `script.js` — shared styling and front-end behaviour
- `api/` — PHP backend (replaces the Node/Express server)

## How the API maps to the old Node routes

| Old Node route | New PHP file |
|---|---|
| `POST /api/inquiries` | `api/inquiries.php` |
| `POST /api/auth/login` | `api/login.php` |
| `GET /api/dashboard/inquiries` | `api/dashboard_inquiries.php` |
| `PATCH /api/dashboard/inquiries/:custid` | `api/dashboard_update.php?custid=...` |
| `GET /api/users`, `POST /api/users` | `api/users.php` |
| `PATCH /api/users/:uid`, `DELETE /api/users/:uid` | `api/user.php?uid=...` |

Authentication uses the same Bearer-token pattern as before, but the token
is created/verified with PHP's built-in `hash_hmac` instead of the
`jsonwebtoken` npm package — no extra libraries needed.

---

## Setting up MySQL on Hostinger

1. **Create a database**
   - Log in to Hostinger **hPanel** → **Databases** → **MySQL Databases**.
   - Create a new database (e.g. `u123456789_gxp`) and a database user
     (e.g. `u123456789_gxpuser`) with a strong password.
   - Hostinger auto-prefixes names with your account ID — that's normal.

2. **Import the schema**
   - In hPanel, open **phpMyAdmin** for the new database.
   - Go to the **Import** tab, choose `api/schema.sql`, and click **Go**.
   - This creates the `inquiries` and `users` tables, and seeds a default
     admin account.

3. **Update `api/config.php`**
   Open `api/config.php` and replace the placeholder values:

   ```php
   define('DB_HOST', 'localhost');           // usually 'localhost' on Hostinger
   define('DB_NAME', 'u123456789_gxp');       // your actual database name
   define('DB_USER', 'u123456789_gxpuser');   // your actual database user
   define('DB_PASS', 'your-db-password');     // your actual database password

   define('JWT_SECRET', 'a-long-random-secret-string'); // change this!
   ```

   You can generate a random secret string at
   https://www.random.org/strings/ or by running `openssl rand -hex 32`
   in any terminal.

4. **Default login**
   - Username: `admin`
   - Password: `admin`
   - **Change this immediately** after first login via Admin → Reset Pass,
     or update the `users` table directly.

5. **Upload everything**
   - Upload the entire contents of this folder (including the `api/`
     folder) to `public_html` (or your domain's document root) via
     Hostinger's File Manager or FTP.
   - No build step, no `npm install`, no Node process required — PHP runs
     automatically on Hostinger shared hosting.

6. **Test**
   - Visit `https://yourdomain.com/` — the homepage and contact form should work.
   - Visit `https://yourdomain.com/login.html` and log in with the admin
     credentials to view the dashboard.

---

## Notes / things that changed from the original

- PostgreSQL-specific syntax (`GENERATED ALWAYS AS IDENTITY`, etc.) was
  converted to MySQL's `AUTO_INCREMENT`.
- `bcryptjs` (Node) → PHP's built-in `password_hash()` / `password_verify()`
  (also bcrypt — fully compatible hashing algorithm).
- `jsonwebtoken` (Node) → a small custom HMAC-signed token helper in
  `api/auth_helper.php` (same Bearer-token usage from the front end).
- CORS is configured in `api/config.php` via the `CORS_ORIGIN` constant —
  set this to your real domain once live (currently `*` for testing).
- Email notifications (`mailer.js`) were not ported — Hostinger supports
  PHP's `mail()` function or SMTP if you want to re-add this; let us know
  if you'd like this wired up.
- No content, copy, layout, or design was changed — only the technology
  stack (React/Node/Postgres → HTML/CSS/JS + PHP/MySQL).
