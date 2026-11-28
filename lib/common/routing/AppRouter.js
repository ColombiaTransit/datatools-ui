// @flow

// $FlowFixMe Flow 0.84 predates React 18 hooks.
import React, {useEffect, useSyncExternalStore, type Node} from 'react'
import {Router} from 'react-router-dom'

import {logPageView} from '../util/analytics'

import browserHistory from './browserHistory'

const getLocation = () => browserHistory.location

export default function AppRouter ({children}: {children: Node}) {
  const location = useSyncExternalStore(browserHistory.listen, getLocation)
  useEffect(() => {
    logPageView()
  }, [location])

  return (
    <Router location={location} navigationType={browserHistory.action} navigator={browserHistory}>
      {children}
    </Router>
  )
}
