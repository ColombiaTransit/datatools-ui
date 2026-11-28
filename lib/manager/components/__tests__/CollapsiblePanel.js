// @flow

// $FlowFixMe React Testing Library ships TypeScript definitions.
import {fireEvent, render} from '@testing-library/react'
import React from 'react'
// $FlowFixMe legacy Flow does not resolve Vitest's entry point.
import {vi} from 'vitest'

import CollapsiblePanel from '../CollapsiblePanel'

describe('CollapsiblePanel', () => {
  it('honors defaultExpanded and keeps the server controls available after toggling', () => {
    const onSave = vi.fn()
    const {getByRole} = render(
      <CollapsiblePanel
        data={{}}
        defaultExpanded
        fields={[]}
        index={2}
        onChange={() => {}}
        onSave={onSave}
        saveDisabled={false}
        testId='server-settings'
        title='OTP server'
      />
    )

    const toggle = getByRole('button', {name: 'OTP server'})
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(getByRole('button', {name: 'Save'}))
    expect(onSave).toHaveBeenCalledWith(2)
  })
})
