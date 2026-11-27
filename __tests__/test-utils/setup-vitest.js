import {vi} from 'vitest'

import settings from '../../configurations/test/settings.yml'

vi.mock('../../lib/common/util/config-resources', async importOriginal => {
  const resources = await importOriginal()
  return {default: {...resources.default, extraSettings: settings}}
})
