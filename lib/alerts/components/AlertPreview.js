// @flow

import Icon from '../../common/components/Icon'
import moment from 'moment'
import React, {Component} from 'react'
import { Collapse, Row, Col, ButtonGroup, Button, Label as BsLabel } from 'react-bootstrap'

import * as alertActions from '../actions/alerts'
import { checkEntitiesForFeeds } from '../../common/util/permissions'
import type {Alert, Feed} from '../../types'

type Props = {
  alert: Alert,
  deleteAlert: typeof alertActions.deleteAlert,
  editAlert: typeof alertActions.editAlert,
  editableFeeds: Array<Feed>,
  publishableFeeds: Array<Feed>
}

type State = {
  expanded: boolean
}

export default class AlertPreview extends Component<Props, State> {
  state = { expanded: false }

  _onToggle = () => this.setState(({expanded}) => ({ expanded: !expanded }))

  _onDeleteClick = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    // Delete alert if confirmed by user.
    if (window.confirm('Are you sure you want to delete this alert?')) {
      this.props.deleteAlert(this.props.alert)
    }
  }

  _onEditClick = () => this.props.editAlert(this.props.alert)

  render () {
    const {
      alert,
      editableFeeds,
      publishableFeeds
    } = this.props
    const canPublish = checkEntitiesForFeeds(alert.affectedEntities, publishableFeeds)
    const canEdit = checkEntitiesForFeeds(alert.affectedEntities, editableFeeds)
    // Only approved publishers can edit published alerts.
    const editingIsDisabled = alert.published && !canPublish
      ? true
      : !canEdit

    // if user has edit rights and alert is unpublished, user can delete alert, else check if they have publish rights
    const deleteIsDisabled = !editingIsDisabled && !alert.published ? false : !canPublish
    const deleteButtonMessage = alert.published && deleteIsDisabled ? 'Cannot delete because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Delete alert'

    const editButtonMessage = alert.published && deleteIsDisabled ? 'Cannot edit because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Edit alert'
    const publishedLabel = alert.published
      ? <BsLabel bsStyle='success' title='Published'><Icon type='check' /></BsLabel>
      : <BsLabel bsStyle='warning' title='Draft'><Icon type='pencil' /></BsLabel>
    const entitiesLabel = alert.affectedEntities.length
      ? <BsLabel
        title={`${alert.affectedEntities.length} affected service(s)`}
        bsStyle='danger'>
        <Icon type='exclamation-triangle' />
        {alert.affectedEntities.length}
      </BsLabel>
      : <BsLabel>General alert</BsLabel>
    const { expanded } = this.state
    const header = (
      <Row>
        <Col xs={8}>
          <h3 className='card-title'>
            <button
              aria-expanded={expanded}
              className='datatools-disclosure-toggle'
              onClick={this._onToggle}
              type='button'
            >
              <strong>{alert.title}</strong><br />
              ID: #{alert.id} {publishedLabel} {entitiesLabel}
            </button>
          </h3>
        </Col>
        <Col xs={4}>
          <ButtonGroup className='pull-right'>
            <Button
              disabled={editingIsDisabled}
              onClick={this._onEditClick}
              title={editButtonMessage}>
              <Icon type='pencil' />
            </Button>
            <Button
              disabled={deleteIsDisabled}
              onClick={this._onDeleteClick}
              title={deleteButtonMessage}>
              <Icon type='remove' />
            </Button>
          </ButtonGroup>
        </Col>
      </Row>
    )
    return (
      <div className='card datatools-card'>
        <div className='card-header'>{header}</div>
        <Collapse in={expanded}>
          <div className='card-collapse'>
            <div className='card-body'>
              <p>
                <i>
                  {moment(alert.start).format('MMM Do YYYY, h:mm:ssa')}
                  {' '}
                  to
                  {' '}
                  {moment(alert.end).format('MMM Do YYYY, h:mm:ssa')}
                </i>
                {' '}
                <span className='pull-right'>
                  {publishedLabel} {alert.published ? 'Published' : 'Draft'}
                </span>
              </p>
              <p style={{whiteSpace: 'pre-wrap'}}>{alert.description}</p>
              <p>URL: <a href={alert.url} target='_blank'>{alert.url}</a></p>
              <p>
                <span className='pull-right'>{entitiesLabel} affected service(s)</span>
              </p>
            </div>
          </div>
        </Collapse>
      </div>
    )
  }
}
