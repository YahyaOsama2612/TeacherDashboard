import { RATING_MAX } from '../hooks/useSessionRatings'

/**
 * بيعرض تقييم من 10 على شكل 5 نجوم (كل نجمة = 2 درجة)
 * مثال: 7 من 10 = 3.5 نجمة
 *
 * @param {number} value - التقييم الفعلي (من 0 لـ max)
 * @param {number} [max=10] - أقصى درجة في المقياس
 * @param {number} [stars=5] - عدد النجوم المعروضة
 */
export default function StarRating({ value = 0, max = RATING_MAX, stars = 5, size = 'text-sm' }) {
  const safe = Math.min(Math.max(Number(value) || 0, 0), max)
  const scaled = (safe / max) * stars

  const full = Math.floor(scaled)
  const hasHalf = scaled - full >= 0.5
  const empty = stars - full - (hasHalf ? 1 : 0)

  return (
    <div className={`flex text-yellow-400 ${size} gap-0.5`} aria-label={`${safe} out of ${max}`}>
      {Array.from({ length: full }).map((_, i) => (
        <i key={`full-${i}`} className="fa-solid fa-star"></i>
      ))}
      {hasHalf && <i className="fa-solid fa-star-half-stroke"></i>}
      {Array.from({ length: empty }).map((_, i) => (
        <i key={`empty-${i}`} className="fa-regular fa-star text-gray-300"></i>
      ))}
    </div>
  )
}