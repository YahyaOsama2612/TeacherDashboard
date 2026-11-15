import { useState } from 'react'
import { fmtDate, fmtTime } from '../../lib/format'
import { ProgramBadge, TypeBadge } from '../ui'
import DocList from '../DocList'
import PdfFrame from '../PdfFrame'

/** Every PDF attached to a session, with a built-in viewer. */
export default function MaterialsModal({ session: s, onClose }) {
  const [active, setActive] = useState(s.docs[0]?.id || null)
  const doc = s.docs.find((d) => d.id === active)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-4 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-7xl h-full sm:h-[92vh] overflow-hidden flex flex-col" role="dialog" aria-modal="true" aria-labelledby="mm-title">
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-2"><ProgramBadge program={s.program} /><TypeBadge type={s.type} /></div>
            <h3 id="mm-title" className="text-lg font-bold text-gray-900 truncate">{s.lesson} — Materials</h3>
            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(s.date)} • {fmtTime(s.start)} — {fmtTime(s.end)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div className="flex flex-col lg:flex-row flex-grow min-h-0">
          <div className="w-full lg:w-[340px] border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-4 max-h-48 lg:max-h-none shrink-0 bg-white">
            <DocList docs={s.docs} active={active} onPick={setActive} />
          </div>
          <div className="flex-grow min-h-0 flex flex-col bg-gray-100">
            {doc ? (
              <>
                <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center gap-3 shrink-0">
                  <span className="text-sm font-medium truncate">{doc.title}</span>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md shrink-0"><i className="fa-solid fa-up-right-from-square mr-1"></i> Open</a>
                </div>
                <PdfFrame url={doc.url} title={doc.title} />
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-sm text-gray-500 p-8 text-center">No materials are attached to this session yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
