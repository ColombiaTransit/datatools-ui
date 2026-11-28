// @flow

import Icon from '../../common/components/Icon'
import React, { Component, type Element } from 'react'
import { Button, ButtonToolbar, Collapse, Form } from 'react-bootstrap'

import FormInput from '../../common/components/FormInput'
import type { FormProps } from '../../types'

type Props = {
  children?: Element<*>,
  data: { [string]: any },
  defaultExpanded: boolean,
  fields: Array<FormProps>,
  index: number,
  onChange: (SyntheticInputEvent<HTMLInputElement>, number) => void,
  onEnter?: (number) => void,
  onRemove?: (number) => void,
  onSave?: (number) => any,
  saveDisabled: boolean,
  showButtonsOnBottom?: boolean,
  testId: string,
  title: Element<*> | string,
};

type State = {
  expanded: boolean
}

export default class CollapsiblePanel extends Component<Props, State> {
  static defaultProps = {
    saveDisabled: false
  };

  state = { expanded: this.props.defaultExpanded }

  _onToggle = () => this.setState(({expanded}) => ({ expanded: !expanded }))

  _onChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.onChange(evt, this.props.index);

  _onEnter = () => this.props.onEnter && this.props.onEnter(this.props.index);

  _onRemove = () =>
    this.props.onRemove && this.props.onRemove(this.props.index);

  _onSave = () => this.props.onSave && this.props.onSave(this.props.index);

  renderButtonToolbar = () => {
    const { onSave, saveDisabled } = this.props
    return (
      <ButtonToolbar className='pull-right'>
        {/* Only render save button is onSave prop is defined */}
        {typeof onSave === 'function' && (
          <Button
            bsSize='small'
            bsStyle='primary'
            data-test-id='save-item-button'
            disabled={saveDisabled}
            onClick={this._onSave}
          >
            <Icon type='floppy-o' /> Save
          </Button>
        )}
        <Button bsSize='small' bsStyle='danger' onClick={this._onRemove}>
          <Icon type='trash-o' /> Delete
        </Button>
      </ButtonToolbar>
    )
  };

  render () {
    const {
      data,
      fields,
      showButtonsOnBottom,
      testId,
      title
    } = this.props
    const { expanded } = this.state
    return (
      <div className='card datatools-card' data-test-id={testId}>
        <div className='card-header'>
          <h5 className='card-title'>
            <button
              aria-expanded={expanded}
              className='datatools-disclosure-toggle'
              onClick={this._onToggle}
              type='button'
            >
              {title}
            </button>
          </h5>
        </div>
        <Collapse in={expanded} onEnter={this._onEnter}>
          <div className='card-collapse'>
            <div className='card-body'>
              <Form>
                {this.renderButtonToolbar()}
                {fields.map((f, i) => (
                  <FormInput
                    field={f}
                    key={i}
                    onChange={this._onChange}
                    value={data[f.name.split('.').slice(-1)[0]]}
                  />
                ))}
                {/* Additional (usually more complex) fields can go here. */}
                {this.props.children}
                {showButtonsOnBottom && (
                  <div style={{ clear: 'both' }}>
                    {this.renderButtonToolbar()}
                  </div>
                )}
              </Form>
            </div>
          </div>
        </Collapse>
      </div>
    )
  }
}
