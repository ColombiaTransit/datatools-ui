import React from 'react'
import Icon from '../../../common/components/Icon'

const PatternHaltIcon = ({ patternHalt }) => {
  const isLocation = patternHalt.locationId || patternHalt.locationGroupId

  if (isLocation) return <Icon type='compass' />
  return <Icon type='map-marker' />
}

export default PatternHaltIcon
