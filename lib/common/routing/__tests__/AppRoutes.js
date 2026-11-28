import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import React from 'react'
import {ListGroupItem} from 'react-bootstrap'
import {Provider} from 'react-redux'
import {LinkContainer} from 'react-router-bootstrap'
import {Link} from 'react-router-dom'
import {createStore} from 'redux'
import {vi} from 'vitest'

import {AppRoutes} from '../../containers/App'
import {logPageView} from '../../util/analytics'
import browserHistory from '../browserHistory'

vi.mock('../../util/analytics', () => ({logPageView: vi.fn()}))

vi.mock('../../auth/AppAuth', () => ({
  default: ({children}) => children,
  useAppAuth: () => ({isAuthenticated: true, isLoading: false}),
  withAppAuth: Component => Component,
  beginOidcLogin: vi.fn()
}))

vi.mock('../../../public/containers/ActivePublicLandingPage', () => ({
  default: () => <Link to='/project/new'>New project</Link>
}))

vi.mock('../../../manager/containers/CreateProject', () => ({
  default: () => (
    <LinkContainer to='/feed/feed-1/version/3/issues'>
      <ListGroupItem>Version issues</ListGroupItem>
    </LinkContainer>
  )
}))

vi.mock('../../../manager/containers/ActiveProjectViewer', () => ({
  default: ({routeParams}) => (
    <output>{[routeParams.projectId, routeParams.subpage, routeParams.subsubpage].join(':')}</output>
  )
}))

vi.mock('../../../manager/containers/ActiveFeedSourceViewer', () => ({
  default: ({routeParams}) => (
    <output>{[routeParams.feedSourceId, routeParams.feedVersionIndex, routeParams.subpage, routeParams.subsubpage].join(':')}</output>
  )
}))

vi.mock('../../../editor/containers/ActiveGtfsEditor', () => ({
  default: ({location, routeParams}) => (
    <output>{JSON.stringify({routeParams, table: location.query.table, hash: location.hash})}</output>
  )
}))

vi.mock('../../../admin/components/AdminPage', () => ({
  default: ({routeParams}) => <output>Admin {routeParams.subpage}</output>
}))

vi.mock('../../../public/containers/ActiveUserAccount', () => ({
  default: ({routeParams}) => <output>Settings {routeParams.subpage}</output>
}))

vi.mock('../../../manager/containers/ActiveUserHomePage', () => ({
  default: () => <output>User home</output>
}))

vi.mock('../../components/PageNotFound', () => ({
  default: () => <output>Page not found</output>
}))

const admin = {
  isCheckingLogin: false,
  oidcAuthenticated: true,
  permissions: {
    isApplicationAdmin: () => true,
    canAdministerAnOrganization: () => false
  }
}

function renderPath (path, user = admin) {
  browserHistory.replace(path)
  const store = createStore((state = {user}) => state)
  return render(<Provider store={store}><AppRoutes oidc /></Provider>)
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('application routes', () => {
  it.each([
    ['/project/p1/deployments/d1', 'p1:deployments:d1'],
    ['/feed/feed-1/settings/transforms/', 'feed-1::settings:transforms'],
    ['/feed/feed-1/version/3/issues', 'feed-1:3:issues:'],
    ['/unexpected/path', 'Page not found'],
    ['/license', 'Page not found']
  ])('opens %s directly', (path, content) => {
    renderPath(path)
    expect(screen.getByText(content)).toBeTruthy()
  })

  it('decodes all editor parameters and passes the query and fragment to the page', () => {
    renderPath('/feed/feed-1/edit/route/route%20A/pattern/p1/timetable/t1/?table=true#stop-times')
    expect(JSON.parse(screen.getByRole('status').textContent)).toEqual({
      routeParams: {
        feedSourceId: 'feed-1',
        activeComponent: 'route',
        activeEntityId: 'route A',
        subComponent: 'pattern',
        subEntityId: 'p1',
        subSubComponent: 'timetable',
        activeSubSubEntity: 't1'
      },
      table: 'true',
      hash: '#stop-times'
    })
  })

  it('updates the URL through both link types and restores the previous route on Back', async () => {
    renderPath('/')
    fireEvent.click(screen.getByRole('link', {name: 'New project'}))
    expect(browserHistory.location.pathname).toBe('/project/new')
    fireEvent.click(screen.getByRole('link', {name: 'Version issues'}))
    expect(screen.getByText('feed-1:3:issues:')).toBeTruthy()

    act(() => browserHistory.back())
    expect(await screen.findByRole('link', {name: 'Version issues'})).toBeTruthy()
    expect(browserHistory.location.pathname).toBe('/project/new')
    expect(logPageView).toHaveBeenCalledTimes(4)
  })

  it.each([
    ['/settings', '/settings/profile', 'Settings profile'],
    ['/admin', '/admin/users', 'Admin users']
  ])('replaces %s with its default view', (source, destination, content) => {
    renderPath(source)
    expect(screen.getByText(content)).toBeTruthy()
    expect(browserHistory.location.pathname).toBe(destination)
    expect(browserHistory.action).toBe('REPLACE')
  })

  it('keeps the current URL when a signed-out user opens a protected editor link', () => {
    const path = '/feed/feed-1/edit?table=true'
    renderPath(path, {isCheckingLogin: false, oidcAuthenticated: false})
    expect(screen.getByRole('button', {name: 'Log in'})).toBeTruthy()
    expect(browserHistory.location.pathname + browserHistory.location.search).toBe(path)
  })

  it('redirects a signed-in user without admin privileges away from the admin route', async () => {
    renderPath('/admin', {...admin, permissions: null})
    await waitFor(() => expect(browserHistory.location.pathname).toBe('/'))
    expect(screen.getByRole('link', {name: 'New project'})).toBeTruthy()
  })

  it('redirects a signed-in user from login to home', () => {
    renderPath('/login')
    expect(screen.getByText('User home')).toBeTruthy()
    expect(browserHistory.location.pathname).toBe('/home')
  })
})
