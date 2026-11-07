import type { ComponentType } from 'react'

declare const AeroShards: ComponentType<{
  shardColor?: string
  accentColor?: string
  material?: 'glass' | 'chrome'
  markers?: 'plus' | 'dots' | 'none'
  count?: number
  dpr?: number
  vignette?: number
}>

export default AeroShards
