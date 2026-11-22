import { useRef, useState } from 'react'
import { useTeacherData } from '../../context/TeacherDataContext'
import sessionsApi from '../../api/sessionsApi'
import axiosClient from '../../api/axiosClient'
import { fmtDate, fmtTime } from '../../lib/format'
import { Modal, ModalHeader } from '../ui'

/**
 * After class (the prep materials are gone once a session is over):
 *  1. the teacher's handwritten / annotated PDF — POST /api/teacher/sessions/:id/explanation-pdf
 *  2. the class recording (Google Drive link)  — PUT  /api/teacher/sessions/:id/recording
 * Students who attended get both on their session page, together with the full lesson.
 */
export default function AfterClassModal({ session: s, onClose }) {
  const { showToast, updateExplanationPdf, updateRecordingLink } = useTeacherData()
  const current = s.raw.teacher_explanation_pdf
  const [file, setFile] = useState(null)
  const [link, setLink] = useState(s.raw.recordingLink || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)

  const pick = (f) => {
    if (!f) return
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { setError('Please choose a PDF file.'); return }
    setError('')
    setFile(f)
  }
  const linkChanged = link.trim() !== (s.raw.recordingLink || '')
  const linkOk = !link.trim() || /^https:\/\/\S+$/i.test(link.trim())

  const save = async () => {
    if (!file && !linkChanged) { onClose(); return }
    if (!linkOk) { setError('Paste the full recording link — it starts with https://'); return }
    setSaving(true)
    setError('')
    try {
      if (file) {
        const res = await sessionsApi.uploadExplanationPdf(s.id, file)
        const url = res?.data?.teacher_explanation_pdf || null
        if (url) updateExplanationPdf(s.id, url)
      }
      if (linkChanged) {
        const res = await axiosClient.put(`/api/teacher/sessions/${s.id}/recording`, { recordingLink: link.trim() || null })
        updateRecordingLink(s.id, res?.data?.recordingLink ?? (link.trim() || null))
      }
      showToast(file && linkChanged ? 'Notes and recording shared with your students' : file ? 'Notes shared with your students' : link.trim() ? 'Recording shared with your students' : 'Recording link removed', 'fa-paper-plane')
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="ac-title" maxWidth="max-w-xl" z="z-[110]">
      <ModalHeader id="ac-title" title="After class" icon="fa-solid fa-flag-checkered"
        meta={`${s.lesson} • ${fmtDate(s.date)}, ${fmtTime(s.start)} — ${fmtTime(s.end)}`} onClose={onClose} />
      <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
        <p className="text-sm text-gray-600">Share what you wrote in class and the recording. Students who attended see both on their session page, with the full lesson unlocked.</p>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">1 · Your handwritten PDF</h3>
          {current && !file && (
            <a href={current} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-green-100 bg-green-50/60 mb-2">
              <i className="fa-solid fa-file-pdf text-math-success"></i>
              <span className="text-sm font-semibold text-gray-800 flex-grow">Shared with students</span>
              <i className="fa-solid fa-up-right-from-square text-xs text-gray-400"></i>
            </a>
          )}
          <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
            className="w-full border-2 border-dashed border-gray-300 hover:border-math-red hover:bg-red-50/40 rounded-xl p-5 text-center transition-colors">
            <i className="fa-solid fa-cloud-arrow-up text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm font-semibold text-gray-700">{file ? file.name : current ? 'Replace the PDF' : 'Drop the PDF here or click to choose'}</p>
          </button>
          <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">2 · Class recording (Google Drive link)</h3>
          <input value={link} onChange={(e) => { setLink(e.target.value); setError('') }} placeholder="https://drive.google.com/file/d/…/view"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm ${linkOk ? 'border-gray-300' : 'border-red-400'}`} />
          <p className="text-[11px] text-gray-400 mt-1">In Drive, set sharing to “Anyone with the link can view”, then paste the link here.</p>
          {s.raw.recordingLink && (
            <a href={s.raw.recordingLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-xs font-bold text-math-blue hover:underline">
              <i className="fa-solid fa-play mr-1"></i>Open the current recording
            </a>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
      </div>
      <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-[2] sm:flex-none px-5 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
          <i className={`fa-solid ${saving ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'}`}></i> {saving ? 'Saving…' : 'Share with students'}
        </button>
      </div>
    </Modal>
  )
}
