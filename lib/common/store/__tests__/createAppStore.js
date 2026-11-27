import createAppStore from '../createAppStore'

describe('createAppStore', () => {
  const configuredState = process.env.STORE

  afterEach(() => {
    if (configuredState === undefined) delete process.env.STORE
    else process.env.STORE = configuredState
    jest.restoreAllMocks()
  })

  it('merges saved state over configuration and dispatches batched async actions', async () => {
    process.env.STORE = JSON.stringify({counter: {count: 1, label: 'configured'}})
    const readStorage = jest.spyOn(window.localStorage, 'getItem')
      .mockReturnValue(JSON.stringify({counter: {count: 2}}))
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
})
