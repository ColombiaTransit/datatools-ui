// @flow

import React, {Component, createContext, type Node} from 'react'
import {OverlayTrigger} from 'react-bootstrap'
import {createPortal} from 'react-dom'

type SectionProps = {
  children: Node,
  style?: {[string]: number | string}
}

type DialogContextValue = {
  dialog: ?HTMLDialogElement,
  onHide?: () => mixed,
  titleId: string
}

const DialogContext = createContext<DialogContextValue>({dialog: null, titleId: ''})

function Body ({children, style}: SectionProps) {
  return <div className='modal-body' style={style}>{children}</div>
}

function Footer ({children, style}: SectionProps) {
  return <div className='modal-footer' style={style}>{children}</div>
}

function Header ({children, closeButton}: {children: Node, closeButton?: boolean}) {
  return (
    <DialogContext.Consumer>
      {({onHide}) => (
        <div className='modal-header'>
          {closeButton && onHide && (
            <button aria-label='Close' className='close' onClick={onHide} type='button'>
              <span aria-hidden='true'>&times;</span>
            </button>
          )}
          {children}
        </div>
      )}
    </DialogContext.Consumer>
  )
}

function Title ({children}: {children?: Node}) {
  return (
    <DialogContext.Consumer>
      {({titleId}) => <h4 className='modal-title' id={titleId}>{children}</h4>}
    </DialogContext.Consumer>
  )
}

function ModalOverlayTrigger (props: {
  children: Node,
  overlay: Node,
  placement?: string,
  trigger?: Array<string>
}) {
  return (
    <DialogContext.Consumer>
      {({dialog}) => <OverlayTrigger {...props} container={dialog} />}
    </DialogContext.Consumer>
  )
}

type DialogProps = {
  backdrop?: 'static',
  children: Node,
  onHide?: () => mixed
}

type State = {
  dialog: ?HTMLDialogElement
}

let nextDialogId = 0

class OpenDialog extends Component<DialogProps, State> {
  dialog: ?HTMLDialogElement = null
  titleId = `datatools-dialog-title-${++nextDialogId}`
  pointerStartedOnBackdrop = false
  state = {dialog: null}

  componentDidMount () {
    const dialog = this.dialog
    if (!dialog) return
    dialog.showModal()
    // Mount the contents after the browser has made the dialog visible so maps can measure it.
    this.setState({dialog})
  }

  componentWillUnmount () {
    const dialog = this.dialog
    if (dialog && dialog.open) dialog.close()
  }

  _setDialog = (element: ?HTMLElement) => {
    this.dialog = element instanceof HTMLDialogElement ? element : null
  }

  _onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // Let the caller update show so the browser and React stay in sync.
    event.preventDefault()
    if (this.props.onHide) this.props.onHide()
  }

  _onPointerDown = (event: SyntheticMouseEvent<HTMLDialogElement>) => {
    this.pointerStartedOnBackdrop = event.button === 0 && event.target === event.currentTarget
  }

  _onPointerUp = (event: SyntheticMouseEvent<HTMLDialogElement>) => {
    const closeFromBackdrop = this.pointerStartedOnBackdrop && event.button === 0 && event.target === event.currentTarget
    this.pointerStartedOnBackdrop = false
    if (closeFromBackdrop && this.props.backdrop !== 'static' && this.props.onHide) {
      this.props.onHide()
    }
  }

  render () {
    const {children, onHide} = this.props
    const {dialog} = this.state
    return (
      <dialog
        aria-labelledby={this.titleId}
        className='datatools-dialog'
        onCancel={this._onCancel}
        onPointerDown={this._onPointerDown}
        onPointerUp={this._onPointerUp}
        ref={this._setDialog}
      >
        {dialog && (
          <DialogContext.Provider value={{dialog, onHide, titleId: this.titleId}}>
            <div className='modal-content'>{children}</div>
          </DialogContext.Provider>
        )}
      </dialog>
    )
  }
}

export default class Modal extends Component<DialogProps & {show?: boolean}> {
  static Body = Body
  static Footer = Footer
  static Header = Header
  static OverlayTrigger = ModalOverlayTrigger
  static Title = Title

  render () {
    const {show, ...props} = this.props
    const {body} = document
    return show && body ? createPortal(<OpenDialog {...props} />, body) : null
  }
}
