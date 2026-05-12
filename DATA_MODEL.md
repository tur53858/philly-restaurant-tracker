# Data Model — Philly Restaurant Tracker

Locked-in schema, v1. Refactor only if you hit a real wall.

---

## Tables

### `users`
Multi-user from day one — same pattern as MIS3502 final. Even though it's just you at launch, the auth + JOIN infrastructure is what makes this a portfolio-worthy project.

| Column | Type | Notes |
|---|---|---|
| `user_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `username` | VARCHAR(50), UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255), NOT NULL | bcrypt |
| `is_admin` | BOOLEAN, DEFAULT FALSE | |
| `created_at` | DATETIME, DEFAULT CURRENT_TIMESTAMP | |

### `restaurants`
A unique place. Entered once, visited many times.

| Column | Type | Notes |
|---|---|---|
| `restaurant_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `name` | VARCHAR(100), NOT NULL | "Vetri", "Royal Sushi" |
| `neighborhood` | VARCHAR(50) | "Rittenhouse", "Fishtown", "Old City" |
| `cuisine` | VARCHAR(50) | "Italian", "Sushi", "American" |
| `price_tier` | INT | 1–4 (maps to $, $$, $$$, $$$$) |
| `address` | VARCHAR(200) | optional, freeform for now |
| `created_at` | DATETIME, DEFAULT CURRENT_TIMESTAMP | |

### `visits`
One dining experience. The table you'll write to most.

| Column | Type | Notes |
|---|---|---|
| `visit_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `restaurant_id` | INT, FOREIGN KEY → restaurants.restaurant_id, NOT NULL | |
| `user_id` | INT, FOREIGN KEY → users.user_id, NOT NULL | |
| `visit_date` | DATE, NOT NULL | |
| `rating` | INT | 1–5, whole numbers |
| `occasion` | VARCHAR(50) | "anniversary", "casual", "date night", "with friends" |
| `would_return` | BOOLEAN | TRUE / FALSE — the single most useful field for filtering |
| `dish_ordered` | VARCHAR(200) | "veal parm", "omakase 12-piece" |
| `next_time_try` | VARCHAR(200) | "the cacio e pepe", "the chef's tasting menu" |
| `notes` | TEXT | freeform |
| `created_at` | DATETIME, DEFAULT CURRENT_TIMESTAMP | |

---

## Relationships

- One `restaurant` → many `visits` (via `visits.restaurant_id`)
- One `user` → many `visits` (via `visits.user_id`)

**Naming convention — STICK TO THIS:** every foreign key references the primary key with the *exact* same column name. The user who created a visit is `visits.user_id`. Not `userid`, not `createdby`, not `created_by_user`. This is the same trap that bit you in MIS3502. Lock it down now.

---

## Queries you'll need to write

### Read
- All visits for the logged-in user, with restaurant name/neighborhood joined in (homepage list)
- Visits filtered by neighborhood / cuisine / would_return
- One visit by ID (for edit screen)
- All restaurants (for the dropdown when logging a new visit)

### Write
- Insert a new restaurant
- Insert a new visit
- Update a visit
- Delete a visit

### Aggregate (the resume gold)
- Top-rated restaurants: average rating + visit count per restaurant, sorted DESC
- Neighborhood breakdown: visit count and avg rating per neighborhood
- "Would return" hit rate per cuisine
- **Admin endpoint:** all of the above across ALL users (JOIN users + visits + restaurants), proving you can write multi-table JOINs in production code

---

## Lambda endpoint plan

| Method | Path | Purpose | SQL behind it |
|---|---|---|---|
| POST | /login | Auth, return token | SELECT user, verify hash |
| POST | /signup | New user | INSERT INTO users |
| GET | /visits | List visits for logged-in user | SELECT … JOIN restaurants WHERE user_id = ? |
| GET | /visits/{id} | Get one visit | SELECT … JOIN restaurants WHERE visit_id = ? |
| POST | /visits | Create a visit | INSERT INTO visits |
| PUT | /visits/{id} | Update a visit | UPDATE visits SET … WHERE visit_id = ? |
| DELETE | /visits/{id} | Delete a visit | DELETE FROM visits WHERE visit_id = ? |
| GET | /restaurants | List all restaurants | SELECT * FROM restaurants |
| POST | /restaurants | Add a restaurant | INSERT INTO restaurants |
| GET | /stats/top-rated | Aggregate stats for current user | SELECT … GROUP BY restaurant_id |
| GET | /admin/all-stats | Cross-user aggregate (admin only) | SELECT … JOIN users + visits + restaurants |

All routes go through ONE Lambda function. The router reads `event.httpMethod` and `event.path` and dispatches to a supporting function — same pattern as your MIS3502 final.

---

## Sanity checks before coding

- [x] Every table has a primary key
- [x] Foreign keys use matching column names (`user_id`, `restaurant_id`)
- [x] No column-name drift across tables
- [x] Each endpoint has a one-sentence purpose
- [x] At least one JOIN query sketched out

You're cleared to start building. **Week 1 task: frontend form + in-memory list, no backend yet.**
