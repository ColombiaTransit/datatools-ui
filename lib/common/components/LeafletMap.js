// @flow

import {Icon, latLngBounds} from 'leaflet'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
// $FlowFixMe Flow 0.84 predates React hooks and forwardRef.
import React, {forwardRef, useEffect, useRef} from 'react'
import {MapContainer, useMapEvents} from 'react-leaflet'

// Use the bundled asset URLs instead of Leaflet's stylesheet-based path detection.
Icon.Default.imagePath = ''
Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl
})

const MAP_STYLE = {height: '100%', width: '100%'}
const EMPTY_HANDLERS = {}
const WORLD_BOUNDS = [[60, -120], [0, 120]]

function MapUpdates ({bounds, eventHandlers, scrollWheelZoom}) {
  const map = useMapEvents(eventHandlers)
  const previousBounds = useRef(bounds)

  useEffect(() => {
    const previous = previousBounds.current
    previousBounds.current = bounds
    if (!bounds) return
    const next = latLngBounds(bounds)
    if (next.isValid() && (!previous || !next.equals(previous)) && !map.getBounds().equals(next)) {
      map.fitBounds(next)
    }
  }, [bounds, map])

  useEffect(() => {
    if (scrollWheelZoom === true) map.scrollWheelZoom.enable()
    if (scrollWheelZoom === false) map.scrollWheelZoom.disable()
  }, [map, scrollWheelZoom])

  return null
}

// MapContainer applies its bounds only when it creates the Leaflet instance.
export default forwardRef(function LeafletMap (
  {bounds, children, eventHandlers = EMPTY_HANDLERS, initialBounds, scrollWheelZoom = true, style, ...options},
  ref
) {
  const initial = useRef(initialBounds || bounds || WORLD_BOUNDS)
  return (
    <div style={style}>
      <MapContainer
        {...options}
        bounds={initial.current}
        ref={ref}
        scrollWheelZoom={scrollWheelZoom}
        style={MAP_STYLE}>
        <MapUpdates bounds={bounds} eventHandlers={eventHandlers} scrollWheelZoom={scrollWheelZoom} />
        {children}
      </MapContainer>
    </div>
  )
})
