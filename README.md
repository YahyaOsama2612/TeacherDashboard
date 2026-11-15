# MathPortal — Teacher Dashboard

React 18 + Vite + Tailwind 3 + react-router-dom. Talks to the Math House backend (`Math_house-main`).

## Run

```bash
npm install
npm run dev        # uses .env.development → VITE_API_URL=http://localhost:3000
npm run build      # uses .env.production  → VITE_API_URL=https://bcknd.mathshouse.net
```

For local testing, start the backend first and seed a demo teacher:
`cd ../Math_house-main && npm run dev` and `npm run seed:teacher-demo` (the demo login is in
`Math_house-main/src/seeds/teacherPortalDemo.ts`).

## Screens (hash routes)

| Route | Screen |
|---|---|
| `#/dashboard` | Today / tomorrow schedule, next session, week chart, latest feedback |
| `#/sessions` | Upcoming / completed / cancelled sessions, cards or timetable |
| `#/ratings` | Student ratings and comments per session |
| `#/requests` | Cover requests and cancellation requests sent to admin |
| `#/profile` | Profile, stats, weekly availability, previous sessions |
| `#/workspace/:id` | Teaching workspace: students, meeting link, explanation PDF upload, PDF viewer |

## Structure

```
src/
  App.jsx                        Routes + auth gate + data provider
  api/
    axiosClient.js               Axios instance (base URL from VITE_API_URL, bearer token)
    authApi.js                   Login / logout
    sessionsApi.js               GET sessions, upload explanation PDF
    portalApi.js                 Meeting link, attendance, requests, availability, notifications, profile
  context/
    AuthContext.jsx              Token + teacher in localStorage
    TeacherDataContext.jsx       Loads sessions/requests/notifications/profile, actions, toast, modals
  lib/
    format.js                    Date / time helpers
    sessions.js                  Maps backend sessions to the UI shape, type colours, filters
  components/
    layout/AppShell.jsx          Sidebar, header, notification bell, phone bottom bar, toast
    modals/                      Meeting link, attendance, feedback, cancellation request, materials
    SessionCard.jsx, AgendaRow.jsx, DocList.jsx, PdfFrame.jsx, ReviewCard.jsx, ui.jsx
  pages/                         One file per screen
```

## Notes

- Ratings are stored 1–10 by the backend and shown as 1–5 stars (`toStars` in `lib/sessions.js`).
- Session types come from the backend (`Explanation`, `Re-Explanation`, `Mistakes`, `Exam`).
- PDFs are downloaded and shown through a `blob:` URL (`PdfFrame.jsx`) because the backend sends
  `X-Frame-Options: SAMEORIGIN`.
- Marking a student "Attended" deducts one live session from their package and unlocks the lesson
  (same logic as admin manual attendance).
