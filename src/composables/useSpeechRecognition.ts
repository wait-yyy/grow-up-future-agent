import { ref, onUnmounted } from 'vue'

interface Options {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (text: string, isFinal: boolean) => void
  onError?: (err: string) => void
}

/**
 * 语音识别 composable
 * 参照 F:\1999\speech-input.js 的逻辑，封装为 Vue 组合式函数
 * 仅提供状态与方法，UI 由组件自行渲染
 */
export function useSpeechRecognition(options?: Options) {
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null

  const supported = !!SR
  const speaking = ref(false)
  let recognition: any = null
  let silenceTimer: any = null
  const SILENCE_MS = 2000

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function scheduleAutoStop() {
    clearSilenceTimer()
    silenceTimer = setTimeout(() => {
      stop()
    }, SILENCE_MS)
  }

  function init() {
    if (!supported) return
    recognition = new SR()
    recognition.continuous = options?.continuous ?? true
    recognition.interimResults = options?.interimResults ?? true
    recognition.lang = options?.lang ?? 'cmn-Hans-CN'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      if (final) {
        options?.onResult?.(final, true)
      } else if (interim) {
        options?.onResult?.(interim, false)
      }
      // 有语音结果时重置静音计时
      scheduleAutoStop()
    }

    recognition.onerror = (event: any) => {
      clearSilenceTimer()
      speaking.value = false
      options?.onError?.(event?.error ?? '语音识别出错')
    }
    recognition.onend = () => {
      clearSilenceTimer()
      speaking.value = false
    }
  }

  function start() {
    if (!supported || speaking.value) return
    if (!recognition) init()
    try {
      recognition.start()
    } catch {
      /* 重复 start 抛 InvalidStateError，忽略 */
    }
    speaking.value = true
    // 开始录音即启动静音计时：2 秒内若无任何语音结果，自动停止
    scheduleAutoStop()
  }

  function stop() {
    if (!supported || !speaking.value) return
    clearSilenceTimer()
    try {
      recognition.stop()
    } catch {
      /* 忽略 */
    }
    speaking.value = false
  }

  function toggle() {
    if (speaking.value) stop()
    else start()
  }

  onUnmounted(() => {
    clearSilenceTimer()
    if (recognition) {
      try { recognition.stop() } catch { /* 忽略 */ }
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
    }
  })

  return { supported, speaking, start, stop, toggle }
}
