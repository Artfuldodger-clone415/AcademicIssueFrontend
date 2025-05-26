"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getIssues, getColleges, getLecturers, getStudents } from "../../services/api"
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
  AreaChart,
  Area,
} from "recharts"
import {
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Users,
  FileText,
  BarChart2,
  Download,
  Filter,
  RefreshCw,
  ArrowRight,
  Calendar,
  BookOpen,
  Building,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

const RegistrarDashboard = () => {
  const { user } = useAuth()
  const [allIssues, setAllIssues] = useState([])
  const [collegeStats, setCollegeStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [priorityIssues, setPriorityIssues] = useState([])
  const [timeframe, setTimeframe] = useState("month")
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    closedIssues: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalColleges: 0,
    resolutionRate: 0,
    avgResolutionTime: 0,
  })
  const [trendData, setTrendData] = useState([])
  const [collegeList, setCollegeList] = useState([])
  const [selectedCollege, setSelectedCollege] = useState("all")

  useEffect(() => {
    fetchDashboardData()
    fetchColleges()
    fetchUserStats()
  }, [timeframe, selectedCollege])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get all issues
      const issues = await getIssues()

      // Filter issues based on timeframe and college
      const filteredIssues = filterIssues(issues, timeframe, selectedCollege)
      setAllIssues(filteredIssues)

      // Calculate college statistics
      calculateCollegeStats(filteredIssues)

      // Identify priority issues (pending for more than 7 days)
      identifyPriorityIssues(filteredIssues)

      // Calculate overall stats
      calculateStats(filteredIssues)

      // Generate trend data
      generateTrendData(filteredIssues)

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  const fetchColleges = async () => {
    try {
      const colleges = await getColleges()
      setCollegeList(colleges)
    } catch (error) {
      console.error("Error fetching colleges:", error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const [lecturers, students] = await Promise.all([getLecturers(), getStudents()])

      setStats((prev) => ({
        ...prev,
        totalStudents: students.length,
        totalLecturers: lecturers.length,
        totalColleges: collegeList.length,
      }))
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const filterIssues = (issues, timeframe, college) => {
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
        cutoffDate.setMonth(now.getMonth() - 1)
    }

    let filtered = issues.filter((issue) => new Date(issue.created_at) >= cutoffDate)

    if (college && college !== "all") {
      filtered = filtered.filter((issue) => issue.college === college)
    }

    return filtered
  }

  const calculateCollegeStats = (issues) => {
    const collegeMap = {}

    issues.forEach((issue) => {
      const college = issue.college || "Unknown"

      if (!collegeMap[college]) {
        collegeMap[college] = { name: college, count: 0 }
      }
      collegeMap[college].count++
    })

    setCollegeStats(Object.values(collegeMap))
  }

  const identifyPriorityIssues = (issues) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const priority = issues.filter((issue) => {
      const createdDate = new Date(issue.created_at)
      return (
        (issue.status === "pending" && createdDate < sevenDaysAgo) ||
        issue.priority === "urgent" ||
        issue.priority === "high"
      )
    })

    setPriorityIssues(priority)
  }

  const calculateStats = (issues) => {
    const pendingIssues = issues.filter((issue) => issue.status === "pending").length
    const inProgressIssues = issues.filter((issue) => issue.status === "in_progress").length
    const resolvedIssues = issues.filter((issue) => issue.status === "resolved").length
    const closedIssues = issues.filter((issue) => issue.status === "closed").length

    // Calculate resolution rate
    const totalResolved = resolvedIssues + closedIssues
    const resolutionRate = issues.length > 0 ? Math.round((totalResolved / issues.length) * 100) : 0

    // Calculate average resolution time (in days)
    let totalResolutionTime = 0
    let resolvedCount = 0

    issues.forEach((issue) => {
      if (issue.status === "resolved" || issue.status === "closed") {
        const createdDate = new Date(issue.created_at)
        const resolvedDate = new Date(issue.resolved_at || issue.updated_at)
        const timeDiff = resolvedDate - createdDate
        const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24))

        totalResolutionTime += daysDiff
        resolvedCount++
      }
    })

    const avgResolutionTime = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0

    setStats((prev) => ({
      ...prev,
      totalIssues: issues.length,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      resolutionRate,
      avgResolutionTime,
    }))
  }

  const generateTrendData = (issues) => {
    // Group issues by date
    const dateMap = {}
    const now = new Date()
    let startDate

    // Set start date based on timeframe
    switch (timeframe) {
      case "week":
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
    }

    // Initialize date map with all dates in the range
    const dateRange = []
    const currentDate = new Date(startDate)

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split("T")[0]
      dateMap[dateStr] = {
        date: dateStr,
        created: 0,
        resolved: 0,
      }

      dateRange.push(dateStr)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Count issues by date
    issues.forEach((issue) => {
      const createdDate = issue.created_at.split("T")[0]
      const resolvedDate = issue.resolved_at?.split("T")[0] || issue.updated_at?.split("T")[0]

      if (dateMap[createdDate]) {
        dateMap[createdDate].created++
      }

      if (resolvedDate && dateMap[resolvedDate] && (issue.status === "resolved" || issue.status === "closed")) {
        dateMap[resolvedDate].resolved++
      }
    })

    // Convert to array for chart
    const trendData = dateRange.map((date) => dateMap[date])
    setTrendData(trendData)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "in_progress":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "closed":
        return <X className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "high":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  // Prepare data for the pie chart
  const statusData = [
    { name: "Pending", value: stats.pendingIssues, color: "#F59E0B" },
    { name: "In Progress", value: stats.inProgressIssues, color: "#3B82F6" },
    { name: "Resolved", value: stats.resolvedIssues, color: "#10B981" },
    { name: "Closed", value: stats.closedIssues, color: "#6B7280" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Registrar Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user.first_name}! Here's an overview of all academic issues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
            <span className="px-3 text-sm text-gray-500 dark:text-gray-400">
              <Filter size={16} />
            </span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-0 bg-transparent py-1.5 pl-1 pr-8 text-sm text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">Last year</option>
            </select>
          </div>

          <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
            <span className="px-3 text-sm text-gray-500 dark:text-gray-400">
              <Building size={16} />
            </span>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="rounded-md border-0 bg-transparent py-1.5 pl-1 pr-8 text-sm text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="all">All Colleges</option>
              {collegeList.map((college, index) => (
                <option key={index} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Issues</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalIssues}</h3>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className={`flex items-center gap-1 ${stats.totalIssues > 0 ? "text-green-600" : "text-gray-500"}`}>
              <TrendingUp size={14} /> Active tracking
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Issues</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingIssues}</h3>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span
              className={`flex items-center gap-1 ${stats.pendingIssues > stats.inProgressIssues ? "text-amber-600" : "text-green-600"}`}
            >
              {stats.pendingIssues > stats.inProgressIssues ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stats.pendingIssues > stats.inProgressIssues ? "Needs attention" : "Under control"}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolutionRate}%</h3>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span
              className={`flex items-center gap-1 ${stats.resolutionRate >= 70 ? "text-green-600" : "text-amber-600"}`}
            >
              {stats.resolutionRate >= 70 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stats.resolutionRate >= 70 ? "Good performance" : "Needs improvement"}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Resolution Time</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgResolutionTime} days</h3>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span
              className={`flex items-center gap-1 ${stats.avgResolutionTime <= 7 ? "text-green-600" : "text-amber-600"}`}
            >
              {stats.avgResolutionTime <= 7 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {stats.avgResolutionTime <= 7 ? "Efficient" : "Needs improvement"}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Lecturers</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLecturers}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-teal-100 p-2 dark:bg-teal-900">
              <Building className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Colleges</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalColleges}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Priority Issues */}
        <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Priority Issues</h2>
            <Link
              to="/issues?priority=high,urgent"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : priorityIssues.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <CheckCircle className="mb-2 h-10 w-10 text-green-500" />
                <p className="text-gray-600 dark:text-gray-400">No priority issues at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {priorityIssues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        <Link to={`/issues/${issue.id}`} className="hover:text-primary hover:underline">
                          {issue.title}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityClass(issue.priority)}`}
                        >
                          {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {getStatusIcon(issue.status)}{" "}
                          {issue.status.replace("_", " ").charAt(0).toUpperCase() +
                            issue.status.replace("_", " ").slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>By: {issue.created_by_name}</span>
                        <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                        <span>College: {issue.college || "Unknown"}</span>
                      </div>

                      <Link
                        to={`/issues/${issue.id}`}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Status Distribution</h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : statusData.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <BarChart2 className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No data to display</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} issues`, "Count"]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "4px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
                        border: "none",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Issues Trend */}
        <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Trends</h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <BarChart2 className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No trend data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => {
                        const d = new Date(date)
                        return d.getDate() + "/" + (d.getMonth() + 1)
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "4px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
                        border: "none",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created Issues"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved Issues"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Issues by College */}
        <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issues by College</h2>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : collegeStats.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <Building className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No college data available</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={collegeStats}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip
                      formatter={(value) => [`${value} issues`, "Count"]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "4px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
                        border: "none",
                      }}
                    />
                    <Bar dataKey="count" name="Issues" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Unassigned Issues */}
      <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Unassigned Issues</h2>
          <Link
            to="/issues?assigned=false"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : allIssues.filter((issue) => !issue.assigned_to).length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <CheckCircle className="mb-2 h-10 w-10 text-green-500" />
              <p className="text-gray-600 dark:text-gray-400">All issues are currently assigned.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500 dark:border-gray-700">
                    <th className="whitespace-nowrap px-4 py-2">Title</th>
                    <th className="whitespace-nowrap px-4 py-2">Student</th>
                    <th className="whitespace-nowrap px-4 py-2">College</th>
                    <th className="whitespace-nowrap px-4 py-2">Created</th>
                    <th className="whitespace-nowrap px-4 py-2">Priority</th>
                    <th className="whitespace-nowrap px-4 py-2">Status</th>
                    <th className="whitespace-nowrap px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allIssues
                    .filter((issue) => !issue.assigned_to)
                    .slice(0, 5)
                    .map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="font-medium text-gray-900 hover:text-primary hover:underline dark:text-white"
                          >
                            {issue.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{issue.created_by_name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{issue.college || "Unknown"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityClass(issue.priority)}`}
                          >
                            {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            {getStatusIcon(issue.status)}{" "}
                            {issue.status.replace("_", " ").charAt(0).toUpperCase() +
                              issue.status.replace("_", " ").slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark"
                          >
                            Assign
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/reports"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <BarChart2 size={16} /> Generate Reports
          </Link>

          <Link
            to="/issues/create"
            className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <FileText size={16} /> Create Issue
          </Link>

          <Link
            to="/users"
            className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Users size={16} /> Manage Users
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Download size={16} /> Export Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrarDashboard
