# Freedom Wheels

Scooter rental website for Chania, Crete. Built with [Astro](https://astro.build).

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
