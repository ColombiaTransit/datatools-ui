// @flow

import { thunk } from 'redux-thunk'

import type { Middleware } from 'redux'

// Re-dispatch through the whole chain so batches and promises can contain thunks.
const dispatchBatch: Middleware<any, any, any> = ({dispatch}) => next => action => {
  if (Array.isArray(action)) return action.filter(Boolean).map(dispatch)
  return next(action)
}

const dispatchPromise: Middleware<any, any, any> = ({dispatch}) => next => action => {
  if (action && typeof action.then === 'function') {
    return action.then(result => result && dispatch(result))
  }
  return next(action)
}

export default [dispatchBatch, dispatchPromise, thunk]
