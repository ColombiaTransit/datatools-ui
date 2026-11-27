// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {act, fireEvent, render} from '@testing-library/react'
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
    nock('http://localhost:4000')
      .get('/api/manager/secure/status/jobs')
      .reply(200, [])

    const reduxStore = store.makeMockStore(mockState)
    const dispatch = reduxStore.dispatch
    const dispatched = []
    jest.spyOn(reduxStore, 'dispatch').mockImplementation(action => {
      const result = dispatch(action)
      dispatched.push(result)
      return result
    })

    const view = render(
      <Provider store={reduxStore}>
        <Router history={createMemoryHistory(projectPath)}>
          <Route path='/project/:projectId' component={() => (
            <ActiveProjectViewer {...mockState.routing} />
          )} />
        </Router>
      </Provider>
    )

    // Wait for the load started on mount. Jest 24's DOM has no MutationObserver.
    await act(async () => {
      await Promise.all(dispatched)
    })
    expect(requests.isDone()).toBe(true)
    const createFeedButton = view.getByRole('button', {name: 'Create first feed source!'})
    expect(view.getByRole('link', {name: mockProject.name}).getAttribute('href')).toBe(projectPath)

    fireEvent.click(createFeedButton)
    expect(view.getByText('Feed source name')).toBeTruthy()
    fireEvent.click(view.getByRole('button', {name: 'Cancel'}))
    expect(view.getByRole('button', {name: 'Create first feed source!'})).toBeTruthy()
  })
})
