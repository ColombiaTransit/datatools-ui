import {browserHistory} from 'react-router'
import {push, syncHistoryWithStore} from 'react-router-redux'

import createAppStore from '../createAppStore'

describe('createAppStore', () => {
  const configuredState = process.env.STORE
  const localStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')

  afterEach(() => {
    if (configuredState === undefined) delete process.env.STORE
    else process.env.STORE = configuredState
    if (localStorage) Object.defineProperty(window, 'localStorage', localStorage)
    else delete window.localStorage
  })

  it('merges saved state over configuration and dispatches batched async actions', async () => {
    process.env.STORE = JSON.stringify({counter: {count: 1, label: 'configured'}})
    const readStorage = jest.fn(() => JSON.stringify({counter: {count: 2}}))
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {getItem: readStorage}
    })
    const counter = (state = {count: 0, label: ''}, action) =>
      action.type === 'INCREMENT' ? {...state, count: state.count + 1} : state
    const store = createAppStore({counter})

    expect(readStorage).toHaveBeenCalledWith('state')
    expect(store.getState().counter).toEqual({count: 2, label: 'configured'})
    expect(store.getState().routing).toBeDefined()
    await Promise.all(store.dispatch([
      {type: 'INCREMENT'},
      null,
      Promise.resolve(dispatch => dispatch({type: 'INCREMENT'}))
    ]))
    expect(store.getState().counter.count).toBe(4)
  })

  it('synchronizes browser navigation and router actions with the Redux store', () => {
    const nodeEnv = process.env.NODE_ENV
    const previousLocation = browserHistory.getCurrentLocation()
    process.env.NODE_ENV = 'production'
    let history
    try {
      const store = createAppStore({})
      history = syncHistoryWithStore(browserHistory, store)

      browserHistory.push('/feed/test-feed')
      expect(store.getState().routing.locationBeforeTransitions.pathname).toBe('/feed/test-feed')

      store.dispatch(push('/project/test-project'))
      expect(browserHistory.getCurrentLocation().pathname).toBe('/project/test-project')
      expect(store.getState().routing.locationBeforeTransitions.pathname).toBe('/project/test-project')
    } finally {
      if (history) history.unsubscribe()
      browserHistory.replace(previousLocation)
      process.env.NODE_ENV = nodeEnv
    }
  })
})
