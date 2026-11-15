import { useState } from 'react'
import { useTeacherData } from '../../context/TeacherDataContext'
import { Modal, ModalHeader } from '../ui'

const isHttpUrl = (v) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v)

export default function MeetingLinkModal({ session, onClose }) {
  const { setMeetingLink, showToast } = useTeacherData()
  const [url, setUrl] = useState(session.meeting || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const value = url.trim()
    if (value && !isHttpUrl(value)) {
      setError('Enter a full link starting with https://')
      return
    }
    setSaving(true)
    try {
      await setMeetingLink(session.id, value)
      showToast(value ? 'Meeting link published to students' : 'Meeting link removed')
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not save the link.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="link-title">
      <ModalHeader id="link-title" title="Set Virtual Class Link" icon="fa-solid fa-video" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-4">Paste Zoom or Google Meet link below. Students will see it instantly in their dashboard.</p>
        <div className="mb-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-link text-gray-400"></i>
          </div>
          <input
            type="url"
            autoFocus
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-math-red"
            placeholder="https://zoom.us/j/123456789"
            aria-describedby="link-error"
          />
        </div>
        {error && <p id="link-error" className="text-xs font-semibold text-red-600 mb-2" role="alert">{error}</p>}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
          <div className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider flex items-center gap-1">
            <i className="fa-regular fa-eye"></i> Student Dashboard Preview
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center shadow-sm gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-math-red/10 text-math-red flex items-center justify-center shrink-0"><i className="fa-solid fa-video"></i></div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900">Live Session Starting</div>
                <div className="text-xs text-gray-500 truncate">{session.lesson}</div>
              </div>
            </div>
            <button disabled className="bg-math-red text-white text-xs font-bold px-4 py-2 rounded-lg opacity-75 shrink-0">Join Class</button>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-math-success hover:bg-green-800 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60">
          <i className={`fa-solid ${saving ? 'fa-circle-notch animate-spin' : 'fa-check'}`}></i> Save &amp; Publish
        </button>
      </div>
    </Modal>
  )
}
