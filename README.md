# Philly Restaurant Tracker

A full-stack web app for logging restaurant visits across Philadelphia, with a Tableau dashboard layered on top to visualize dining patterns over time.

**Status:** 🚧 In progress — Summer 2026 build.

---

## Why I'm building this

I eat out in Philly a lot and I never remember:
- Which spots I loved vs. which were just hyped
- What neighborhoods I keep returning to
- Where I took someone for a specific occasion (anniversary, birthday, casual)

This app fixes that, and along the way it's my summer portfolio project — full-stack on AWS with a real data viz layer.

## What it does

- Log a restaurant visit via a web form (name, neighborhood, cuisine, price tier, rating, occasion, notes)
- View past visits in a sortable list
- Admin view with aggregate stats (most-visited neighborhoods, average rating by cuisine, etc.)
- Tableau Public dashboard reading from the underlying data

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | HTML, Bootstrap 5.3.3, jQuery, FontAwesome |
| API | AWS API Gateway → AWS Lambda (Node.js) |
| Database | AWS RDS (MySQL) via `mysql2` |
| Auth | Token-based (same pattern as MIS3502 final project) |
| Visualization | Tableau Public dashboard |
| Hosting | AWS S3 static site for frontend |

## Architecture

```
[Browser] → [S3 static site]
              ↓ (fetch via jQuery $.ajax)
        [API Gateway]
              ↓
         [Lambda router]
              ↓
         [RDS MySQL]
              ↑
       [Tableau Desktop] → [Tableau Public dashboard]
```

## Project milestones

- [ ] **Week 1** — Frontend form + in-memory list (no backend yet)
- [ ] **Week 2** — RDS MySQL set up, Lambda + API Gateway wired in
- [ ] **Week 3** — Full CRUD working end-to-end
- [ ] **Week 4** — Token-based login
- [ ] **Week 5** — Admin reporting endpoint with JOIN across users/visits
- [ ] **Week 6** — Deploy frontend to S3
- [ ] **Week 7** — AWS Cloud Practitioner cert
- [ ] **Week 8** — Tableau dashboard built on visit data
- [ ] **Week 9** — Tableau Desktop Specialist cert
- [ ] **Week 10** — README polish, Loom walkthrough, LinkedIn post

## Live demo

_Coming soon._

## Author

Max Perry — MIS junior at Temple University's Fox School of Business Honors Program.
