import { MainLayout } from './components/Layout'
import { PDFViewer } from './components/PDFViewer'
import { ChatPanel } from './components/ChatPanel'

function App() {
  return (
    <MainLayout
      leftPanel={<PDFViewer />}
      rightPanel={<ChatPanel />}
    />
  )
}

export default App