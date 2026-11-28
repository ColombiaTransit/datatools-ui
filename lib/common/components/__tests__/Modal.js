import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import {vi} from 'vitest'

import Modal from '../Modal'

describe('Modal', () => {
  it('renders a named dialog only when shown and forwards close requests', () => {
    const onHide = vi.fn()
    const renderModal = show => (
      <Modal onHide={onHide} show={show}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm change</Modal.Title>
        </Modal.Header>
        <Modal.Body>Review the details.</Modal.Body>
      </Modal>
    )
    const view = render(renderModal(false))
    expect(view.queryByRole('dialog')).toBeNull()

    view.rerender(renderModal(true))
    const dialog = view.getByRole('dialog', {name: 'Confirm change'})
    expect(dialog.hasAttribute('open')).toBe(true)
    fireEvent.click(view.getByRole('button', {name: 'Close'}))
    fireEvent(dialog, new Event('cancel', {cancelable: true}))
    expect(onHide).toHaveBeenCalledTimes(2)

    view.rerender(renderModal(false))
    expect(view.queryByRole('dialog')).toBeNull()
  })

  it('dismisses only on a complete backdrop click and respects a static backdrop', () => {
    const onHide = vi.fn()
    const renderModal = backdrop => (
      <Modal backdrop={backdrop} onHide={onHide} show>
        <Modal.Body>Keep editing</Modal.Body>
      </Modal>
    )
    const view = render(renderModal(undefined))
    const dialog = view.getByRole('dialog')
    const pointer = (element, type) => fireEvent(element, new MouseEvent(type, {bubbles: true, button: 0}))

    pointer(view.getByText('Keep editing'), 'pointerdown')
    pointer(dialog, 'pointerup')
    expect(onHide).not.toHaveBeenCalled()

    pointer(dialog, 'pointerdown')
    pointer(dialog, 'pointerup')
    expect(onHide).toHaveBeenCalledTimes(1)

    view.rerender(renderModal('static'))
    pointer(dialog, 'pointerdown')
    pointer(dialog, 'pointerup')
    expect(onHide).toHaveBeenCalledTimes(1)
  })
})
