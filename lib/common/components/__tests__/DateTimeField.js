import {fireEvent, render} from '@testing-library/react'
import React from 'react'
import {vi} from 'vitest'

import DateTimeField from '../DateTimeField'

describe('DateTimeField', () => {
  it('keeps dates in the local calendar and follows saved values', () => {
    const onChange = vi.fn()
    const view = render(
      <DateTimeField onChange={onChange} timestamp={+new Date(2026, 10, 28)} type='date' />
    )
    const input = view.container.querySelector('input')
    expect(input.value).toBe('2026-11-28')

    fireEvent.change(input, {target: {value: '2026-11-29'}})
    expect(onChange).toHaveBeenCalledWith(+new Date(2026, 10, 29))
    view.rerender(
      <DateTimeField onChange={onChange} timestamp={+new Date(2026, 11, 1)} type='date' />
    )
    expect(input.value).toBe('2026-12-01')
  })

  it('keeps empty input and out-of-range edits out of the saved date range', () => {
    const onChange = vi.fn()
    const view = render(
      <DateTimeField min='2026-11-29' onChange={onChange} type='date' />
    )
    const input = view.container.querySelector('input')
    expect(input.value).toBe('')
    fireEvent.change(input, {target: {value: '2026-11-28'}})
    expect(input.validity.rangeUnderflow).toBe(true)
    fireEvent.blur(input)
    expect(input.value).toBe('')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(input, {target: {value: '2026-11-29'}})
    expect(onChange).toHaveBeenCalledWith(+new Date(2026, 10, 29))
  })

  it('emits a timestamp for an alert date and time and supports disabled fields', () => {
    const onChange = vi.fn()
    const view = render(<DateTimeField onChange={onChange} />)
    const input = view.container.querySelector('input')
    fireEvent.change(input, {target: {value: '2026-11-28T09:45'}})
    const saved = +new Date(2026, 10, 28, 9, 45)
    expect(onChange).toHaveBeenCalledWith(saved)
    view.rerender(<DateTimeField disabled onChange={onChange} timestamp={saved} />)
    expect(input.disabled).toBe(true)
    expect(input.value).toBe('2026-11-28T09:45')
  })

  it('preserves the reference date for a time-only field', () => {
    const onChange = vi.fn()
    const view = render(
      <DateTimeField onChange={onChange} timestamp={+new Date(2026, 10, 28, 2)} type='time' />
    )
    const input = view.container.querySelector('input')
    expect(input.value).toBe('02:00')
    fireEvent.change(input, {target: {value: '21:30'}})
    expect(onChange).toHaveBeenCalledWith(+new Date(2026, 10, 28, 21, 30))
  })
})
