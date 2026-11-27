import UserPermissions from '../../user/UserPermissions'
import { oidcPermissionSettings, safeReturnPath } from '../oidcSession'

describe('OIDC session permissions', () => {
  it('keeps feed grants scoped and applies project-wide grants to every feed', () => {
    const settings = oidcPermissionSettings(false, [
      {projectId: 'project', feedId: 'one', role: 'editor'},
      {projectId: 'project', feedId: 'one', role: 'viewer'},
      {projectId: 'project', role: 'approver'},
      {projectId: 'managed', role: 'project-admin'}
    ])
    const permissions = new UserPermissions(undefined, settings)
    expect(permissions.hasFeedPermission(null, 'project', 'one', 'edit-gtfs')).toBe(true)
    expect(permissions.hasFeedPermission(null, 'project', 'two', 'edit-gtfs')).toBeFalsy()
    expect(permissions.hasFeedPermission(null, 'project', 'two', 'approve-gtfs')).toBe(true)
    expect(permissions.hasFeedPermission(null, 'project', 'one', 'manage-feed')).toBeFalsy()
    expect(permissions.isProjectAdmin('managed')).toBe(true)
    expect(permissions.isApplicationAdmin()).toBe(false)
  })

  it('does not grant permissions for an unknown role and reads bootstrap admin access', () => {
    const settings = oidcPermissionSettings(false, [{projectId: 'project', role: 'unknown'}])
    expect(settings.projects).toEqual([])
    expect(new UserPermissions(undefined, oidcPermissionSettings(true, [])).isApplicationAdmin()).toBe(true)
  })
})

describe('OIDC login return path', () => {
  const origin = 'https://datatools.example'

  it('keeps the local path, query and fragment', () => {
    expect(safeReturnPath('/project/123?tab=feeds#versions', origin)).toBe('/project/123?tab=feeds#versions')
  })

  it('falls back to the dashboard for other origins and auth or API destinations', () => {
    for (const path of ['https://other.example', '//other.example', '/\\other.example', '/.//other.example', '/api/auth/oidc/login', '/login']) {
      expect(safeReturnPath(path, origin)).toBe('/home')
    }
  })
})
