"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import NotificationBell from "../notification/NotificationBell"
import { LogOut, User, Settings, Menu, Search, HelpCircle, Moon, Sun, ChevronDown } from "lucide-react"

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true")
  const userMenuRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchBar])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("darkMode", "true")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("darkMode", "false")
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery)
      // Navigate to search results page or filter current view
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <button onClick={toggleSidebar} className="mobile-menu-button" aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>

        <img src="/logo.png" alt="Makerere University Logo" />
        <h1>Academic Issue Tracking System</h1>
      </div>

      <div className="navbar-actions">
        {showSearchBar ? (
          <form onSubmit={handleSearch} className="search-box">
            <Search size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" onClick={() => setShowSearchBar(false)} className="btn-icon">
              &times;
            </button>
          </form>
        ) : (
          <button onClick={() => setShowSearchBar(true)} className="btn-icon" aria-label="Search">
            <Search size={20} />
          </button>
        )}

        <button
          onClick={toggleDarkMode}
          className="dark-mode-toggle"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Link to="/help" className="btn-icon" aria-label="Help">
          <HelpCircle size={20} />
        </Link>

        <NotificationBell />

        <div className="dropdown" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="dropdown-toggle">
            <div className="user-avatar">
              {user?.profile_photo ? (
                <img src={user.profile_photo || "/placeholder.svg"} alt={`${user.first_name}'s avatar`} />
              ) : (
                <>
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </>
              )}
            </div>
            <span className="user-name">{user?.first_name}</span>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-name">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                <User size={16} />
                <span>Profile</span>
              </Link>

              {user?.role === "academic_registrar" && (
                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
                className="dropdown-item"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
