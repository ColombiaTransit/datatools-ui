import {act, render} from '@testing-library/react'
import * as L from 'leaflet'
import React from 'react'
import {LeafletProvider} from 'react-leaflet'
import {vi} from 'vitest'

import LocationsLayer from '../LocationsLayer'

const coordinates = [[10.4, -75.5], [10.5, -75.5], [10.5, -75.4]]
const location = {
  geometry_type: 'polygon',
  location_id: 'flex-zone',
  location_shapes: coordinates.map(([lat, lng], id) => ({
    geometry_id: 'existing',
    geometry_pt_lat: lat,
    geometry_pt_lon: lng,
    id
  }))
}

describe('editable flex-location layer', () => {
  let container
  let map
  const supportsSvg = L.Browser.svg

  beforeEach(() => {
    L.Browser.svg = true
    container = document.createElement('div')
    document.body.appendChild(container)
    map = L.map(container, {center: coordinates[0], zoom: 12})
  })

  afterEach(() => {
    map.remove()
    container.remove()
    L.Browser.svg = supportsSvg
  })

  function show (activeEntity, onChange) {
    return render(
      <LeafletProvider value={{map, layerContainer: map}}>
        <LocationsLayer activeEntity={activeEntity} updatingLocationShape={onChange} />
      </LeafletProvider>
    )
  }

  it('opens the draw toolbar and converts a new polygon to location shape points', () => {
    const onChange = vi.fn()
    const view = show({...location, location_shapes: []}, onChange)
    expect(container.querySelector('.leaflet-draw-draw-polygon')).toBeTruthy()

    const layer = L.polygon(coordinates)
    act(() => map.fire('draw:created', {layer, layerType: 'polygon'}))

    const {geometryType, shapes} = onChange.mock.calls[0][0]
    expect(geometryType).toBe('polygon')
    expect(shapes).toEqual(location.location_shapes.map(point => ({
      ...point,
      geometry_id: String(L.stamp(layer)),
      location_id: location.location_id
    })))

    view.unmount()
    expect(container.querySelector('.leaflet-draw')).toBeNull()
    act(() => map.fire('draw:created', {layer, layerType: 'polygon'}))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('preserves the geometry ID when a polygon is edited and removes its points when deleted', () => {
    const onChange = vi.fn()
    const view = show(location, onChange)
    expect(container.querySelector('.leaflet-draw-draw-polygon')).toBeNull()

    let polygon
    map.eachLayer(layer => {
      if (layer instanceof L.Polygon) polygon = layer
    })
    const updatedCoordinates = [[10.42, -75.52], ...coordinates.slice(1)]
    polygon.setLatLngs(updatedCoordinates)
    act(() => map.fire('draw:edited', {layers: L.layerGroup([polygon])}))
    expect(onChange).toHaveBeenLastCalledWith({
      geometryType: 'polygon',
      shapes: location.location_shapes.map((point, index) => ({
        ...point,
        geometry_pt_lat: updatedCoordinates[index][0],
        geometry_pt_lon: updatedCoordinates[index][1],
        location_id: location.location_id
      }))
    })

    act(() => map.fire('draw:deleted', {layers: L.layerGroup([polygon])}))
    expect(onChange).toHaveBeenLastCalledWith({geometryType: 'polygon', shapes: []})
    view.unmount()
  })
})
