import { useState } from 'react'
import { useTeacherData } from '../../context/TeacherDataContext'
import LessonVideos from '../LessonVideos'
import { fmtDate, fmtTime } from '../../lib/format'
import { ProgramBadge, TypeBadge } from '../ui'
import DocList from '../DocList'
import DocViewer, { isSlides } from '../DocViewer'

/** Every PDF attached to a session, with a built-in viewer. */
export default function MaterialsModal({ session: s, onClose }) {
  const { openModal } = useTeacherData()
  // the teacher keeps every PDF and lesson video, before and after class
  const over = s.status === 'completed'
  const docs = s.docs
  const [tab, setTab] = useState('pdfs') // pdfs | videos
  const [active, setActive] = useState(docs[0]?.id || null)
  const doc = docs.find((d) => d.id === active)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-4 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-7xl h-full sm:h-[92vh] overflow-hidden flex flex-col" role="dialog" aria-modal="true" aria-labelledby="mm-title">
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-2"><ProgramBadge program={s.program} /><TypeBadge type={s.type} /></div>
            <h3 id="mm-title" className="text-lg font-bold text-gray-900 truncate">{s.lesson} — Materials</h3>
            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(s.date)} • {fmtTime(s.start)} — {fmtTime(s.end)}</p>
            <div className="flex gap-1 mt-3 bg-white border border-gray-200 rounded-xl p-1 w-fit" role="tablist">
              {[['pdfs', 'fa-file-pdf', `Files (${docs.length})`], ['videos', 'fa-circle-play', 'Lesson videos']].map(([k, icon, label]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === k ? 'bg-math-red text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                  <i className={`fa-solid ${icon} mr-1`}></i>{label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        {over && (
          <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span><i className="fa-solid fa-flag-checkered mr-1"></i> This class is over — share your notes and the class recording with the students who attended.</span>
            <button type="button" onClick={() => openModal('afterclass', s.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-math-red text-white">Notes & recording</button>
          </div>
        )}
        {tab === 'videos' ? <LessonVideos sessionId={s.id} /> : (
        <div className="flex flex-col lg:flex-row flex-grow min-h-0">
          <div className="w-full lg:w-[340px] border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-4 max-h-48 lg:max-h-none shrink-0 bg-white">
            <DocList docs={docs} active={active} onPick={setActive} />
          </div>
          <div className="flex-grow min-h-0 flex flex-col bg-gray-100">
            {doc ? (
              <>
                <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center gap-2 shrink-0">
                  <i className={`fa-solid ${isSlides(doc.url) ? 'fa-file-powerpoint' : 'fa-file-pdf'}`}></i>
                  <span className="text-sm font-medium truncate">{doc.title}</span>
                </div>
                <DocViewer url={doc.url} title={doc.title} />
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-sm text-gray-500 p-8 text-center">No materials are attached to this session yet.</div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
