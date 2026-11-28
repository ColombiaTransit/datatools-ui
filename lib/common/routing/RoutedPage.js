// @flow

import qs from 'qs'
import React, {type ComponentType} from 'react'
import {useLocation, useParams} from 'react-router-dom'

import type {RouterProps} from '../../types/reducers'

export default function RoutedPage ({component: Component}: {component: ComponentType<RouterProps>}) {
  const location = useLocation()
  const routeParams = useParams()
  return (
    <Component
      location={{...location, query: qs.parse(location.search, {ignoreQueryPrefix: true})}}
      routeParams={routeParams}
    />
  )
}
