// @flow

import { middleware as fetchMiddleware } from '@conveyal/woonerf/fetch'
import multi from '@conveyal/woonerf/store/multi'
import promise from '@conveyal/woonerf/store/promise'
import merge from 'lodash/merge'
import LogRocket from 'logrocket'
import { browserHistory } from 'react-router'
import { routerMiddleware, routerReducer as routing } from 'react-router-redux'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

import type { Reducer } from 'redux'

function parseState (value: ?string) {
  if (!value) return {}
  try {
    return JSON.parse(value) || {}
  } catch (error) {
    return {}
  }
}

export default function createAppStore (reducers: {[string]: Reducer<any, any>}) {
  const testMode = process.env.NODE_ENV === 'test'
  const development = !testMode && process.env.NODE_ENV !== 'production'
  const middleware = [fetchMiddleware, multi, promise, thunk]
  if (!testMode) middleware.unshift(routerMiddleware(browserHistory))
  if (development) middleware.push(createLogger({ collapsed: true, duration: true }))
  if (!testMode && process.env.LOGROCKET) middleware.push(LogRocket.reduxMiddleware())

  // The development enhancer is supplied by the browser extension.
  const devToolsCompose = development && (window: any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  const enhancer = applyMiddleware(...middleware)
  const initialState = merge(
    parseState(process.env.STORE),
    parseState(window.localStorage && window.localStorage.getItem('state'))
  )

  return createStore(
    combineReducers({routing, ...reducers}),
    initialState,
    development ? (devToolsCompose || compose)(enhancer) : enhancer
  )
}
