import { useTeacherData } from '../../context/TeacherDataContext'
import MeetingLinkModal from './MeetingLinkModal'
import AttendanceModal from './AttendanceModal'
import FeedbackModal from './FeedbackModal'
import CancelRequestModal from './CancelRequestModal'
import MaterialsModal from './MaterialsModal'

const MODALS = {
  link: MeetingLinkModal,
  attendance: AttendanceModal,
  feedback: FeedbackModal,
  cancel: CancelRequestModal,
  materials: MaterialsModal,
}

/** Renders whichever session modal is open (opened from any screen via openModal(kind, sessionId)). */
export default function ModalHost() {
  const { modal, byId, closeModal } = useTeacherData()
  if (!modal) return null
  const session = byId(modal.sessionId)
  const Component = MODALS[modal.kind]
  if (!session || !Component) return null
  return <Component session={session} onClose={closeModal} />
}
