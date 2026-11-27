// @flow

import type { DatatoolsSettings } from '../../types'
import type { PermissionType } from '../user/UserPermissions'

export const OIDC_API = '/api/auth/oidc'
export const OIDC_SESSION = OIDC_API + '/session'

export type Grant = {
  feedId?: ?string,
  projectId: string,
  role: string
}

export type OidcSession = {
  authenticated: boolean,
  expiresAt?: string,
  permissions?: { applicationAdmin: boolean, grants: Grant[] },
  user?: { email: ?string, emailVerified: boolean, id: string, name: ?string, subject: string }
}

const rolePermissions: Map<string, PermissionType[]> = new Map([
  ['viewer', ['view-feed']],
  ['editor', ['view-feed', 'edit-gtfs']],
  ['feed-manager', ['view-feed', 'manage-feed']],
  ['approver', ['view-feed', 'approve-gtfs']],
  ['project-admin', ['administer-project']]
])

export function oidcPermissionSettings (applicationAdmin: boolean, grants: Grant[]): DatatoolsSettings {
  const projects: Map<string, Map<PermissionType, Set<string>>> = new Map()
  for (const {feedId, projectId, role} of grants) {
    const types = rolePermissions.get(role)
    if (!types) continue
    const permissions = projects.get(projectId) || new Map()
    projects.set(projectId, permissions)
    for (const type of types) {
      const feeds = permissions.get(type) || new Set()
      feeds.add(feedId || '*')
      permissions.set(type, feeds)
    }
  }
  return {
    client_id: 'oidc',
    organizations: [],
    permissions: applicationAdmin ? [{type: 'administer-application'}] : [],
    projects: Array.from(projects, ([projectId, permissions]) => ({
      defaultFeeds: [],
      permissions: Array.from(permissions, ([type, feeds]) => ({feeds: Array.from(feeds), type})),
      project_id: projectId
    })),
    subscriptions: []
  }
}

/** Accept a local page only. The server callback itself always returns to /. */
export function safeReturnPath (value: ?string, origin: string): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/home'
  try {
    const url = new URL(value, origin)
    if (url.origin === origin && !url.pathname.startsWith('//') && !/^\/(api|login)(\/|$)/i.test(url.pathname)) {
      return url.pathname + url.search + url.hash
    }
  } catch (error) {
    return '/home'
  }
  return '/home'
}
