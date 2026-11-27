// @flow
// $FlowFixMe useEffect not recognized by flow.
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import * as statusActions from '../../manager/actions/status'
import type { AppState } from '../../types/reducers'

/**
 * Retrieves the app info and updates the redux state accordingly.
 */
const AppInfoRetriever = ({ appInfo, fetchAppInfo, renderApp }) => {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    fetchAppInfo().catch(() => setFailed(true))
  }, [fetchAppInfo])

  if (failed) {
    return (
      <div className='container' role='alert'>
        <p>Could not load Datatools configuration.</p>
        <button className='btn btn-default' onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }
  return appInfo ? renderApp(appInfo.authMode) : null
}

const mapStateToProps = (state: AppState) => ({
  appInfo: state.status.appInfo
})

const mapDispatchToProps = {
  fetchAppInfo: statusActions.fetchAppInfo
}

export default connect(mapStateToProps, mapDispatchToProps)(AppInfoRetriever)
