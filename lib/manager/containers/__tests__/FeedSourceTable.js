// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'

import FeedSourceTable from '../FeedSourceTable'
import {
  restoreDateNowBehavior,
  setDefaultTestTime
} from '../../../../__tests__/test-utils'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {store} = mockData

describe('lib > manager > FeedSourceTable', () => {
  afterEach(restoreDateNowBehavior)

  it('shows the feed and its version columns and filters feeds by name', () => {
    setDefaultTestTime()
    const mockState = store.getMockStateWithProjectWithFeedsAndDeployment()
    const project = mockState.projects.active
    if (!project) throw new Error('Expected an active project')
    const [feed] = project.feedSources
    const reduxStore = store.makeMockStore(mockState)
    const view = render(
      <Provider store={reduxStore}>
        <MemoryRouter>
          <FeedSourceTable onNewFeedSourceClick={() => undefined} project={project} />
        </MemoryRouter>
      </Provider>
    )

    const feedLink = view.getByRole('link', {name: feed.name})
    expect(feedLink.getAttribute('href')).toBe(`/feed/${feed.id}`)
    expect(view.getByRole('columnheader', {name: 'Deployed Version'})).toBeTruthy()
    expect(view.getByRole('columnheader', {name: 'Latest Version'})).toBeTruthy()

    fireEvent.change(view.getByPlaceholderText('Search by name'), {
      target: {value: 'unmatched feed name'}
    })
    expect(view.queryByRole('link', {name: feed.name})).toBeNull()
    expect(view.getByText('No feedsources match this filter')).toBeTruthy()
  })
})
