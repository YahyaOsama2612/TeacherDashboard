import { Avatar, Stars } from './ui'

export default function ReviewCard({ review: r }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <Avatar name={r.student} />
        <span className="text-sm font-bold text-gray-900 flex-grow truncate">{r.student}</span>
        <Stars value={r.stars} />
      </div>
      {r.comment
        ? <p className="text-sm text-gray-600 mt-2 leading-relaxed">“{r.comment}”</p>
        : <p className="text-xs text-gray-400 italic mt-2">Rated without a comment.</p>}
    </div>
  )
}
