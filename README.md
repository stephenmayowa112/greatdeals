# DealPulse – Deals Discovery Platform

A fast, mobile-first deals discovery web platform presenting a scrollable feed of curated promos and discounted sales that link out directly to original merchant retailers. **DealPulse does not process checkout or payments**; each deal snippet features verified outbound links to the merchant’s official checkout.

---

## Architecture Overview

DealPulse is built with a decoupled, high-performance architecture:
- **Public & Admin Frontend**: **Next.js 15+ (App Router)** with **TypeScript**, **Tailwind CSS**, and **motion**.
  - Server-rendered homepage feed and individual deal pages (`/deals/[id]`) for optimal SEO, OpenGraph tags, and Schema.org `Product` / `Offer` structured data.
  - Client-side infinite scroll feed powered by **cursor-based pagination**.
  - URL query string synchronization for keyword search and category filters.
  - Automatic exclusion of expired and non-live deals.
  - Complete, authenticated admin dashboard for deal & category CRUD.
- **Backend Options**:
  - **Integrated Next.js REST API**: Ready-to-run API routes (`/api/deals`, `/api/categories`, `/api/admin/*`, `/api/tests`) providing immediate local and preview execution on port 3000.
  - **Django 5 + Django REST Framework + PostgreSQL**: Full production backend located in `/backend` with cursor pagination (`DealCursorPagination`), model migrations, custom admin actions, seed commands, and Django test suite.
  - **Redis**: Optional feed caching and rate limiting.
  - **Object Storage (S3)**: S3-compatible image upload pipeline with local filesystem fallback.

---

## Data Models

### 1. `Category`
| Field | Type | Description |
|---|---|---|
| `id` | ID / String | Unique identifier |
| `name` | String / CharField | Category display name (e.g., Electronics, Audio & Sound, Gaming) |
| `slug` | String / SlugField | URL-safe slug for routing and query filtering |
| `description` | Text | Optional category summary |

### 2. `Deal`
| Field | Type | Description |
|---|---|---|
| `id` | ID / String | Unique deal identifier |
| `title` | String / CharField | Headline description of the item |
| `short_description` | Text | Brief promotional snippet (2-3 sentences) |
| `image` / `image_url` | File / URL | Product image or CDN URL |
| `original_price` | Decimal (optional) | Regular manufacturer/retail price |
| `discounted_price` | Decimal (optional) | Sale price |
| `percentage_off` | Integer (optional) | Computed discount percentage (`(orig - disc) / orig * 100`) |
| `category` | FK (`Category`) | Relationship to parent category |
| `source_name` | String / CharField | Retailer/merchant brand (e.g. Amazon, Best Buy, Nike, Apple) |
| `source_url` | URL | Outbound link opened in new tab (`rel="noopener noreferrer"`) |
| `status` | Choice | `live`, `draft`, `expired` |
| `posted_at` | DateTime | Timestamp when deal was published (ordering anchor) |
| `expires_at` | DateTime (optional) | Timestamp when deal ends; past dates auto-exclude deal |

---

## Key Features

### 1. Public Site
- **Scrollable Feed**: Infinite scroll feed sorted newest-first using cursor-based pagination.
- **Search & Category Filtering**: Real-time keyword search across `title` and `short_description` combined with category filtering, synchronized to the browser's URL query string (`/?category=audio&q=headphones`).
- **Expired Deal Exclusion**: Deals with `status == 'expired'` or `expires_at <= now` are automatically hidden from the public feed.
- **Direct Deal View & SEO**: Individual deal pages (`/deals/[id]`) are fully server-rendered with dynamic OpenGraph meta tags and Schema.org JSON-LD `Product` structured data.
- **Outbound "Get Deal" CTAs**: Direct link out to merchant sites with `rel="noopener noreferrer"` and `target="_blank"`.

### 2. Admin Dashboard (`/admin`)
- **Authentication**: Admin credentials login with session persistence (`admin@dealpulse.io` / `admin123`).
- **Deal Management**: Create, edit, and delete deals; upload images or attach image URLs; set status to `live`, `draft`, or `expired`.
- **Category Management**: Create, edit, and delete categories with live deal count tracking.
- **Interactive Feed Test Runner**: Execute live automated API verification checks directly from the admin dashboard with one click.
- **One-Click Re-seed**: Reset to the curated 20+ sample deal dataset anytime.

---

## Quickstart: Running the Application

### 1. Running the Next.js Full-Stack App
```bash
# Install dependencies
npm install

# Run the development server (runs on port 3000)
npm run dev

# Open in browser:
# http://localhost:3000 (Public Deals Feed)
# http://localhost:3000/admin (Admin Console)
# http://localhost:3000/api/tests (Feed API Test Suite)
```

### 2. Running the Django + PostgreSQL Backend (`/backend`)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample categories and ~20 realistic deals
python manage.py seed_deals

# Run Django development server
python manage.py runserver 0.0.0.0:8000

# Access Django Admin:
# http://localhost:8000/admin/
```

### 3. Running with Docker Compose (PostgreSQL + Redis + Django)
```bash
cd backend
docker-compose up --build
```
This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Django REST API on `localhost:8000` with seeded sample deals

---

## Running Backend Feed Tests

### Django Test Suite
```bash
cd backend
python manage.py test deals.tests.test_deals_feed
```
Tests verified:
1. `test_cursor_pagination`: Ensures cursor-based pagination returns page 1, next link, and page 2 without overlapping items.
2. `test_category_filter`: Ensures filtering by `?category=audio` returns only Audio deals.
3. `test_search_filter`: Ensures query `?q=Keyboard` matches title/description correctly.
4. `test_expired_and_draft_deals_exclusion`: Verifies expired deals (status or timestamp) and draft deals are strictly excluded from the feed.
5. `test_percentage_off_auto_calculation`: Verifies automated percentage computation on deal save.

### Next.js API Test Suite
You can run or view the automated tests at any time via:
- Visiting `http://localhost:3000/api/tests`
- Or navigating to the **Admin Dashboard > Automated Feed Tests** tab in the UI.

---

## Environment Variables

See `.env.example` in root and `backend/.env.example` for full specifications:
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string for feed caching.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`: S3 image storage.
