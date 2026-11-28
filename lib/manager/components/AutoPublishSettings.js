// @flow

import React, { Component } from 'react'
import {
  Checkbox,
  Col,
  FormGroup,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap'

import * as feedsActions from '../actions/feeds'
import type { Feed } from '../../types'

type Props = {
  disabled: ?boolean,
  feedSource: Feed,
  updateFeedSource: typeof feedsActions.updateFeedSource
}

/**
 * This component displays auto-publish settings for a feed.
 * Auto-publish settings are kept in a separate section per MTC request.
 */
export default class AutoPublishSettings extends Component<Props> {
  _onToggleAutoPublish = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {autoPublish: !feedSource.autoPublish})
  }

  render () {
    const {
      disabled,
      feedSource
    } = this.props
    // Do not allow users without manage-feed permission to modify auto-publish settings.
    if (disabled) {
      return (
        <p className='lead'>
          User is not authorized to modify auto-publish settings.
        </p>
      )
    }
    return (
      <Col xs={7}>
        {/* Settings */}
        <div className='card datatools-card'>
          <div className='card-header'>
            <h3 className='card-title'>Auto-publish Settings</h3>
          </div>
          <ListGroup className='list-group-flush'>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={feedSource.autoPublish}
                  disabled={disabled}
                  onChange={this._onToggleAutoPublish}
                >
                  <strong>Auto-publish this feed after auto-fetch</strong>
                </Checkbox>
                <small>
                  Set this feed source to be automatically published
                  when a new version is fetched automatically.
                </small>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </div>
      </Col>
    )
  }
}
