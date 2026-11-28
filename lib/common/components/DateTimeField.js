// @flow

import moment from 'moment'
// $FlowFixMe Flow 0.84 predates React hooks.
import React, {useEffect, useState} from 'react'

const FORMATS = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  'datetime-local': 'YYYY-MM-DD[T]HH:mm'
}

type Props = {
  ariaLabel?: string,
  disabled?: boolean,
  id?: string,
  max?: string,
  min?: string,
  onChange: (timestamp: number) => void,
  small?: boolean,
  style?: Object,
  timestamp?: ?number,
  type?: 'date' | 'time' | 'datetime-local'
}

export default function DateTimeField ({
  ariaLabel, disabled, id, max, min, onChange, small, style,
  type = 'datetime-local', timestamp
}: Props) {
  const format = FORMATS[type]
  const selected = timestamp == null ? null : moment(timestamp).locale('en')
  const value = selected && selected.isValid() ? selected.format(format) : ''
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  const change = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    setDraft(input.value)
    if (!input.value || !input.validity.valid) return

    // Native date and datetime values represent local wall-clock time.
    const reference = selected && selected.isValid() ? selected : moment().locale('en')
    const parsed = type === 'time'
      ? moment(`${reference.format(FORMATS.date)}T${input.value}`, FORMATS['datetime-local'], 'en', true)
      : moment(input.value, format, 'en', true)
    if (!parsed.isValid() || parsed.format(format) !== input.value) return

    onChange(parsed.valueOf())
  }

  return (
    <input
      aria-label={ariaLabel}
      className={small ? 'form-control input-sm' : 'form-control'}
      disabled={disabled}
      id={id}
      max={max}
      min={min}
      onBlur={() => setDraft(value)}
      onChange={change}
      style={style}
      type={type}
      value={draft}
    />
  )
}
