import { useEffect } from 'react'
import { MainLayout } from './components/Layout'
import { PDFViewer } from './components/PDFViewer'
import { ChatPanel } from './components/ChatPanel'
import { KnowledgePanel } from './components/KnowledgePanel'
import { VoiceRecordingIndicator } from './components/VoiceRecordingIndicator'
import { useVoiceRecorder } from './services/useVoiceRecorder'
import { useVoiceStore } from './stores/voiceStore'

function App() {
  const { checkSupport } = useVoiceStore()
  
  useVoiceRecorder({
    minimumDuration: 500
  })
  
  useEffect(() => {
    checkSupport()
  }, [checkSupport])
  
  return (
    <>
      <MainLayout
        leftPanel={<PDFViewer />}
        middlePanel={<KnowledgePanel />}
        rightPanel={<ChatPanel />}
      />
      <VoiceRecordingIndicator />
    </>
  )
}

export default App
