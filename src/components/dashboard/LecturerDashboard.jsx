"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getIssues, getIssueStats, getCourseUnits } from "../../services/api"
import { useAuth } from "../../contexts/AuthContext"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Users,
  BookOpen,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
} from "lucide-react"

const LecturerDashboard = () => {
  const { user } = useAuth()
  const [assignedIssues, setAssignedIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [courseUnits, setCourseUnits] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  })
  const [timeframe, setTimeframe] = useState("week")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchCourseUnits()
  }, [user.id, timeframe])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get issues assigned to the lecturer
      const issues = await getIssues({ assigned_to: user.id })

      // Get issue statistics
      const statsData = await getIssueStats()

      // Filter issues based on timeframe
      const filteredIssues = filterIssuesByTimeframe(issues, timeframe)
      setAssignedIssues(filteredIssues)

      // Prepare data for charts
      prepareChartData(filteredIssues, statsData)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  const fetchCourseUnits = async () => {
    try {
      const data = await getCourseUnits()
      // Filter course units taught by this lecturer
      const lecturerCourses = data.filter(
        (course) => course.lecturer_id === user.id || course.lecturers?.includes(user.id),
      )
      setCourseUnits(lecturerCourses)
    } catch (error) {
      console.error("Error fetching course units:", error)
    }
  }

  const filterIssuesByTimeframe = (issues, timeframe) => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (timeframe) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        cutoffDate.setDate(now.getDate() - 7)
    }

    return issues.filter((issue) => new Date(issue.created_at) >= cutoffDate)
  }

  const prepareChartData = (issues, statsData) => {
    // Status counts for chart
    const statusCounts = {
      pending: issues.filter((issue) => issue.status === "pending").length,
      in_progress: issues.filter((issue) => issue.status === "in_progress").length,
      resolved: issues.filter((issue) => issue.status === "resolved").length,
      closed: issues.filter((issue) => issue.status === "closed").length,
    }

    setChartData([
      { name: "Pending", count: statusCounts.pending, color: "#ffa500" },
      { name: "In Progress", count: statusCounts.in_progress, color: "#3b82f6" },
      { name: "Resolved", count: statusCounts.resolved, color: "#10b981" },
      { name: "Closed", count: statusCounts.closed, color: "#6b7280" },
    ])

    // Priority distribution for pie chart
    const priorityCounts = {
      low: issues.filter((issue) => issue.priority === "low").length,
      medium: issues.filter((issue) => issue.priority === "medium").length,
      high: issues.filter((issue) => issue.priority === "high").length,
      urgent: issues.filter((issue) => issue.priority === "urgent").length,
    }

    setPriorityData([
      { name: "Low", value: priorityCounts.low, color: "#10b981" },
      { name: "Medium", value: priorityCounts.medium, color: "#3b82f6" },
      { name: "High", value: priorityCounts.high, color: "#f59e0b" },
      { name: "Urgent", value: priorityCounts.urgent, color: "#dc2626" },
    ])

    // Set overall stats
    setStats({
      total: issues.length,
      pending: statusCounts.pending,
      inProgress: statusCounts.in_progress,
      resolved: statusCounts.resolved,
      closed: statusCounts.closed,
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="status-pending" />
      case "in_progress":
        return <AlertCircle className="status-in-progress" />
      case "resolved":
        return <CheckCircle className="status-resolved" />
      case "closed":
        return <X className="status-closed" />
      default:
        return null
    }
  }

  const pendingIssues = assignedIssues.filter((issue) => issue.status === "pending")
  const inProgressIssues = assignedIssues.filter((issue) => issue.status === "in_progress")

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Lecturer Dashboard</h1>
        <p>Welcome back, {user.first_name}! Here's an overview of your assigned issues.</p>

        <div className="dashboard-controls">
          <div className="dashboard-filter">
            <span className="dashboard-filter-icon">
              <Filter size={16} />
            </span>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">Last year</option>
            </select>
          </div>

          <button onClick={handleRefresh} className="btn btn-primary btn-sm" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-container">
              <FileText className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Issues</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-container">
              <Clock className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-container">
              <AlertCircle className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-container">
              <CheckCircle className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Issues Requiring Attention */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Issues Requiring Attention</h2>
            <Link to="/issues?status=pending" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="loading">Loading assigned issues...</div>
            ) : pendingIssues.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} className="empty-state-icon" />
                <p>No pending issues require your attention.</p>
              </div>
            ) : (
              <div className="issue-list">
                {pendingIssues.slice(0, 5).map((issue) => (
                  <div key={issue.id} className="issue-card">
                    <div className="issue-header">
                      <h3>
                        <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                      </h3>
                      <span className={`priority-badge priority-${issue.priority}`}>
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </span>
                    </div>

                    <p className="issue-description">{issue.description.substring(0, 100)}...</p>

                    <div className="issue-footer">
                      <span>By: {issue.created_by_name}</span>
                      <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="issue-actions">
                      <Link to={`/issues/${issue.id}`} className="btn btn-primary btn-sm">
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="dashboard-section chart-section">
          <div className="section-header">
            <h2>Issue Analytics</h2>
          </div>

          <div>
            {loading ? (
              <div className="loading">Loading analytics...</div>
            ) : (
              <div>
                <h3 className="mb-2">Status Distribution</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Issues">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <h3 className="mb-2 mt-4">Priority Distribution</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData.filter((item) => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} issues`, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="dashboard-charts">
        {/* In Progress Issues */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>In Progress Issues</h2>
            <Link to="/issues?status=in_progress" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="loading">Loading in-progress issues...</div>
            ) : inProgressIssues.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} className="empty-state-icon" />
                <p>You have no issues currently in progress.</p>
              </div>
            ) : (
              <div className="issue-list">
                {inProgressIssues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="issue-card">
                    <div className="issue-header">
                      <h3>
                        <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                      </h3>
                      <span className="status-badge status-in-progress">In Progress</span>
                    </div>

                    <p className="issue-description">{issue.description.substring(0, 100)}...</p>

                    <div className="issue-footer">
                      <span>By: {issue.created_by_name}</span>
                      <span>Updated: {new Date(issue.updated_at).toLocaleDateString()}</span>
                    </div>

                    <div className="issue-actions">
                      <Link to={`/issues/${issue.id}`} className="btn btn-primary btn-sm">
                        Continue Working
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Course Units */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Course Units</h2>
            <Link to="/my-courses" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div>
            {loading ? (
              <div className="loading">Loading course units...</div>
            ) : courseUnits.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} className="empty-state-icon" />
                <p>No course units assigned yet.</p>
              </div>
            ) : (
              <div className="issue-list">
                {courseUnits.slice(0, 5).map((course) => (
                  <div key={course.id} className="issue-card">
                    <div className="issue-header">
                      <h3>
                        {course.code}: {course.name}
                      </h3>
                      <span className="priority-badge priority-medium">
                        <Users size={14} /> {course.students_count || 0}
                      </span>
                    </div>
                    <p className="issue-description">
                      {course.semester} • {course.academic_year}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Upcoming Events</h2>
          <Link to="/calendar" className="btn btn-secondary btn-sm">
            View Calendar <ArrowRight size={14} />
          </Link>
        </div>

        <div className="empty-state">
          <Calendar size={48} className="empty-state-icon" />
          <p>No upcoming events scheduled.</p>
        </div>
      </div>
    </div>
  )
}

export default LecturerDashboard
