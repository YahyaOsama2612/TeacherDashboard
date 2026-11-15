import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import sessionsApi from '../api/sessionsApi'
import { typeOf, canTakeAttendance } from '../lib/sessions'
import { fmtTime, plural, relDay } from '../lib/format'
import { Avatar, Spinner } from '../components/ui'
import { ATT, AttendancePills } from '../components/modals/AttendanceModal'
import DocList from '../components/DocList'
import PdfFrame from '../components/PdfFrame'

function SessionTab({ s }) {
  const { openModal, showToast, updateExplanationPdf } = useTeacherData()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  const current = s.raw.teacher_explanation_pdf

  const pick = (f) => {
    if (!f) return
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { setError('Please choose a PDF file.'); return }
    setError('')
    setFile(f)
  }

  const upload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await sessionsApi.uploadExplanationPdf(s.id, file, { session_link: s.meeting })
      const url = res?.data?.teacher_explanation_pdf || res?.data?.session?.teacher_explanation_pdf || null
      if (url) updateExplanationPdf(s.id, url)
      setFile(null)
      showToast('Explanation PDF published to students', 'fa-paper-plane')
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Students ({s.studentCount})</h3>
          <button onClick={() => openModal('attendance', s.id)} disabled={!canTakeAttendance(s)} className="text-xs font-bold text-math-red hover:underline disabled:text-gray-300 disabled:no-underline" title={canTakeAttendance(s) ? undefined : 'Attendance opens on the session day'}>
            <i className="fa-solid fa-clipboard-user mr-1"></i>Attendance
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3"><AttendancePills session={s} /></div>
        <div className="space-y-1.5">
          {s.students.length ? s.students.map((st) => (
            <div key={st.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100">
              <Avatar name={st.name} />
              <span className="text-sm font-semibold text-gray-900 flex-grow truncate">{st.name}</span>
              {ATT[st.attendance] && <span className={`${ATT[st.attendance].chip} text-[11px] font-bold px-2 py-0.5 rounded-md`}><i className={`fa-solid ${ATT[st.attendance].icon} mr-1`}></i>{ATT[st.attendance].label}</span>}
            </div>
          )) : <p className="text-sm text-gray-400">No students assigned yet.</p>}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Meeting link</h3>
        {s.meeting ? (
          <div className="flex items-center gap-2">
            <a href={s.meeting} target="_blank" rel="noopener noreferrer" className="flex-grow bg-blue-50 text-math-blue border border-blue-200 hover:bg-blue-100 font-semibold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"><i className="fa-solid fa-video"></i> Start Meeting</a>
            <button onClick={() => openModal('link', s.id)} className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 text-gray-500 hover:text-math-blue hover:border-math-blue" aria-label="Change meeting link"><i className="fa-solid fa-pen text-xs"></i></button>
          </div>
        ) : (
          <button onClick={() => openModal('link', s.id)} className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:text-math-blue hover:border-math-blue hover:bg-blue-50 font-medium py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 text-sm"><i className="fa-solid fa-link"></i> Add Meeting Link</button>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your explanation PDF</h3>
        {current && !file && (
          <a href={current} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-green-100 bg-green-50/60 mb-2">
            <i className="fa-solid fa-file-pdf text-math-success"></i>
            <span className="text-sm font-semibold text-gray-800 flex-grow">Published to students</span>
            <i className="fa-solid fa-up-right-from-square text-xs text-gray-400"></i>
          </a>
        )}
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
          className="w-full border-2 border-dashed border-gray-300 hover:border-math-red hover:bg-red-50/40 rounded-xl p-5 text-center transition-colors"
        >
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 mb-2"></i>
          <p className="text-sm font-semibold text-gray-700">{file ? file.name : current ? 'Replace the PDF' : 'Drop a PDF or click to choose'}</p>
          <p className="text-[11px] text-gray-400">Students see it after the session</p>
        </button>
        <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {error && <p className="text-xs font-semibold text-red-600 mt-2" role="alert">{error}</p>}
        {file && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => setFile(null)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl">Remove</button>
            <button onClick={upload} disabled={uploading} className="flex-grow px-4 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <i className={`fa-solid ${uploading ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'}`}></i> {uploading ? 'Uploading…' : 'Publish to students'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { byId, loading, openModal } = useTeacherData()
  const s = byId(id)
  const [tab, setTab] = useState('session')
  const [docId, setDocId] = useState(null)
  const [version, setVersion] = useState('blank')

  // Official materials come in blank / answers pairs; the toggle switches inside the pair.
  const pairs = useMemo(() => {
    if (!s) return []
    const list = (s.raw.materials || []).map((m) => ({ name: m.name, blank: m.session_pdf, answers: m.session_answers_pdf }))
    if (!list.length && (s.raw.session_pdf || s.raw.session_answers_pdf)) list.push({ name: s.lesson, blank: s.raw.session_pdf, answers: s.raw.session_answers_pdf })
    return list.filter((p) => p.blank || p.answers)
  }, [s])
  const pair = pairs.find((p) => p.blank === docId || p.answers === docId) || pairs[0]
  const viewing = docId && !pair?.[version] ? docId : pair?.[version] || pair?.blank || pair?.answers || s?.docs[0]?.url

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && navigate(-1)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate])

  if (loading) return <Spinner label="Opening workspace…" />
  if (!s) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-gray-900">Session not found</p>
        <button onClick={() => navigate('/sessions')} className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-math-red rounded-xl">Back to sessions</button>
      </div>
    )
  }

  const T = typeOf(s.type)
  const endSession = () => {
    navigate('/sessions')
    if (canTakeAttendance(s)) openModal('attendance', s.id)
  }
  const pickDoc = (url) => {
    setDocId(url)
    const p = pairs.find((x) => x.blank === url || x.answers === url)
    if (p) setVersion(p.answers === url ? 'answers' : 'blank')
  }

  return (
    <div className="fixed inset-0 top-16 bg-math-bg flex flex-col z-50 fade-in" role="dialog" aria-modal="true" aria-labelledby="ws-title">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex justify-between items-center gap-3 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0" aria-label="Back"><i className="fa-solid fa-arrow-left"></i></button>
          <div className="border-l border-gray-300 pl-3 sm:pl-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${T.badge} text-xs font-bold px-2 py-0.5 rounded uppercase`}>{T.label}</span>
              <h2 id="ws-title" className="font-bold text-gray-900 text-base sm:text-lg truncate">{s.lesson}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{s.program} • {relDay(s.date)}, {fmtTime(s.start)} — {fmtTime(s.end)} • {plural(s.studentCount, 'student')}</p>
          </div>
        </div>
        <button onClick={endSession} className="px-3 sm:px-5 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold rounded-lg text-xs sm:text-sm border border-red-200 shrink-0 whitespace-nowrap">End Session</button>
      </div>

      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
        <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col h-[38%] lg:h-full overflow-hidden shrink-0 border-b lg:border-b-0">
          <div className="flex border-b border-gray-200 shrink-0">
            {[['session', 'fa-users-viewfinder', 'Session & Uploads', 'Session'], ['admin', 'fa-book-bookmark', 'Admin Resources', 'Resources']].map(([key, icon, label, short]) => (
              <button key={key} onClick={() => setTab(key)} className={`flex-1 py-3.5 text-sm flex justify-center items-center gap-2 border-b-2 ${tab === key ? 'font-bold text-math-red border-math-red bg-white' : 'font-medium text-gray-500 border-transparent bg-gray-50'}`}>
                <i className={`fa-solid ${icon}`}></i> <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <div className={`flex-grow overflow-y-auto p-5 ${tab === 'admin' ? 'bg-slate-50' : 'bg-white'}`}>
            {tab === 'session' ? <SessionTab s={s} /> : <DocList docs={s.docs} active={viewing} onPick={pickDoc} />}
          </div>
        </div>

        <div className="flex-grow flex flex-col bg-gray-100 relative min-h-0">
          <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center gap-3 shrink-0">
            <span className="text-sm font-medium truncate hidden sm:inline">Official MathPortal Embedded PDF Viewer</span>
            <span className="text-sm font-medium sm:hidden">PDF Viewer</span>
            <div className="bg-gray-900 rounded-lg p-1 flex shrink-0">
              {[['blank', 'Blank', ' Version'], ['answers', 'Model', ' Answers']].map(([key, a, b]) => (
                <button key={key} onClick={() => { setVersion(key); setDocId(pair?.[key] || null) }} disabled={!pair?.[key]} className={`px-4 py-1.5 text-sm rounded-md disabled:opacity-40 ${version === key && pair?.[key] ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  {a}<span className="hidden sm:inline">{b}</span>
                </button>
              ))}
            </div>
          </div>
          {viewing
            ? <PdfFrame url={viewing} title="Session PDF" />
            : <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-gray-500"><i className="fa-regular fa-file-pdf text-4xl mb-3 text-gray-300"></i><p className="text-sm">No PDF is attached to this session yet.</p></div>}
        </div>
      </div>
    </div>
  )
}
