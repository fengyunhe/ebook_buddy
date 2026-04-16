import React, { useState, useEffect } from 'react'
import { Snackbar, Alert, AlertColor } from '@mui/material'

interface NotificationProps {
  message: string
  severity?: AlertColor
  open: boolean
  onClose: () => void
  autoHideDuration?: number
}

export function Notification({ message, severity = 'info', open, onClose, autoHideDuration = 3000 }: NotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

interface NotificationState {
  message: string
  severity: AlertColor
  open: boolean
}

let notificationState: NotificationState = {
  message: '',
  severity: 'info',
  open: false
}

let setNotificationFn: ((state: NotificationState) => void) | null = null

export function showNotification(message: string, severity: AlertColor = 'info') {
  notificationState = { message, severity, open: true }
  if (setNotificationFn) {
    setNotificationFn(notificationState)
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NotificationState>(notificationState)
  setNotificationFn = setState

  useEffect(() => {
    return () => {
      setNotificationFn = null
    }
  }, [])

  const handleClose = () => {
    setState((prev) => ({ ...prev, open: false }))
  }

  return (
    <>
      {children}
      <Notification
        message={state.message}
        severity={state.severity}
        open={state.open}
        onClose={handleClose}
      />
    </>
  )
}