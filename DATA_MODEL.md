# Data Model Worksheet — Philly Restaurant Tracker

Fill this out **before writing any backend code.** Locking the schema down now saves you from painful migrations in week 4.

---

## Step 1: Entities

These are the "nouns" of your app. For the restaurant tracker, I'd suggest starting with three:

### `restaurants`
A unique place. You only enter a restaurant once, even if you visit it 10 times.

| Column | Type | Notes |
|---|---|---|
| `restaurant_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `name` | VARCHAR(100) | "Vetri", "Royal Sushi" |
| `neighborhood` | VARCHAR(50) | "Rittenhouse", "Fishtown" |
| `cuisine` | VARCHAR(50) | "Italian", "Sushi", "American" |
| `price_tier` | INT | 1–4 ($ to $$$$) |
| `address` | VARCHAR(200) | optional |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `visits`
A single dining experience. One restaurant → many visits.

| Column | Type | Notes |
|---|---|---|
| `visit_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `restaurant_id` | INT, FOREIGN KEY → restaurants | |
| `user_id` | INT, FOREIGN KEY → users | |
| `visit_date` | DATE | |
| `rating` | INT | 1–5 |
| `occasion` | VARCHAR(50) | "anniversary", "casual", "date", "with friends" |
| `notes` | TEXT | freeform |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `users`
Same pattern as your MIS3502 to-do app. Even if it's just you for now, build it multi-user from day one.

| Column | Type | Notes |
|---|---|---|
| `user_id` | INT, PRIMARY KEY, AUTO_INCREMENT | |
| `username` | VARCHAR(50), UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt |
| `is_admin` | BOOLEAN | DEFAULT FALSE |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## Step 2: Relationships

- One `restaurant` has many `visits` (linked via `visits.restaurant_id`)
- One `user` has many `visits` (linked via `visits.user_id`)
- Many `visits` reference one `restaurant` and one `user`

**Important — same trap as your MIS3502 project:** keep your column names consistent. The user who created a visit is `visits.user_id`, NOT `visits.createdby` or `visits.userid`. Pick a convention and stick with it across all tables.

---

## Step 3: The queries you'll write

Sketch these out now. They'll become your Lambda endpoints later.

**Read queries:**
- Get all visits for a user (with restaurant info joined in)
- Get visits filtered by neighborhood / cuisine / occasion
- Get aggregate stats: avg rating per restaurant, visit count per neighborhood

**Write queries:**
- Insert a new restaurant
- Insert a new visit
- Update a visit (fix typos, edit rating)
- Delete a visit

**Admin query (the resume gold):**
- JOIN users + visits + restaurants → return top 10 restaurants by average rating across all users, with visit count

---

## Step 4: Lambda endpoint plan

| Method | Path | What it does | SQL behind it |
|---|---|---|---|
| GET | /visits | List all visits for logged-in user | SELECT … JOIN restaurants |
| GET | /visits/{id} | Get one visit | SELECT … WHERE visit_id = ? |
| POST | /visits | Create a visit | INSERT INTO visits |
| PUT | /visits/{id} | Update a visit | UPDATE visits SET … |
| DELETE | /visits/{id} | Delete a visit | DELETE FROM visits |
| GET | /restaurants | List all restaurants | SELECT * FROM restaurants |
| POST | /restaurants | Add a new restaurant | INSERT INTO restaurants |
| GET | /admin/top-rated | Admin-only aggregate | SELECT … JOIN … GROUP BY |
| POST | /login | Auth | SELECT user, verify hash, return token |

All of this routes through one Lambda function — same pattern as your MIS3502 final. The router reads `event.httpMethod` and `event.path` and dispatches to a supporting function.

---

## Step 5: Sanity check before you start coding

- [ ] Every table has a primary key
- [ ] Every foreign key column matches the type of the column it references
- [ ] Column names are consistent across tables (`user_id` everywhere, not `userid` here and `createdby` there)
- [ ] You can describe in plain English what each endpoint does before opening VS Code
- [ ] You've written at least one of the JOIN queries out by hand to make sure it works

When all five are checked, you're ready to start building. Don't start before.
