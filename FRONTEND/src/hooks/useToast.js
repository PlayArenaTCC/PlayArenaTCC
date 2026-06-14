import { useCallback, useRef, useState } from 'react'
import { getAppSettings, translateUiText } from '../utils/appSettings'

export function useToast(timeout = 4200) {
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(translateUiText(message, getAppSettings()))
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), timeout)
  }, [timeout])

  return {
    toast,
    setToast,
    showToast,
  }
}
