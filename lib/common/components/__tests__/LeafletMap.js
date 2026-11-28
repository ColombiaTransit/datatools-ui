import {act, render} from '@testing-library/react'
import React, {createRef} from 'react'
import {vi} from 'vitest'

import LeafletMap from '../LeafletMap'

describe('LeafletMap', () => {
  it('updates the viewport and container without replacing the Leaflet map', () => {
    const ref = createRef()
    const click = vi.fn()
    const updateClick = vi.fn()
    const initialBounds = [[10.4, -75.6], [10.6, -75.4]]
    const bounds = [[4.6, -74.2], [4.8, -74]]
    const view = render(
      <LeafletMap
        bounds={initialBounds}
        eventHandlers={{click}}
        ref={ref}
        style={{height: '300px'}}
      />
    )
    const map = ref.current
    expect(map.getCenter().lat).toBeCloseTo(10.5, 1)
    act(() => map.fire('click'))
    expect(click).toHaveBeenCalledTimes(1)

    view.rerender(
      <LeafletMap
        bounds={bounds}
        eventHandlers={{click: updateClick}}
        ref={ref}
        scrollWheelZoom={false}
        style={{display: 'none', height: '500px'}}
      />
    )
    expect(ref.current).toBe(map)
    expect(map.getCenter().lat).toBeCloseTo(4.7, 1)
    expect(map.scrollWheelZoom.enabled()).toBe(false)
    expect(map.getContainer().parentElement.style.display).toBe('none')
    expect(map.getContainer().parentElement.style.height).toBe('500px')
    act(() => map.fire('click'))
    expect(click).toHaveBeenCalledTimes(1)
    expect(updateClick).toHaveBeenCalledTimes(1)
  })
})
