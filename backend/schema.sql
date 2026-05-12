-- ============================================================
-- The Walk-In — Philly Restaurant Tracker
-- Database schema, v1
-- ============================================================
-- This script creates the three tables used by the Walk-In Lambda
-- function. Run this on a freshly-created MySQL database.
--
-- To run on AWS RDS:
--   1. Connect to RDS via MySQL Workbench (or `mysql` CLI)
--   2. CREATE DATABASE walkin;
--   3. USE walkin;
--   4. Run this script
-- ============================================================


-- ─── users ──────────────────────────────────────────────────
-- Each person who logs visits has a row here.
-- The pattern is borrowed from MIS3502: passwords stored as-is
-- per Prof. Shafer's "simplicity over security" rule.
-- (In a production app this would be a bcrypt hash.)

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id    INT NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)  NOT NULL,
  password   VARCHAR(255) NOT NULL,
  fname      VARCHAR(50)  NOT NULL,
  lname      VARCHAR(50)  NOT NULL,
  lasttoken  VARCHAR(36)  DEFAULT NULL,
  isadmin    VARCHAR(1)   NOT NULL DEFAULT 'N',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_username (username)
);


-- ─── logins ─────────────────────────────────────────────────
-- One row per login session. The token is a UUID that the
-- frontend includes on every authenticated request.

DROP TABLE IF EXISTS logins;

CREATE TABLE logins (
  login_id INT NOT NULL AUTO_INCREMENT,
  token    VARCHAR(36) NOT NULL,
  logints  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id  INT NOT NULL,
  PRIMARY KEY (login_id)
);


-- ─── restaurants ────────────────────────────────────────────
-- A unique place. Entered once, visited many times.

DROP TABLE IF EXISTS restaurants;

CREATE TABLE restaurants (
  restaurant_id INT NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  neighborhood  VARCHAR(50)  DEFAULT NULL,
  cuisine       VARCHAR(50)  DEFAULT NULL,
  price_tier    INT          DEFAULT NULL,
  address       VARCHAR(200) DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (restaurant_id)
);


-- ─── visits ─────────────────────────────────────────────────
-- One dining experience. Most-written-to table in the app.

DROP TABLE IF EXISTS visits;

CREATE TABLE visits (
  visit_id      INT NOT NULL AUTO_INCREMENT,
  restaurant_id INT NOT NULL,
  user_id       INT NOT NULL,
  visit_date    DATE NOT NULL,
  rating        INT          DEFAULT NULL,
  occasion      VARCHAR(50)  DEFAULT NULL,
  would_return  VARCHAR(1)   DEFAULT NULL,
  dish_ordered  VARCHAR(200) DEFAULT NULL,
  next_time_try VARCHAR(200) DEFAULT NULL,
  notes         TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (visit_id)
);


-- ─── seed data ──────────────────────────────────────────────
-- One admin user and one regular user to test with.
-- You'll change these passwords once it's working.

INSERT INTO users (username, password, fname, lname, isadmin) VALUES
  ('max',  'walkin123', 'Max', 'Perry', 'Y'),
  ('test', 'test123',   'Test', 'User', 'N');
