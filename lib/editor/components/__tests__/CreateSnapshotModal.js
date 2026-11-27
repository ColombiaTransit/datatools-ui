import {act, fireEvent, render} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import {fetchRouteEntities} from '../../actions/active'
import {createSnapshot} from '../../actions/snapshots'
import mockData from '../../../../__tests__/test-utils/mock-data'
import CreateSnapshotModal from '../CreateSnapshotModal'

jest.mock('../../actions/active', () => ({
  ...jest.requireActual('../../actions/active'),
  fetchRouteEntities: jest.fn(() => ({type: 'TEST_FETCH_ROUTES'}))
}))
jest.mock('../../actions/snapshots', () => ({
  ...jest.requireActual('../../actions/snapshots'),
  createSnapshot: jest.fn(() => ({type: 'TEST_CREATE_SNAPSHOT'}))
}))

describe('CreateSnapshotModal', () => {
  it('opens through the connected ref and submits a named snapshot', () => {
    const modal = React.createRef()
    const feedSource = mockData.manager.mockFeedWithVersion
    const view = render(
      <Provider store={mockData.store.makeMockStore()}>
        <CreateSnapshotModal feedSource={feedSource} ref={modal} />
      </Provider>
    )

    act(() => modal.current.open())

    expect(fetchRouteEntities).toHaveBeenCalledWith(feedSource)
    const name = view.getByPlaceholderText('Snapshot name (required)')
    fireEvent.change(name, {target: {value: 'Redux migration test'}})
    fireEvent.click(view.getByRole('button', {name: 'OK'}))
    expect(createSnapshot).toHaveBeenCalledWith(feedSource, 'Redux migration test', null, false, false)
  })
})
