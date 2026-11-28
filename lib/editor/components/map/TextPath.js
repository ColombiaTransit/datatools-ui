// @flow

// $FlowFixMe Flow 0.84 predates hooks.
import React, {useEffect, useRef} from 'react'
import {Polyline} from 'react-leaflet'
import 'leaflet-textpath'

const OPTIONS = {weight: 0}

type Props = {
  attributes: Object,
  below?: boolean,
  center: boolean,
  offset?: number,
  orientation?: number,
  positions: Array<[number, number]>,
  repeat: boolean,
  text: string
}

/** Draws repeated text, such as direction arrows, along an invisible path. */
export default function TextPath ({positions, text, repeat, center, below, offset, orientation, attributes}: Props) {
  const ref = useRef(null)
  useEffect(() => {
    const line = ref.current
    if (!line) return
    line.setText(text, {repeat, center, below, offset, orientation, attributes})
    return () => line.setText(null)
  }, [positions, text, repeat, center, below, offset, orientation, attributes])

  return <Polyline interactive={false} pathOptions={OPTIONS} positions={positions} ref={ref} />
}
