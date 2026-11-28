import {render, screen} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import EntityDetailsHeader from '../EntityDetailsHeader'
import mockData from '../../../../__tests__/test-utils/mock-data'

it.each([
  ['route overview', {}, true],
  ['selected trip pattern', {subEntityId: '2'}, false]
])('sets the map zoom button for the %s', (_, routeParams, disabled) => {
  const activeEntity = {id: 1, route_short_name: 'Route A', tripPatterns: [{patternStops: [{}]}]}
  const store = mockData.store.makeMockStore()
  render(
    <Provider store={store}>
      <EntityDetailsHeader
        activeComponent='route'
        activeEntity={activeEntity}
        mapState={{target: null}}
        routeParams={routeParams}
        subComponent={routeParams.subEntityId ? 'trippattern' : ''}
        subEntity={routeParams.subEntityId ? 2 : undefined}
        validationErrors={[]} />
    </Provider>
  )

  const zoom = screen.getAllByRole('button').find(button => button.querySelector('.fa-search'))
  expect(zoom?.disabled).toBe(disabled)
})
