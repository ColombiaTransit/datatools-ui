// @flow

import merge from 'lodash/merge'
import LogRocket from 'logrocket'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import { createLogger } from 'redux-logger'

import actionMiddleware from './actionMiddleware'

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
  const middleware = [...actionMiddleware]
  if (development) middleware.push(createLogger({ collapsed: true, duration: true }))
  if (!testMode && process.env.LOGROCKET) middleware.push(LogRocket.reduxMiddleware())

  // The development enhancer is supplied by the browser extension.
  const devToolsCompose = development && (window: any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  const enhancer = applyMiddleware(...middleware)
  const initialState = merge(
    parseState(process.env.STORE),
    parseState(window.localStorage && window.localStorage.getItem('state'))
  )

  // Previously persisted state may include the legacy router reducer.
  delete initialState.routing

  return createStore(
    combineReducers(reducers),
    initialState,
    development ? (devToolsCompose || compose)(enhancer) : enhancer
  )
}
