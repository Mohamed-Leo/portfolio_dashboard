import { useSyncExternalStore } from 'react'

const mobileQuery = '(max-width: 767px)'

function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  )
}
