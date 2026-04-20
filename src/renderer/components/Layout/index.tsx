import React, { useState } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import { PDFViewer } from './PDFViewer'
import { ChatPanel } from './ChatPanel'
import { KnowledgePanel } from './KnowledgePanel'

interface MainLayoutProps {
  leftPanel: React.ReactNode
  middlePanel?: React.ReactNode
  rightPanel: React.ReactNode
}

export function MainLayout({ leftPanel, middlePanel, rightPanel }: MainLayoutProps) {
  const [chatPanelWidth] = useState(400)
  const [knowledgePanelWidth] = useState(350)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [knowledgeCollapsed, setKnowledgeCollapsed] = useState(false)

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f5f5f5' }}>
        {leftPanel}
      </Box>
      
      {middlePanel && (
        <>
          <Box
            sx={{
              width: 20,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.selected'
              }
            }}
            onClick={() => setKnowledgeCollapsed(!knowledgeCollapsed)}
          >
            <Tooltip title={knowledgeCollapsed ? '展开知识面板' : '收起知识面板'}>
              <IconButton size="small">
                {knowledgeCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box
            sx={{
              width: knowledgeCollapsed ? 0 : knowledgePanelWidth,
              overflow: 'hidden',
              transition: 'width 0.3s ease',
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {!knowledgeCollapsed && middlePanel}
          </Box>
        </>
      )}
      
      <Box
        sx={{
          width: 20,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.selected'
          }
        }}
        onClick={() => setChatCollapsed(!chatCollapsed)}
      >
        <Tooltip title={chatCollapsed ? '展开聊天面板' : '收起聊天面板'}>
          <IconButton size="small">
            {chatCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box
        sx={{
          width: chatCollapsed ? 0 : chatPanelWidth,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        {!chatCollapsed && rightPanel}
      </Box>
    </Box>
  )
}