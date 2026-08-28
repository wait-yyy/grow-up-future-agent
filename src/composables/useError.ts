import { ref } from 'vue'

export function useError(defaultDuration = 5000) {
  const errorMsg = ref('')

  function setError(message: string, duration?: number) {
    errorMsg.value = message
    setTimeout(() => { errorMsg.value = '' }, duration ?? defaultDuration)
  }

  function clearError() {
    errorMsg.value = ''
  }

  return { errorMsg, setError, clearError }
}