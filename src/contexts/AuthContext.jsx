"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { login as apiLogin, getCurrentUser, logout as apiLogout, register as apiRegister } from "../services/api"

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token")
      if (token) {
        try {
          // Fetch user profile using the API service
          const userData = await getCurrentUser()
          setUser(userData)
          console.log("User authenticated:", userData)
        } catch (error) {
          console.error("Authentication error:", error)
          // Clear invalid tokens
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    try {
      console.log(`Attempting login for user: ${username}`)

      // Use the API service login function
      const tokenData = await apiLogin({ username, password })

      // Fetch user profile after successful login
      const userData = await getCurrentUser()
      setUser(userData)

      console.log(`Login successful for: ${username}, role: ${userData.role}`)
      return userData
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message || error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      console.log("Registering with data:", { ...userData, password: "[HIDDEN]", password2: "[HIDDEN]" })

      // Use the API service register function
      const response = await apiRegister(userData)
      console.log("Registration successful:", response)

      // Don't auto-login after registration, let user login manually
      return response
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message || error)
      throw error
    }
  }

  const logout = () => {
    // Use the API service logout function
    apiLogout()
    setUser(null)
    window.location.href = "/login"
  }

  const updateUser = async (userData) => {
    try {
      // Use the API service to update profile
      const { updateProfile } = await import("../services/api")
      const updatedUser = await updateProfile(userData)
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      console.error("Update user error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
