// @flow

import React, {Component, createContext} from 'react'
import {OverlayTrigger} from 'react-bootstrap'
import {createPortal} from 'react-dom'

type SectionProps = {
  children: React.Node,
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

function Header ({children, closeButton}: {children: React.Node, closeButton?: boolean}) {
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

function Title ({children}: {children: React.Node}) {
  return (
    <DialogContext.Consumer>
      {({titleId}) => <h4 className='modal-title' id={titleId}>{children}</h4>}
    </DialogContext.Consumer>
  )
}

function ModalOverlayTrigger (props: {
  children: React.Node,
  overlay: React.Node,
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
  children: React.Node,
  onHide?: () => mixed
}

type State = {
  dialog: ?HTMLDialogElement
}

let nextDialogId = 0

class OpenDialog extends Component<DialogProps, State> {
  dialogRef = React.createRef<HTMLDialogElement>()
  titleId = `datatools-dialog-title-${++nextDialogId}`
  pointerStartedOnBackdrop = false
  state = {dialog: null}

  componentDidMount () {
    const dialog = this.dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // Mount the contents after the browser has made the dialog visible so maps can measure it.
    this.setState({dialog})
  }

  componentWillUnmount () {
    const dialog = this.dialogRef.current
    if (dialog && dialog.open) dialog.close()
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
        ref={this.dialogRef}
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

export default class Modal extends Component<DialogProps & {show: boolean}> {
  static Body = Body
  static Footer = Footer
  static Header = Header
  static OverlayTrigger = ModalOverlayTrigger
  static Title = Title

  render () {
    const {show, ...props} = this.props
    return show ? createPortal(<OpenDialog {...props} />, document.body) : null
  }
}
