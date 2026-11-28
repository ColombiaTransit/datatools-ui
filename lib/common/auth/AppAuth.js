// @flow

import { useAuth0 } from '@auth0/auth0-react'
// $FlowFixMe React context hooks are missing from this version of Flow.
import React, { createContext, useContext, useEffect } from 'react'
import { connect } from 'react-redux'
import useSWR from 'swr'

import browserHistory from '../routing/browserHistory'
import { receiveOidcSession } from '../../manager/actions/user'
import type { AppState } from '../../types/reducers'

import { OIDC_API, OIDC_SESSION, safeReturnPath, type OidcSession } from './oidcSession'

const returnKey = 'datatools.oidc.returnTo'

export type AppAuth = {
  isAuthenticated: boolean,
  isLoading: boolean,
  loginWithRedirect: (options?: {appState?: {returnTo?: ?string}}) => any,
  logout: (options?: {returnTo?: string}) => any,
  mode?: 'oidc'
}

const OidcAuthContext = createContext(null)

export function useAppAuth (): AppAuth {
  const oidc = useContext(OidcAuthContext)
  const legacy = useAuth0()
  return oidc || legacy
}

export function withAppAuth (Component: any): any {
  return function WithAuth (props) {
    const auth = useAppAuth()
    return <Component {...props} auth0={auth} />
  }
}

async function loadSession (url: string): Promise<OidcSession> {
  const response = await fetch(url, {cache: 'no-store', credentials: 'same-origin'})
  if (!response.ok) throw new Error('Could not load the Datatools session.')
  return response.json()
}

export function beginOidcLogin (options?: {appState?: {returnTo?: ?string}}) {
  const {appState} = options || {}
  const {hash, origin, pathname, search} = window.location
  const returnTo = (appState && appState.returnTo) || pathname + search + hash
  try {
    window.sessionStorage.setItem(returnKey, safeReturnPath(returnTo, origin))
  } catch (error) {
    // The app can still sign in when storage is unavailable.
  }
  window.location.assign(OIDC_API + '/login')
}

async function endOidcSession () {
  const response = await fetch(OIDC_API + '/logout', {credentials: 'same-origin', method: 'POST'})
  if (!response.ok) throw new Error('Could not sign out of Datatools.')
  try {
    window.sessionStorage.removeItem(returnKey)
  } catch (error) {
    // Continue signing out when storage is unavailable.
  }
  window.location.assign('/')
}

function restoreReturnPath () {
  let path
  try {
    path = window.sessionStorage.getItem(returnKey)
    window.sessionStorage.removeItem(returnKey)
  } catch (error) {
    return
  }
  if (path && window.location.pathname === '/') {
    browserHistory.replace(safeReturnPath(path, window.location.origin))
  }
}

function OidcAuthProvider ({children, isCheckingLogin, receiveOidcSession}) {
  const {data: session, error, mutate} = useSWR(OIDC_SESSION, loadSession, {refreshInterval: 60000})

  useEffect(() => {
    if (!session) return
    receiveOidcSession(session)
    if (session.authenticated) restoreReturnPath()
  }, [receiveOidcSession, session])

  if (error && !session) {
    return (
      <div className='container' role='alert'>
        <p>Could not check your sign-in status.</p>
        <button className='btn btn-default' onClick={() => mutate()}>Retry</button>
      </div>
    )
  }

  const auth = {
    isAuthenticated: !!(session && session.authenticated),
    isLoading: !session || isCheckingLogin,
    loginWithRedirect: beginOidcLogin,
    logout: endOidcSession,
    mode: 'oidc'
  }
  return <OidcAuthContext.Provider value={auth}>{children}</OidcAuthContext.Provider>
}

export default connect(
  (state: AppState) => ({isCheckingLogin: state.user.isCheckingLogin}),
  {receiveOidcSession}
)(OidcAuthProvider)
