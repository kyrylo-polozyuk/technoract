import { getLoginStatus, type LoginStatus } from "@audiotool/nexus"
import { useEffect, useRef, useState } from "react"

// OIDC Configuration
const CLIENT_ID = "3e9c5baa-2b66-49e7-8bab-4d977bc913eb"
const REDIRECT_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:5173/"
    : "https://kyrylo-polozyuk.github.io/technoract/"
const SCOPE = "project:write"

export type AuthStatus = "checking" | "logged-out" | "logged-in"

interface UseAuthReturn {
  loginStatus: LoginStatus | undefined
  authStatus: AuthStatus
  loading: boolean
  authError: string | undefined
}

export const useAuth = (): UseAuthReturn => {
  const [loginStatus, setLoginStatus] = useState<LoginStatus | undefined>(
    undefined,
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking")
  const [authError, setAuthError] = useState<string | undefined>(undefined)
  const hasInitialized = useRef(false) // TODO this is to avoid double execution in React StrictMode. Without this there is a 500 error, but we need to investigate it

  // Initialize login status on mount and check for OAuth callback
  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasInitialized.current) {
      return
    }
    hasInitialized.current = true
    console.debug("REDIRECT_URL", REDIRECT_URL)
    const initializeLoginStatus = async () => {
      const loginStatusResult: LoginStatus = await getLoginStatus({
        clientId: CLIENT_ID,
        redirectUrl: REDIRECT_URL,
        scope: SCOPE,
      })
      setLoginStatus(loginStatusResult)
    }

    initializeLoginStatus()
  }, [])

  // Check authentication status on mount and when returning from OAuth flow
  useEffect(() => {
    const checkAuth = async () => {
      if (loginStatus === undefined) {
        return
      }

      if (loginStatus.loggedIn === false) {
        setAuthStatus("logged-out")
        setLoading(false)
        setAuthError(undefined)
      } else {
        setAuthStatus("logged-in")
        setLoading(false)
        setAuthError(undefined)
      }
    }

    checkAuth()
  }, [loginStatus])

  return {
    loginStatus,
    authStatus,
    loading,
    authError,
  }
}
