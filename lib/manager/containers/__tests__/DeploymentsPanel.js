// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {fireEvent, render, within} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'
import {createMemoryHistory, Route, Router} from 'react-router'

import DeploymentsPanel from '../DeploymentsPanel'
import mockData from '../../../../__tests__/test-utils/mock-data'

const {manager, store} = mockData

describe('lib > manager > DeploymentsPanel', () => {
  it('shows the pinned deployment first and filters deployments by name', () => {
    const mockState = store.getMockStateWithProjectWithFeedsAndDeployment()
    const activeProject = mockState.projects.active
    if (!activeProject) throw new Error('Expected an active project')
    const [pinned] = activeProject.deployments
    const other = {
      ...manager.makeMockDeployment(activeProject),
      dateCreated: pinned.dateCreated + 1000,
      name: 'Newer deployment'
    }
    const project = {
      ...activeProject,
      deployments: [other, pinned],
      pinnedDeploymentId: pinned.id
    }
    const view = render(
      <Provider store={store.makeMockStore(mockState)}>
        <Router history={createMemoryHistory('/')}>
          <Route path='/' component={() => (
            <DeploymentsPanel activeSubComponent={null} expanded project={project} />
          )} />
        </Router>
      </Provider>
    )

    const table = within(view.getByRole('table'))
    const [pinnedLink, otherLink] = table.getAllByRole('link')
    expect(pinnedLink.textContent).toBe(pinned.name)
    expect(pinnedLink.getAttribute('href')).toBe(`/project/${project.id}/deployments/${pinned.id}`)
    expect(otherLink.textContent).toBe(other.name)

    fireEvent.change(view.getByPlaceholderText('Search for deployments'), {
      target: {value: other.name}
    })
    expect(table.queryByRole('link', {name: pinned.name})).toBeNull()
    expect(table.getByRole('link', {name: other.name})).toBeTruthy()
  })
})
