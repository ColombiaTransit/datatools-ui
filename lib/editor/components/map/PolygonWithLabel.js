// @flow

import React, {type Node} from 'react'
import {Polygon, Tooltip} from 'react-leaflet'

type Props = {
  children: Node,
  eventHandlers: Object,
  pathOptions: Object,
  positions: Array<[number, number]>,
  tooltip: string
}

export default function PolygonWithLabel ({children, eventHandlers, pathOptions, positions, tooltip}: Props) {
  return (
    <Polygon eventHandlers={eventHandlers} pathOptions={pathOptions} positions={positions}>
      <Tooltip className='stop-sequence' permanent direction='center' interactive={false}>
        {tooltip}
      </Tooltip>
      {children}
    </Polygon>
  )
}
