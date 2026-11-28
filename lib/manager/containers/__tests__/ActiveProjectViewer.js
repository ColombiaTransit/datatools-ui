// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {act, fireEvent, render} from '@testing-library/react'
import nock from 'nock'
import React from 'react'
import {Provider} from 'react-redux'
import {MemoryRouter, Route, Routes} from 'react-router-dom'
// $FlowFixMe legacy Flow does not resolve Vitest's entry point.
import {vi} from 'vitest'

import ActiveProjectViewer from '../ActiveProjectViewer'
import RoutedPage from '../../../common/routing/RoutedPage'
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
    vi.spyOn(reduxStore, 'dispatch').mockImplementation(action => {
      const result = dispatch(action)
      dispatched.push(result)
      return result
    })

    const view = render(
      <Provider store={reduxStore}>
        <MemoryRouter initialEntries={[projectPath]}>
          <Routes>
            <Route element={<RoutedPage component={ActiveProjectViewer} />} path='/project/:projectId' />
          </Routes>
        </MemoryRouter>
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
