// React CSSProperties augmentation for desktop window drag regions
import type * as CSS from 'csstype'

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag' | string
    appRegion?: 'drag' | 'no-drag' | string
  }
}
