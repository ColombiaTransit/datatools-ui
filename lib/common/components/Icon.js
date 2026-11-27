// @flow

import React from 'react'

type Props = {
  className?: string,
  type: string,
  [string]: any
}

export default function Icon ({className = '', type, ...attributes}: Props) {
  return <i className={`fa fa-${type} fa-fw ${className}`} {...attributes} />
}
