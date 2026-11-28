import {render, screen} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'
import {MemoryRouter} from 'react-router-dom'
import {vi} from 'vitest'

import GtfsPlusEditor from '../GtfsPlusEditor'
import {loadGtfsEntities} from '../../actions/gtfsplus'
import mockData from '../../../../__tests__/test-utils/mock-data'

vi.mock('../../../common/components/ManagerPage', () => ({
  default: ({children}) => children
}))
vi.mock('../../../editor/containers/ActiveEditorLockManager', () => ({
  default: () => null
}))

it('renders the active table while validation is pending', () => {
  const {manager, store} = mockData
  const state = store.getMockStateWithAdminUser()
  const feed = manager.mockFeedWithVersion
  const reduxStore = store.makeMockStore(state)
  render(
    <Provider store={reduxStore}>
      <MemoryRouter>
        <GtfsPlusEditor
          activeTableId='realtime_routes'
          currentPage={1}
          feedSource={feed}
          feedSourceId={feed.id}
          feedVersionSummary={{version: 1}}
          gtfsEntityLookup={{}}
          loadGtfsEntities={(...args) => reduxStore.dispatch(loadGtfsEntities(...args))}
          lockEditorFeedSourceIfNeeded={() => undefined}
          pageCount={1}
          project={manager.mockProject}
          recordsPerPage={25}
          tableData={{realtime_routes: []}}
          user={state.user}
          validation={null}
          visibility='all'
          visibleRows={[]} />
      </MemoryRouter>
    </Provider>
  )

  expect(screen.getByRole('heading', {name: /Editing GTFS\+ for/})).toBeTruthy()
})
