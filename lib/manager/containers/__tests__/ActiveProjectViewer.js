// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {fireEvent, render, waitFor} from '@testing-library/react'
import nock from 'nock'
import React from 'react'
import {Provider} from 'react-redux'
import {createMemoryHistory, Route, Router} from 'react-router'

import ActiveProjectViewer from '../ActiveProjectViewer'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {manager, store} = mockData

describe('lib > manager > ActiveProjectViewer', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('loads a new project and lets an admin open and cancel the first feed form', async () => {
    const mockState = store.getMockStateWithProject()
    const {mockProject} = manager
    const projectPath = `/project/${mockProject.id}`
    const requests = nock('http://localhost:4000')
      .get(`/api/manager/secure${projectPath}`)
      .reply(200, mockProject)
      .get(`/api/manager/secure/feedsourceSummaries?projectId=${mockProject.id}`)
      .reply(200, [])

    const view = render(
      <Provider store={store.makeMockStore(mockState)}>
        <Router history={createMemoryHistory(projectPath)}>
          <Route path='/project/:projectId' component={() => (
            <ActiveProjectViewer {...mockState.routing} />
          )} />
        </Router>
      </Provider>
    )

    await waitFor(() => expect(requests.isDone()).toBe(true))
    const createFeedButton = await view.findByRole('button', {name: 'Create first feed source!'})
    expect(view.getByRole('link', {name: mockProject.name}).getAttribute('href')).toBe(projectPath)

    fireEvent.click(createFeedButton)
    expect(view.getByText('Feed source name')).toBeTruthy()
    fireEvent.click(view.getByRole('button', {name: 'Cancel'}))
    expect(view.getByRole('button', {name: 'Create first feed source!'})).toBeTruthy()
  })
})
