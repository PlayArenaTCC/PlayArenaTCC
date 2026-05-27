import { useCallback, useRef, useState } from 'react'

export function useToast(timeout = 4200) {
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), timeout)
  }, [timeout])

  return {
    toast,
    setToast,
    showToast,
  }
}
