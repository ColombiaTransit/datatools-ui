// @flow

import LogRocket from 'logrocket'
import React from 'react'
// $FlowFixMe Flow 0.84 predates the React 18 client entry point.
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { browserHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import admin from './admin/reducers'
import alerts from './alerts/reducers'
import App from './common/containers/App'
import editor from './editor/reducers'
import gtfs from './gtfs/reducers'
import gtfsPlusReducers from './gtfsplus/reducers'
import managerReducers from './manager/reducers'
import createAppStore from './common/store/createAppStore'

const container = document.getElementById('root')
if (!container) throw new Error('Datatools root element is missing.')

if (process.env.LOGROCKET) {
  LogRocket.init(process.env.LOGROCKET)
}

const store = createAppStore({
  ...managerReducers,
  admin,
  alerts,
  ...gtfsPlusReducers,
  editor,
  gtfs
})

if (process.env.NODE_ENV !== 'test') {
  // App uses browserHistory directly. This subscription also updates state.routing.
  syncHistoryWithStore(browserHistory, store)
}

createRoot(container).render(
  <Provider store={store}>
    <App />
  </Provider>
)
