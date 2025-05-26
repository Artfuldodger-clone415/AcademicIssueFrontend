"use client"

import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import { useAuth } from "../../contexts/AuthContext"
import { AlertCircle } from "lucide-react"

const Layout = () => {
  const { user, loading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Authentication Required</h1>
            <p>Please log in to continue</p>
          </div>
          <div className="auth-body">
            <div className="flex-center">
              <AlertCircle size={48} className="text-secondary mb-2" />
              <p>Please log in to access the Academic Issue Tracking System.</p>
            </div>
          </div>
          <div className="auth-footer">
            <a href="/login" className="btn btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
        <footer className="text-center mb-4 text-muted-foreground">
          © {new Date().getFullYear()} Makerere University Academic Issue Tracking System
        </footer>
      </div>
    </div>
  )
}

export default Layout
