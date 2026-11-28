// @flow
import Icon from '../../common/components/Icon'
import React, { Component } from 'react'

import FeedLabel from '../../common/components/FeedLabel'
import {getComponentMessages} from '../../common/util/config'
import type { ManagerUserState } from '../../types/reducers'

import LabelEditorModal from './LabelEditorModal'

export type Props = {
  large?: boolean,
  project?: any,
  user: ManagerUserState,
};

export default class LabelPanel extends Component<Props> {
  messages = getComponentMessages('LabelPanel')

  _onClickNewLabel = () => this.refs.newLabelModal.open();

  render () {
    const { large, project, user } = this.props

    // make sure there is a valid
    // project we can add labels tobefore continuing
    if (!project || !project.labels || !project.id) {
      return null
    }

    const { id: projectId, labels } = project

    const projectAdmin =
      user && user.permissions && user.permissions.isProjectAdmin(projectId)

    let labelBody = (
      <div className='noLabelsMessage'>
        {this.messages('noLabels')}
      </div>
    )
    if (labels.length > 0) {
      labelBody = labels.map((label) =>
        <FeedLabel editable key={label.id} label={label} />)
    }

    return (
      <div className='card datatools-card'>
        <div className='card-header'>
          <h3 className='card-title'><Icon type={'tag'} />{' '}{this.messages('labels')}</h3>
        </div>
        <div className='card-body'>
          <div className={`feedLabelContainer ${large ? 'large' : ''} grid`}>
            <LabelEditorModal projectId={projectId} ref='newLabelModal' />
            {projectAdmin && (
              <button
                className='labelActionButton'
                onClick={this._onClickNewLabel}
              >
                {this.messages('new')}
              </button>
            )}
            {labelBody}
          </div>
        </div>
      </div>
    )
  }
}
