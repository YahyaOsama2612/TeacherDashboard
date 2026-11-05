function formatClockValue(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const trimmed = value.trim()

  // Match HH:mm(:ss)? with optional AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i)
  if (match) {
    const hours = Number(match[1])
    const minutes = match[2]
    const existingMeridiem = match[3]?.toUpperCase()

    if (existingMeridiem) {
      const displayHours = String(hours).padStart(2, '0')
      return `${displayHours}:${minutes} ${existingMeridiem}`
    }

    const meridiem = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 === 0 ? 12 : hours % 12
    const formattedHours = String(displayHours).padStart(2, '0')

    return `${formattedHours}:${minutes} ${meridiem}`
  }

  return trimmed
}

export function formatSessionTime(session, separator = ' - ', fallback = 'Scheduled') {
  if (!session) return fallback

  const timeFrom = session.timeFrom || session.time_from
  const timeTo = session.timeTo || session.time_to

  if (timeFrom && timeTo) {
    return `${formatClockValue(timeFrom)}${separator}${formatClockValue(timeTo)}`
  }

  if (timeFrom) {
    return formatClockValue(timeFrom)
  }

  if (typeof session.time === 'string' && session.time.trim()) {
    const parts = session.time.split(/\s*[-—–]\s*/)
    if (parts.length === 2 && /^\d{1,2}:\d{2}/.test(parts[0]) && /^\d{1,2}:\d{2}/.test(parts[1])) {
      return `${formatClockValue(parts[0])}${separator}${formatClockValue(parts[1])}`
    }
    return session.time.trim()
  }

  return fallback
}
