// @flow

// $FlowFixMe legacy libdefs do not describe Woonerf's named create export.
import { create } from '@conveyal/woonerf/mount'
// $FlowFixMe Flow 0.84 predates the React 18 client entry point.
import { createRoot } from 'react-dom/client'

import admin from './admin/reducers'
import alerts from './alerts/reducers'
import App from './common/containers/App'
import editor from './editor/reducers'
import gtfs from './gtfs/reducers'
import gtfsPlusReducers from './gtfsplus/reducers'
import managerReducers from './manager/reducers'

const container = document.getElementById('root')
if (!container) throw new Error('Datatools root element is missing.')

createRoot(container).render(create({
  app: App,
  reducers: {
    ...managerReducers,
    admin,
    alerts,
    ...gtfsPlusReducers,
    editor,
    gtfs
  }
}))
