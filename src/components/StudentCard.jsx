export default function StudentCard({ student }) {
  const name =
    student.name ||
    student.studentName ||
    student.fullName ||
    'Student'

  const phone = student.phone || student.mobile || null
  const enrollmentType = student.enrollmentType || 'direct'
  const attendance = student.attendance || null
  const attendanceStatus = attendance?.status

  const attendedAt = attendance?.attendedAt
    ? new Date(attendance.attendedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const initials =
    student.initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'ST'

  const getAttendanceBadge = () => {
    if (!attendanceStatus) {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-green-50 px-2.5 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Active
        </span>
      )
    }

    switch (attendanceStatus) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 bg-green-50 text-emerald-700 border border-green-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Present {attendedAt ? `(${attendedAt})` : ''}
          </span>
        )
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Absent
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Not Marked
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base bg-math-red/10 text-math-red border border-math-red/20 shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-snug">{name}</h3>
              <span className="text-[11px] text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded font-medium inline-block mt-0.5">
                {enrollmentType} Enrollment
              </span>
            </div>
          </div>
        </div>

        {phone && (
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <i className="fa-solid fa-phone text-gray-400 text-[11px]"></i>
            <a href={`tel:${phone}`} className="hover:text-math-red transition-colors font-mono">
              {phone}
            </a>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Attendance</span>
        {getAttendanceBadge()}
      </div>
    </div>
  )
}
