import {render, screen, waitFor} from '@testing-library/react'
import nock from 'nock'
import React from 'react'
import {Provider} from 'react-redux'

import mockData from '../../../../__tests__/test-utils/mock-data'
import {AppRoutes} from '../../../common/containers/App'
import browserHistory from '../../../common/routing/browserHistory'

const {manager, store} = mockData

afterEach(() => {
  nock.cleanAll()
})

it.each([false, true])('opens a feed with an OIDC session (project already loaded: %s)', async projectLoaded => {
  const feedSource = {...manager.mockFeedWithVersion, versionCount: 0}
  const project = {...manager.mockProject, feedSources: [feedSource]}
  const state = store.getMockStateWithAdminUser()
  state.user = {...state.user, oidcAuthenticated: true, token: null}
  state.status.appInfo = {authMode: 'oidc', commit: 'test', config: {}, repoUrl: '?'}
  if (projectLoaded) state.projects.all = [project]

  nock('http://localhost:4000').persist().get('/api/manager/secure/status/jobs').reply(200, [])
  const requests = nock('http://localhost:4000')
    .get(`/api/manager/secure/feedsource/${feedSource.id}`).reply(200, feedSource)
    .get(`/api/manager/secure/feedversionsummaries?feedSourceId=${feedSource.id}`).reply(200, [])
    .get(`/api/editor/secure/snapshot?feedId=${feedSource.id}`).reply(200, [])
    .get(`/api/manager/secure/deployments?feedSourceId=${feedSource.id}`).reply(200, [])
  if (!projectLoaded) requests.get(`/api/manager/secure/project/${project.id}`).reply(200, project)

  const feedPath = `/feed/${feedSource.id}`
  browserHistory.replace(feedPath)
  render(<Provider store={store.makeMockStore(state)}><AppRoutes oidc /></Provider>)

  expect(await screen.findByRole('link', {name: feedSource.name})).toBeTruthy()
  await waitFor(() => expect(requests.isDone()).toBe(true))
  expect(browserHistory.location.pathname).toBe(feedPath)
})
