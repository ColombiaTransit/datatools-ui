// @flow

import { withAppAuth } from '../auth/AppAuth'
import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import * as userActions from '../../manager/actions/user'
import * as statusActions from '../../manager/actions/status'
import type {AppState} from '../../types/reducers'

export type Props = {}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    appInfo: state.status.appInfo,
    expanded: state.ui.sidebarExpanded,
    hideTutorial: state.ui.hideTutorial,
    jobMonitor: state.status.jobMonitor,
    user: state.user
  }
}

const mapDispatchToProps = {
  logout: userActions.logout,
  removeRetiredJob: statusActions.removeRetiredJob,
  setJobMonitorVisible: statusActions.setJobMonitorVisible,
  startJobMonitor: statusActions.startJobMonitor
}

export default withAppAuth(connect(mapStateToProps, mapDispatchToProps)(Sidebar))
