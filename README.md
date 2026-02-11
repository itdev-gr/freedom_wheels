# Freedom Wheels

Scooter rental website for Chania, Crete. Built with [Astro](https://astro.build).

## Admin dashboard and Firebase Auth

The admin area at `/admin` uses **Firebase Authentication** (email/password). Only users with the custom claim `admin: true` can access the dashboard.

**Environment variables (Vercel / `.env`):**

- **Server (Firestore + Auth):** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from Firebase Console → Project settings → Service accounts → Generate new private key).
- **Client (login page):** `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_APP_ID` (from Firebase Console → Project settings → General → Your apps → Web app config).

**Setting the admin claim:** After creating a user in Firebase Console → Authentication → Users, set the custom claim so they can access the dashboard:

```bash
FIREBASE_PROJECT_ID=your-project FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY='...' node scripts/set-admin-claim.mjs <USER_UID>
```

Get the user's UID from Firebase Console → Authentication → Users.

## Deploy on Vercel

1. Push your code to GitHub (e.g. [itdev-gr/freedom_wheels](https://github.com/itdev-gr/freedom_wheels)).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import your Git repository. Vercel will detect Astro automatically.
4. **Build Command:** `npm run build` (default)  
   **Output Directory:** `dist` (default)  
   **Install Command:** `npm install` (default)
5. Click **Deploy**. Your site will be live at `https://your-project.vercel.app`.

Optional: install [Vercel CLI](https://vercel.com/docs/cli) and run `vercel` in the project root to deploy from the terminal.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
