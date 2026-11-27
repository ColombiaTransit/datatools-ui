// @flow

import React from 'react'

type Props = {
  className?: string,
  type: string | null,
  [string]: any
}

export default function Icon ({className = '', type, ...attributes}: Props) {
  const iconType = type === null ? 'null' : type
  return <i className={`fa fa-${iconType} fa-fw ${className}`} {...attributes} />
}
