// @flow

import * as L from 'leaflet'
import 'leaflet-draw'
// $FlowFixMe outdated Flow doesn't know about hooks
import React, {useEffect} from 'react'
import {FeatureGroup, Polygon, Polyline, useLeaflet} from 'react-leaflet'

import * as activeActions from '../../actions/active'
import type {GtfsLocation, LocationShape} from '../../../types'
import {groupLocationShapePoints} from '../../util/location'

type Props = {
  activeEntity: GtfsLocation,
  updatingLocationShape?: typeof activeActions.updatingLocationShape
}

type EditableProps = {
  activeEntity: GtfsLocation,
  onChange: typeof activeActions.updatingLocationShape
}

function toShape (layer, geometryId: string, locationId: string): LocationShape {
  const latLngs = layer.getLatLngs()
  const points = layer instanceof L.Polygon ? latLngs[0] : latLngs
  return points.map(({lat, lng}, id) => ({
    geometry_id: geometryId,
    geometry_pt_lat: lat,
    geometry_pt_lon: lng,
    id,
    location_id: locationId
  }))
}

function EditableLocation ({activeEntity, onChange}: EditableProps) {
  const {map} = useLeaflet()
  const {geometry_type: geometryType, location_id: locationId, location_shapes: shapes} = activeEntity

  useEffect(() => {
    const group = L.featureGroup().addTo(map)
    const layers = new Map()
    const groupedPoints = groupLocationShapePoints(shapes)
    const createLayer = geometryType === 'polygon' ? L.polygon : L.polyline
    Object.keys(groupedPoints).forEach(id => {
      const layer = createLayer(groupedPoints[id]).addTo(group)
      layers.set(layer, id)
    })

    const control = new L.Control.Draw({
      position: 'topleft',
      draw: {
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: shapes.length === 0,
        polyline: false,
        rectangle: false
      },
      edit: {featureGroup: group}
    })

    const onCreated = ({layer}) => {
      // A location can have only one polygon. Ignore stale create events.
      if (shapes.length > 0) return
      onChange({
        geometryType: 'polygon',
        shapes: toShape(layer, String(L.stamp(layer)), locationId)
      })
    }

    const onEdited = ({layers: editedLayers}) => {
      const updated = new Map()
      editedLayers.eachLayer(layer => {
        const id = layers.get(layer)
        if (id != null) updated.set(id, toShape(layer, id, locationId))
      })
      if (!updated.size) return
      const unchanged = shapes.filter(point => !updated.has(String(point.geometry_id)))
      updated.forEach(points => unchanged.push(...points))
      onChange({geometryType, shapes: unchanged})
    }

    const onDeleted = ({layers: deletedLayers}) => {
      const deleted = new Set()
      deletedLayers.eachLayer(layer => deleted.add(layers.get(layer)))
      onChange({geometryType, shapes: shapes.filter(point => !deleted.has(String(point.geometry_id)))})
    }

    map.on('draw:created', onCreated)
    map.on('draw:edited', onEdited)
    map.on('draw:deleted', onDeleted)
    map.addControl(control)
    return () => {
      map.off('draw:created', onCreated)
      map.off('draw:edited', onEdited)
      map.off('draw:deleted', onDeleted)
      map.removeControl(control)
      map.removeLayer(group)
    }
  }, [geometryType, locationId, map, onChange, shapes])

  return null
}

export default function LocationsLayer ({activeEntity, updatingLocationShape}: Props) {
  if (updatingLocationShape) {
    return <EditableLocation activeEntity={activeEntity} onChange={updatingLocationShape} />
  }

  const {geometry_type: geometryType, location_shapes: shapes} = activeEntity
  const Shape = geometryType === 'polygon' ? Polygon : Polyline
  const groupedPoints = groupLocationShapePoints(shapes)

  return (
    <FeatureGroup>
      {Object.keys(groupedPoints).map(id => <Shape key={id} positions={groupedPoints[id]} />)}
    </FeatureGroup>
  )
}
