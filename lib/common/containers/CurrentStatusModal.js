// @flow

import { type AppAuth, withAppAuth } from '../auth/AppAuth'
import {connect} from 'react-redux'

import StatusModal from '../components/StatusModal'
import {clearStatusModal} from '../../manager/actions/status'
import {removeEditorLock} from '../../editor/actions/editor'
import type {AppState} from '../../types/reducers'

export type Props = {
  auth0: AppAuth
}

const mapStateToProps = (state: AppState) => {
  return {
    ...state.status.modal
  }
}
const mapDispatchToProps = {
  clearStatusModal,
  removeEditorLock
}

export default withAppAuth(connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusModal))
