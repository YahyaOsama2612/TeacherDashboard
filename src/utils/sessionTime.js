const CAIRO_TIME_ZONE = 'Africa/Cairo'

function parseClock(value) {
  if (typeof value !== 'string') return null

  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] || 0)
  const meridiem = match[4]?.toUpperCase()

  if (hours > 23 || minutes > 59 || seconds > 59 || (meridiem && (hours < 1 || hours > 12))) {
    return null
  }

  if (meridiem) {
    hours = (hours % 12) + (meridiem === 'PM' ? 12 : 0)
  }

  return { hours, minutes, seconds, hasMeridiem: Boolean(meridiem) }
}

function formatCairoTime(value, sessionDate) {
  if (typeof value !== 'string' || !value.trim()) return null

  const parsedClock = parseClock(value)
  let instant

  if (parsedClock?.hasMeridiem) {
    instant = new Date(Date.UTC(2000, 0, 1, parsedClock.hours, parsedClock.minutes, parsedClock.seconds))
  } else if (parsedClock) {
    const datePart =
      typeof sessionDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sessionDate)
        ? sessionDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    const timePart = `${String(parsedClock.hours).padStart(2, '0')}:${String(parsedClock.minutes).padStart(2, '0')}:${String(parsedClock.seconds).padStart(2, '0')}`
    instant = new Date(`${datePart}T${timePart}Z`)
  } else {
    instant = new Date(value)
  }

  if (Number.isNaN(instant.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    timeZone: parsedClock?.hasMeridiem ? 'UTC' : CAIRO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(instant)
}

function getTimeValues(session) {
  if (session?.timeFrom) {
    return [session.timeFrom, session.timeTo].filter(Boolean)
  }

  if (typeof session?.time !== 'string') return []

  const values = session.time.match(/\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?/gi)
  return values || []
}

export function formatSessionTime(session, separator = ' – ', fallback = 'Scheduled') {
  const values = getTimeValues(session)
  if (values.length === 0) return session?.time || fallback

  const formatted = values.map((value) => formatCairoTime(value, session?.sessionDate))
  if (formatted.some((value) => !value)) {
    return values.join(separator)
  }

  return formatted.join(separator)
}
