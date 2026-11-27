import {readFileSync} from 'fs'
import {safeLoad} from 'js-yaml'
import {defineConfig, mergeConfig} from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {jsdom: {url: 'http://localhost/'}},
    env: safeLoad(readFileSync('configurations/test/env.yml', 'utf8')),
    include: ['lib/**/__tests__/*.js'],
    setupFiles: ['./__tests__/test-utils/setup-vitest.js'],
    snapshotFormat: {escapeString: true, printBasicPrototype: true},
    coverage: {include: ['lib/**/*.js']}
  }
}))
