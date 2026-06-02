declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties, MouseEventHandler } from 'react'

  interface ProjectionConfig {
    center?: [number, number]
    scale?: number
    rotate?: [number, number, number]
    parallels?: [number, number]
  }

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    className?: string
    children?: ReactNode
  }

  interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    children?: ReactNode
  }

  interface GeoFeature {
    rsmKey: string
    properties: Record<string, string>
    geometry: unknown
    type: string
  }

  interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: GeoFeature[] }) => ReactNode
  }

  interface GeographyStyleEntry {
    fill?: string
    stroke?: string
    strokeWidth?: number
    outline?: string
    opacity?: number
    cursor?: string
  }

  interface GeographyProps {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: GeographyStyleEntry
      hover?: GeographyStyleEntry
      pressed?: GeographyStyleEntry
    }
    onClick?: MouseEventHandler<SVGPathElement>
    onMouseMove?: MouseEventHandler<SVGPathElement>
    onMouseLeave?: MouseEventHandler<SVGPathElement>
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
}
