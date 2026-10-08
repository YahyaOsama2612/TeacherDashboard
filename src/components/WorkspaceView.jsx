import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import sessionsApi from '../api/sessionsApi'

const STATIC_SESSION = {
  title: 'Math Session',
  type: 'SESSION',
  time: 'Scheduled',
  studentCount: 0,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkspaceHeader({ session, onBack }) {
  const { user } = useAuth()
  const displayName = user?.name || user?.first_name || user?.full_name || 'System Architect'

  return (
    <header className="bg-[#1a1a2e] text-white shadow-lg shrink-0">
      {/* Top bar */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
        {/* Logo + badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-math-red text-white rounded flex items-center justify-center font-bold text-lg select-none">
            π
          </div>
          <span className="font-bold text-lg tracking-tight">MathPortal</span>
          <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Architecture &amp; Workflow
          </span>
        </div>

        {/* Centre actions */}
      

        {/* Right: user + role */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white">{displayName}</div>
            <div className="text-[10px] text-white/50 tracking-wide">Math House Dev Team</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-math-red flex items-center justify-center font-bold text-sm text-white shadow">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Session info bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            title="Back to Schedule"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded uppercase tracking-widest">
              {session.type}
            </span>
            <h1 className="text-lg font-bold text-white leading-tight">{session.title}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <i className="fa-regular fa-clock"></i>
              {session.time}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-users"></i>
              {session.studentCount} Students
            </span>
          </div>
        </div>

        <button className="flex items-center gap-2 text-xs font-semibold bg-math-red/90 hover:bg-math-red border border-math-red/50 text-white px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm">
          <i className="fa-solid fa-circle-stop"></i>
          End Session
        </button>
      </div>
    </header>
  )
}

function UploadZone({ onFileSelect }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none ${
        dragging
          ? 'border-math-red bg-red-50 scale-[1.01]'
          : 'border-gray-200 hover:border-math-red/50 hover:bg-red-50/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f) }}
      />
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-2xl mb-1">
          <i className="fa-regular fa-file-pdf"></i>
        </div>
        <p className="text-sm font-semibold text-gray-700">Upload Teacher Explanation PDF</p>
        <p className="text-xs text-gray-400">Drag &amp; drop one PDF for this session.</p>
      </div>
    </div>
  )
}

function FileCard({ file, onRemove }) {
  return (
    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:shadow transition-shadow group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-math-red text-lg">
          <i className="fa-solid fa-file-pdf"></i>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 leading-tight">{file.name}</p>
          <span
            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-0.5 ${
              file.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {file.status}
          </span>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-math-red flex items-center justify-center text-xs transition-all cursor-pointer"
          title="Remove file"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  )
}

function SessionUploadsPanel({ session, setPublishState }) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedUrl, setUploadedUrl] = useState(session.teacher_explanation_pdf || null)
  const [isUploaded, setIsUploaded] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadedFile(null)
      setUploadError('Please select a PDF file.')
      return
    }
    setUploadedFile(file)
    setIsUploaded(false)
    setUploadError('')
    setPublishState(null)
  }

  const handleUpload = async () => {
    if (!session.id || !uploadedFile) return

    setUploading(true)
    setUploadError('')
    try {
      const response = await sessionsApi.uploadExplanationPdf(session.id, uploadedFile)
      const responseData = response?.data?.data || response?.data || response
      setUploadedUrl(responseData?.teacher_explanation_pdf || null)
      setIsUploaded(true)
      setPublishState('published')
    } catch (error) {
      setUploadError(error?.message || 'Failed to upload the explanation PDF.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Teacher Explanation PDF
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <UploadZone onFileSelect={handleFileSelect} />

        {uploadError && (
          <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {uploadError}
          </div>
        )}

        {uploadedFile && (
          <FileCard
            file={{ name: uploadedFile.name, status: isUploaded ? 'PUBLISHED' : 'DRAFT' }}
            onRemove={() => {
              setUploadedFile(null)
              setIsUploaded(false)
              setUploadError('')
              setPublishState(null)
            }}
          />
        )}

        {uploadedUrl && (
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-math-red hover:underline break-all"
          >
            View current explanation PDF
          </a>
        )}

        {isUploaded && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-lg px-4 py-2.5">
            <i className="fa-solid fa-circle-check text-green-500"></i>
            Explanation PDF uploaded successfully
          </div>
        )}
      </div>

      <div className="p-5 border-t border-gray-100">
        <button
          onClick={handleUpload}
          disabled={!uploadedFile || uploading || !session.id || isUploaded}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            uploading
              ? 'bg-math-red/70 text-white cursor-wait'
              : !uploadedFile || !session.id || isUploaded
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-math-red hover:bg-math-red-hover text-white hover:shadow-md active:scale-[0.99] cursor-pointer'
          }`}
        >
          {uploading ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin"></i>
              Uploading…
            </>
          ) : isUploaded ? (
            <>
              <i className="fa-solid fa-circle-check"></i>
              Uploaded
            </>
          ) : (
            <>
              <i className="fa-solid fa-cloud-arrow-up"></i>
              Upload Explanation PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function AdminResourcesPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Admin Resources
        </h2>
      </div>
      <div className="flex-1 p-5 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
          <i className="fa-solid fa-folder-open"></i>
        </div>
        <p className="text-sm font-semibold text-gray-700">No Admin Resources yet</p>
        <p className="text-xs text-gray-400 max-w-[200px]">
          Resources shared by the admin team will appear here.
        </p>
      </div>
    </div>
  )
}

function PdfViewer({ material, version }) {
  const pdfUrl = version === 'blank' ? material?.session_pdf : material?.session_answers_pdf
  const pdfTitle = version === 'blank' ? 'Session PDF' : 'Session Answers PDF'
  return (
    <div className="flex flex-1 min-h-0 flex-col bg-white">
      {pdfUrl ? (
        <>
          <div className="flex justify-end px-4 py-2 border-b border-gray-100">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-math-red hover:underline"
            >
              Open PDF in new tab
            </a>
          </div>
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            title={`${material?.name || 'Session material'} - ${pdfTitle}`}
            className="w-full flex-1 border-0"
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <i className="fa-regular fa-file-pdf text-4xl text-gray-300 mb-3"></i>
          <p className="font-semibold text-gray-700">{pdfTitle} unavailable</p>
          <p className="text-sm text-gray-500 mt-1">
            {material ? `No ${version === 'blank' ? 'session PDF' : 'answers PDF'} was provided for ${material.name || 'this material'}.` : 'No session materials were provided.'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main WorkspaceView export ────────────────────────────────────────────────
export default function WorkspaceView({ session, onBack }) {
  const [activeTab, setActiveTab] = useState('uploads')
  const [pdfVersion, setPdfVersion] = useState('blank')
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0)
  const [publishState, setPublishState] = useState(null)

  const lessonMaterials = (session?.lessons || []).map((lesson, index) => ({
    source: 'lesson',
    sourceId: lesson.id,
    name: lesson.name || `Lesson ${index + 1}`,
  }))
  const materials = Array.isArray(session?.materials) && session.materials.length
    ? session.materials.map((material) => ({
      ...material,
      session_pdf: material.session_pdf || (session.materials.length === 1 ? session.session_pdf : null),
      session_answers_pdf:
        material.session_answers_pdf ||
        (session.materials.length === 1 ? session.session_answers_pdf : null),
    }))
    : lessonMaterials.length
      ? lessonMaterials.map((material, index) => ({
        ...material,
        session_pdf: index === 0 ? session.session_pdf : null,
        session_answers_pdf: index === 0 ? session.session_answers_pdf : null,
      }))
      : session?.session_pdf || session?.session_answers_pdf
        ? [{
          source: session.sessionRelationalType || 'session',
          name: session.name || 'Session material',
          session_pdf: session.session_pdf,
          session_answers_pdf: session.session_answers_pdf,
        }]
        : []
  const selectedMaterial = materials[selectedMaterialIndex] || materials[0] || null

  const displaySession = {
    ...STATIC_SESSION,
    title: session?.title || session?.lessons?.[0]?.name || session?.name || STATIC_SESSION.title,
    type: (session?.type || session?.sessionRelationalType || session?.scheduleType || STATIC_SESSION.type).toUpperCase(),
    time:
      session?.time ||
      (session?.timeFrom
        ? `${session.timeFrom.slice(0, 5)} – ${session.timeTo?.slice(0, 5) || ''}`
        : STATIC_SESSION.time),
    studentCount: session?.students?.length ?? session?.attendees?.length ?? STATIC_SESSION.studentCount,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <WorkspaceHeader session={displaySession} onBack={onBack} />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'uploads'
              ? 'border-math-red text-math-red'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Session &amp; Uploads
          {publishState === 'published' && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5 shrink-0"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'admin'
              ? 'border-math-red text-math-red'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <i className="fa-solid fa-shield-halved"></i>
          Admin Resources
        </button>
      </div>

      {/* Body: left panel + PDF viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-80 min-w-[288px] bg-white border-r border-gray-100 flex flex-col overflow-hidden shadow-sm">
          {activeTab === 'uploads' ? (
            <SessionUploadsPanel session={session} setPublishState={setPublishState} />
          ) : (
            <AdminResourcesPanel />
          )}
        </aside>

        {/* Right: PDF viewer */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* PDF toolbar */}
          <div className="bg-[#1a1a2e] text-white px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <i className="fa-solid fa-file-pdf text-math-red"></i>
              {selectedMaterial?.name || 'Session Materials'}
            </div>
            <div className="flex items-center gap-2">
              {materials.length > 1 && (
                <select
                  value={selectedMaterialIndex}
                  onChange={(event) => setSelectedMaterialIndex(Number(event.target.value))}
                  aria-label="Select session material"
                  className="max-w-48 text-xs text-gray-900 bg-white rounded-md px-2 py-1.5"
                >
                  {materials.map((material, index) => (
                    <option key={`${material.source || 'material'}-${material.sourceId || index}`} value={index}>
                      {material.name || `Material ${index + 1}`}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setPdfVersion('blank')}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    pdfVersion === 'blank'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Session PDF
                </button>
                <button
                  onClick={() => setPdfVersion('answers')}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    pdfVersion === 'answers'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Answers PDF
                </button>
              </div>
            </div>
          </div>

          {/* PDF content area */}
          <PdfViewer material={selectedMaterial} version={pdfVersion} />
        </main>
      </div>
    </div>
  )
}
