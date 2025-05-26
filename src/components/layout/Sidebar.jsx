"use client"

import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  Home,
  FileText,
  PlusCircle,
  User,
  BarChart2,
  Settings,
  ChevronRight,
  BookOpen,
  Users,
  Bell,
  HelpCircle,
  Layers,
  Calendar,
  MessageSquare,
  ChevronLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const Sidebar = ({ collapsed, toggleSidebar, isMobile }) => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const [activeGroup, setActiveGroup] = useState(null)
  const location = useLocation()

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(!collapsed)
    }
  }, [isMobile, collapsed])

  // Define navigation items based on user role
  const getNavGroups = () => {
    const commonGroups = [
      {
        title: "Main",
        items: [
          { to: "/dashboard", icon: <Home size={20} />, label: "Dashboard" },
          { to: "/issues", icon: <FileText size={20} />, label: "Issues" },
        ],
      },
      {
        title: "Personal",
        items: [
          { to: "/profile", icon: <User size={20} />, label: "Profile" },
          { to: "/calendar", icon: <Calendar size={20} />, label: "Calendar" },
        ],
      },
    ]

    // Add role-specific items
    if (user?.role === "student") {
      return [
        ...commonGroups,
        {
          title: "Academic",
          items: [
            { to: "/issues/create", icon: <PlusCircle size={20} />, label: "Create Issue" },
            { to: "/course-units", icon: <BookOpen size={20} />, label: "Course Units" },
            { to: "/messages", icon: <MessageSquare size={20} />, label: "Messages" },
          ],
        },
      ]
    } else if (user?.role === "lecturer") {
      return [
        ...commonGroups,
        {
          title: "Academic",
          items: [
            { to: "/my-courses", icon: <BookOpen size={20} />, label: "My Courses" },
            { to: "/students", icon: <Users size={20} />, label: "Students" },
            { to: "/messages", icon: <MessageSquare size={20} />, label: "Messages" },
          ],
        },
      ]
    } else if (user?.role === "academic_registrar") {
      return [
        ...commonGroups,
        {
          title: "Management",
          items: [
            { to: "/reports", icon: <BarChart2 size={20} />, label: "Reports" },
            { to: "/users", icon: <Users size={20} />, label: "Users" },
            { to: "/colleges", icon: <Layers size={20} />, label: "Colleges" },
          ],
        },
        {
          title: "System",
          items: [
            { to: "/notifications", icon: <Bell size={20} />, label: "Notifications" },
            { to: "/settings", icon: <Settings size={20} />, label: "Settings" },
            { to: "/help", icon: <HelpCircle size={20} />, label: "Help & Support" },
          ],
        },
      ]
    }

    return commonGroups
  }

  const navGroups = getNavGroups()

  // Check if a group has an active link
  useEffect(() => {
    const currentPath = location.pathname

    for (const group of navGroups) {
      const hasActiveItem = group.items.some(
        (item) => currentPath === item.to || (item.to !== "/dashboard" && currentPath.startsWith(item.to)),
      )

      if (hasActiveItem) {
        setActiveGroup(group.title)
        break
      }
    }
  }, [location.pathname, navGroups])

  const toggleGroup = (groupName) => {
    if (activeGroup === groupName) {
      setActiveGroup(null)
    } else {
      setActiveGroup(groupName)
    }
  }

  const handleMobileToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && <div className="sidebar-overlay active" onClick={handleMobileToggle}></div>}

      {/* Mobile menu button */}
      {isMobile && !isOpen && (
        <button className="mobile-menu-button" onClick={handleMobileToggle}>
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">MUITS</h1>
          {isOpen && (
            <button
              onClick={isMobile ? handleMobileToggle : toggleSidebar}
              className={isMobile ? "close-sidebar" : "sidebar-toggle"}
            >
              {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
          {!isOpen && !isMobile && (
            <button onClick={toggleSidebar} className="sidebar-toggle">
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="sidebar-nav-group">
              {isOpen && (
                <div className="sidebar-nav-group-title" onClick={() => toggleGroup(group.title)}>
                  <span>{group.title}</span>
                  <ChevronRight
                    size={14}
                    className={activeGroup === group.title ? "rotate-90" : ""}
                    style={{ transition: "transform 0.2s ease" }}
                  />
                </div>
              )}

              <div className={!isOpen || activeGroup === group.title ? "block" : "hidden"}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
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
            <div className="user-details">
              <div className="user-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="user-role">
                {user?.role?.replace("_", " ").charAt(0).toUpperCase() + user?.role?.replace("_", " ").slice(1)}
              </div>
            </div>
            {isOpen && (
              <button onClick={logout} className="btn-icon" title="Logout" style={{ marginLeft: "auto" }}>
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
