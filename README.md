# MathPortal — Teacher Dashboard (React)

A React + Vite + Tailwind CSS conversion of the Math House teacher dashboard prototype.

## Structure

```
src/
  App.jsx                     Top-level state: active tab + modal
  data.js                     Mock data (schedule, students, sessions, feedback)
  index.css                   Tailwind directives + global styles
  main.jsx                    React entry point
  components/
    Header.jsx                Top nav bar with tab switching
    ScheduleView.jsx          "My Schedule" tab
    ScheduleCard.jsx          Single class card on the schedule tab
    StudentsView.jsx          "My Students" tab
    StudentCard.jsx           Single student rating card
    SessionsView.jsx          "Past Sessions" tab
    SessionHistoryItem.jsx    Single past-session row
    FeedbackModal.jsx         "View Details" modal with per-student ratings
    StarRating.jsx            Shared star-rating renderer (supports half stars)
```

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Notes

- All view-switching and modal open/close logic from the original inline `<script>` was moved into React state (`useState` in `App.jsx`) — no more `document.getElementById` / `classList` manipulation.
- Card content (schedule items, students, past sessions, feedback) lives in `src/data.js` so it's easy to swap in real API data later — just replace the exported arrays/objects with fetched data.
- FontAwesome and the Inter font are loaded via CDN `<link>` tags in `index.html`, same as the original prototype. Tailwind is now installed as a proper dependency (via `tailwind.config.js` + PostCSS) instead of the CDN `<script>` build.
- Tailwind theme extensions (`math-red`, `math-blue`, `shadow-card`, etc.) were moved into `tailwind.config.js`.
