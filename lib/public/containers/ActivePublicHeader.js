// @flow

import { withAppAuth } from '../../common/auth/AppAuth'
import { connect } from 'react-redux'

import PublicHeader from '../components/PublicHeader'
import * as userActions from '../../manager/actions/user'
import { getAppName } from '../../common/util/config'
import type { AppState } from '../../types/reducers'

export type Props = {}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    title: getAppName(),
    username: state.user.profile ? state.user.profile.email || state.user.profile.name : null,
    userPicture: state.user.profile ? state.user.profile.picture : null
  }
}

const mapDispatchToProps = {
  logout: userActions.logout
}

export default withAppAuth(connect(
  mapStateToProps,
  mapDispatchToProps
)(PublicHeader)
)
