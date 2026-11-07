import { useSyncExternalStore } from 'react'
import AeroShards from './aero-shards/AeroShards'

const artworkQuery = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

function subscribeToArtworkPreference(onChange: () => void) {
  const media = window.matchMedia(artworkQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function canShowArtwork() {
  return 'gpu' in navigator && window.matchMedia(artworkQuery).matches
}

export function LoginArtwork() {
  const showArtwork = useSyncExternalStore(subscribeToArtworkPreference, canShowArtwork, () => false)

  return (
    <div className="relative hidden overflow-hidden bg-[#120e21] lg:block">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#39215e,transparent_72%)]">
        {showArtwork && (
          <AeroShards
            shardColor="#9b7acb"
            accentColor="#c084fc"
            material="glass"
            markers="plus"
            count={900}
            dpr={1.5}
            vignette={0.38}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-[#120e21] to-transparent px-12 pt-24 pb-12 text-white">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-violet-200">PORTFOLIO WORKSPACE</p>
        <p className="max-w-sm text-3xl font-semibold tracking-tight">Your work, organized.</p>
        <p className="mt-3 max-w-sm text-sm text-violet-100">Manage projects, skills, and messages from one dashboard.</p>
      </div>
    </div>
  )
}
