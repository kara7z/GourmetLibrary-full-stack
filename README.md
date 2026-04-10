# GourmetLibrary Full-Stack

GourmetLibrary is a full-stack cookbook and recipe library project with:

- a Laravel backend API in `Backend/`
- a Vue 3 frontend source app in `frontend/`
- a production build of the frontend served directly by Laravel from `Backend/public/`

## Project Structure

```text
GourmetLibrary Full-Stack/
├── Backend/      # Laravel API and public server files
└── frontend/     # Vue source code
```

Important folders:

- `Backend/routes/api.php`: API routes
- `Backend/routes/web.php`: frontend fallback route
- `Backend/database/seeders/DatabaseSeeder.php`: sample users, categories, and books
- `frontend/src/`: Vue application source
- `Backend/public/index.html`: built Vue entry file served by Laravel
- `Backend/public/assets/`: built Vue JS/CSS assets

## Features

- Public browsing of books and categories
- Book detail page
- Search page with live suggestions
- Borrow and return flow for authenticated readers
- Admin dashboard
- Admin create, update, and delete for books and categories
- Custom frontend pages for `403`, `404`, and `500`
- One-time book view tracking per browser for the consultation counter

## Tech Stack

- Laravel 12
- PHP 8.2+
- Laravel Sanctum
- Vue 3
- Vue Router
- Axios
- Vite

## Default Seeded Accounts

After seeding, these users are available:

- Admin
  - Email: `admin@gourmet.com`
  - Password: `password`
- Reader
  - Email: `user@gourmet.com`
  - Password: `password`

## Backend Setup

From the `Backend/` folder:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

Then start Laravel:

```bash
php artisan serve
```

The API will be available under:

- `http://127.0.0.1:8000/api/...`

## Frontend Development Flow

The Vue source code lives in `frontend/src`.

Laravel does not read those source files directly.

Instead, you:

1. edit Vue files inside `frontend/src`
2. build the frontend
3. Laravel serves the built result from `Backend/public`

Install frontend dependencies:

```bash
cd frontend
npm install
```

Build the frontend:

```bash
npm run build
```

This writes the production frontend directly into:

- `Backend/public/index.html`
- `Backend/public/assets/`

So there is no manual copy step.

## Running the App

1. Start Laravel:

```bash
cd Backend
php artisan serve
```

2. Open the app in your browser:

```text
http://127.0.0.1:8000/
```

Examples:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/books`
- `http://127.0.0.1:8000/search`
- `http://127.0.0.1:8000/borrows`

## Important Build Notes

- `frontend/src/` is important because it contains the Vue source code you edit
- `Backend/public/` is important because Laravel serves files from there
- `frontend/dist/` is not used in the current setup

If you edit the frontend, Laravel will not show your changes until you run:

```bash
cd frontend
npm run build
```

## Book View Counter Behavior

Book consultation counts are stored in the database in `consultation_count`.

To avoid increasing the counter on every refresh:

- the frontend stores viewed book IDs in `localStorage`
- the backend only increments the counter when `track_view=1`

So the same browser only increments a given book once.

## API Highlights

Main public routes:

- `GET /api/books`
- `GET /api/books/{book}`
- `GET /api/categories`
- `GET /api/categories/{category}`
- `POST /api/register`
- `POST /api/login`

Authenticated reader routes:

- `POST /api/logout`
- `GET /api/borrows`
- `POST /api/books/{book}/borrow`
- `PATCH /api/borrows/{borrow}/return`

Admin routes:

- `POST /api/books`
- `PUT /api/books/{book}`
- `DELETE /api/books/{book}`
- `POST /api/categories`
- `PUT /api/categories/{category}`
- `DELETE /api/categories/{category}`
- `GET /api/admin/stats`

## Rebuild After Frontend Changes

Whenever you change Vue files:

```bash
cd frontend
npm run build
```

Then refresh the browser.

## Notes

- The frontend is served directly by Laravel at the root path
- No Blade template is used for the frontend application
- `Backend/routes/web.php` returns the built Vue `index.html` as the SPA entry point
