/** List of session PDFs (official + the teacher's own), one row per document. */
export default function DocList({ docs, active, onPick }) {
  if (!docs.length) return <p className="text-sm text-gray-500">No materials yet. Admin attaches the official PDFs when scheduling.</p>
  return docs.map((doc) => {
    const on = doc.id === active
    return (
      <button
        key={doc.id}
        onClick={() => onPick(doc.id)}
        aria-current={on ? 'true' : undefined}
        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border ${on ? 'border-math-red bg-red-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-math-red'} transition-colors mb-2`}
      >
        <div className="w-10 h-10 rounded-lg bg-red-50 text-math-red flex items-center justify-center shrink-0"><i className="fa-solid fa-file-pdf"></i></div>
        <div className="min-w-0 flex-grow">
          <div className="text-sm font-bold text-gray-900 truncate" title={doc.title}>{doc.title}</div>
          <div className="text-xs text-gray-500 truncate">{doc.meta}</div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${doc.source === 'Official' ? 'bg-blue-50 text-math-blue' : 'bg-purple-50 text-purple-600'}`}>{doc.source}</span>
      </button>
    )
  })
}
