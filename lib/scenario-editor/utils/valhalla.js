// @flow

import {isEqual as coordinatesAreEqual} from '@conveyal/lonlat'
import fetch from 'isomorphic-fetch'
import L from 'leaflet'
import {decode as decodePolyline} from 'polyline'
import lineString from 'turf-linestring'
import qs from 'qs'

// This can be used for logging line strings to geojson.io URLs for easy
// debugging.
// import {logCoordsToGeojsonio} from '../../editor/util/debug'

import { coordIsOutOfBounds } from '../../editor/util/map'
import type {
  Coordinates,
  LatLng
} from '../../types'
import type {AppState} from '../../types/reducers'

export type RoutingContext = {
  routingFeedId: ?string,
  routingToken: ?string
}

export function getEditorRoutingContext (state: AppState): RoutingContext {
  return {
    routingFeedId: state.editor.data.active.feedSourceId || state.editor.data.lock.feedId,
    routingToken: state.user.token
  }
}

type Instruction = {
  distance: number,
  heading: number,
  interval: [number, number],
  sign: number,
  street_name: string,
  text: string,
  time: number
}

type Path = {
  ascend: number,
  bbox: [number, number, number, number],
  descend: number,
  details: {},
  distance: number,
  instructions: Array<Instruction>,
  legs: [],
  points: string,
  points_encoded: boolean,
  snapped_waypoints: string,
  time: number,
  transfers: number,
  weight: number
}

type GraphHopperResponse = {
  hints: {
    'visited_nodes.average': string,
    'visited_nodes.sum': string
  },
  info: {
    copyrights: Array<string>,
    took: number
  },
  paths: Array<Path>
}

type GraphHopperAlternateServer = {
  BBOX: Array<number>,
  KEY?: string,
  ROUTING_TYPE: string,
  URL?: string
}

/**
 * Convert GraphHopper routing JSON response to polyline.
 */
function handleGraphHopperRouting (path: Path, individualLegs: boolean = false): any {
  const {instructions, points} = path
  // Decode polyline and reverse coordinates.
  const decodedPolyline = decodePolyline(points).map(c => ([c[1], c[0]]))
  if (individualLegs) {
    const segments = []
    // Keep track of the segment point intervals to split the line segment at.
    // This appears to be the most reliable way to split up the geometry
    // (previously distance was used here, but that provided inconstent results).
    const segmentPointIndices = [0]
    // Iterate over the instructions, accumulating segment point indices at each
    // waypoint encountered. Indices are used to slice the line geometry when
    // individual legs are needed. NOTE: Waypoint === routing point provided in
    // the request.
    instructions.forEach((instruction, i) => {
      // GraphHopper uses instruction sign 5 for an intermediate waypoint.
      if (instruction.sign === 5 || instruction.text.match(/Waypoint (\d+)/) || i === instructions.length - 1) {
        segmentPointIndices.push(instruction.interval[0])
      }
    })
    // Once all of the indices have been found, slice the decoded polyline up
    // at the provided indices.
    if (segmentPointIndices.length > 2) {
      for (var i = 1; i < segmentPointIndices.length; i++) {
        // Get the indices of the points that the entire path should be sliced at
        // Note: 'to' index is incremented by one because it is not inclusive.
        const [from, to] = [segmentPointIndices[i - 1], segmentPointIndices[i] + 1]
        const segment = decodedPolyline.slice(from, to)
        segments.push(segment)
      }
      // console.log('individual legs', segments)
      return segments
    } else {
      // FIXME does this work for two input points?
      return [decodedPolyline]
    }
  } else {
    return decodedPolyline
  }
}

/**
 * Route between two or more points using external routing service.
 * @param  {[type]} points         array of two or more LatLng points
 * @param  {[type]} individualLegs whether to return coordinates as set of
 *                                 distinct segments for each pair of points
 * @return {[type]}                Array of coordinates or Array of arrays of coordinates.
 */
export async function polyline (
  points: Array<LatLng>,
  individualLegs?: boolean = false,
  avoidMotorways?: boolean = false,
  followRail?: boolean = false,
  routingContext?: RoutingContext
): Promise<any> {
  let json
  const geometry = []
  try {
    // Chunk points into sets no larger than the max # of points allowed by
    // GraphHopper plan.
    const pointLimit = +process.env.GRAPH_HOPPER_POINT_LIMIT
    // Default to chunks of 30 points if the point limit is less than 2. (There
    // must be at least two points passed in to routing method in order to
    // successfully route.)
    const configuredLimit = pointLimit > 2 ? Math.floor(pointLimit) : 30
    const chunk = process.env.GRAPH_HOPPER_USE_PROXY && !followRail ? Math.min(configuredLimit, 100) : configuredLimit
    if (points.length === 1) return null
    for (let beginIndex = 0; beginIndex < points.length - 1; beginIndex += chunk - 1) {
      // Start each subsequent chunk at the previous chunk's last point.
      const endIndex = beginIndex + chunk
      const chunkedPoints = points.slice(beginIndex, endIndex)
      json = await routeWithGraphHopper(chunkedPoints, avoidMotorways, followRail, routingContext)
      const path = json && json.paths && json.paths[0]
      // Route between chunked list of points
      if (path) {
        const result = handleGraphHopperRouting(path, individualLegs)
        geometry.push(...result)
      } else {
        // If any of the routed legs fails, default to straight line (return null).
        console.warn(`Error routing from point ${beginIndex} to ${endIndex}`, chunkedPoints)
        return null
      }
    }
    return geometry
  } catch (e) {
    console.log(e)
    return null
  }
}

export async function getSegment (
  points: Coordinates,
  followRoad: boolean,
  defaultToStraightLine: boolean = true,
  avoidMotorways: boolean = false,
  followRail: boolean = false,
  routingContext?: RoutingContext
): Promise<?{
  coordinates: Coordinates,
  type: 'LineString'
}> {
  // Store geometry to be returned here.
  let geometry
  if (followRoad || followRail) {
    // if snapping to streets or rail, use routing service.
    const coordinates = await polyline(
      points.map(p => ({lng: p[0], lat: p[1]})),
      false,
      avoidMotorways,
      followRail,
      routingContext
    )
    if (!coordinates) {
      // If routing was unsuccessful, default to straight line (if desired by
      // caller).
      console.warn(`Routing unsuccessful. Returning ${defaultToStraightLine ? 'straight line' : 'null'}.`)
      if (defaultToStraightLine) {
        geometry = lineString(points).geometry
      } else {
        return null
      }
    } else {
      // If routing is successful, clean up shape if necessary
      const c0 = coordinates[0]
      const epsilon = 1e-6
      if (!coordinatesAreEqual(c0, points[0], epsilon)) {
        coordinates.unshift(points[0])
      }
      geometry = {
        type: 'LineString',
        coordinates
      }
    }
  } else {
    // If not snapping to streets, simply generate a line string from input
    // coordinates.
    geometry = lineString(points).geometry
  }
  return geometry
}

/**
 * Call GraphHopper routing service with lat/lng coordinates.
 *
 * Example URL: https://graphhopper.com/api/1/route?point=49.932707,11.588051&point=50.3404,11.64705&profile=car&debug=true&&type=json
 */
export function routeWithGraphHopper (
  points: Array<LatLng>,
  avoidMotorways?: boolean,
  followRail?: boolean = false,
  routingContext?: RoutingContext
): ?Promise<GraphHopperResponse> {
  if (points.length < 2) {
    console.warn('need at least two points to route with graphhopper', points)
    return null
  }

  if (process.env.GRAPH_HOPPER_USE_PROXY && !followRail) {
    if (!routingContext || !routingContext.routingFeedId) return null
    const {routingFeedId, routingToken} = routingContext
    const query = qs.stringify({feedId: routingFeedId})
    return fetch(`/api/editor/secure/graphhopper/route?${query}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${routingToken || 'no_auth'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        points: points.map(p => [p.lng, p.lat]),
        avoidMotorways: !!avoidMotorways
      })
    }).then(res => {
      if (!res.ok) throw new Error(`Private GraphHopper routing failed (HTTP ${res.status})`)
      return res.json()
    })
  }

  // Use custom url if it exists, otherwise default to the hosted service.
  let graphHopperUrl = process.env.GRAPH_HOPPER_URL || 'https://graphhopper.com/api/1/'
  let graphHopperKey = process.env.GRAPH_HOPPER_KEY

  if (process.env.GRAPH_HOPPER_ALTERNATES) {
    // $FlowFixMe This is a bit of a hack and now how env variables are supposed to work, but the yaml loader supports it.
    const alternates: Array<GraphHopperAlternateServer> = process.env.GRAPH_HOPPER_ALTERNATES
    alternates.forEach(alternative => {
      const {BBOX, ROUTING_TYPE} = alternative
      if (BBOX.length !== 4) {
        console.warn('Invalid BBOX for GRAPH_HOPPER_ALTERNATIVE')
        return
      }
      if (!alternative.URL && !alternative.KEY) {
        console.warn('No URL or key provided for alternative graphhopper server.')
        return
      }

      const bounds = L.latLngBounds(
        [alternative.BBOX[1], alternative.BBOX[0]],
        [alternative.BBOX[3], alternative.BBOX[2]]
      )

      // Check if points are within bounds and routing type matches
      if (
        points.every(point => !coordIsOutOfBounds(point, bounds)) &&
        ((ROUTING_TYPE === 'RAIL' && followRail) || (ROUTING_TYPE === 'STREET' && !followRail))
      ) {
        if (alternative.URL) {
          graphHopperUrl = alternative.URL
        }
        if (alternative.KEY) {
          graphHopperKey = alternative.KEY
        }
      }
    })
  }

  const params = {
    key: graphHopperKey,
    profile: 'car',
    debug: true,
    type: 'json'
  }
  if (followRail) {
    params.profile = 'all_tracks' // this can be changed to return better results if needed
  }
  const locations = points.map(p => (`point=${p.lat},${p.lng}`)).join('&')
  // Avoiding motorways requires a POST request with a formatted body
  const graphHopperRequest = avoidMotorways && !followRail
    ? fetch(`${graphHopperUrl}route${graphHopperKey ? `?key=${graphHopperKey}` : ''}`,
      {
        body: JSON.stringify({
          'ch.disable': true,
          // Custom model disincentives motorways
          custom_model: {
            'priority': [{
              'if': 'road_class == MOTORWAY',
              'multiply_by': 0.1
            }]
          },
          debug: params.debug,
          points: points.map(p => [p.lng, p.lat]),
          profile: params.profile
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })
    : fetch(`${graphHopperUrl}route?${locations}&${qs.stringify(params)}`)

  return graphHopperRequest.then(res => res.json())
}
