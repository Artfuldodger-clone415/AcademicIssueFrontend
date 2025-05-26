"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { generateReport, getColleges } from "../../services/api"
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
  LineChart,
  Line,
} from "recharts"
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  PieChartIcon,
  TrendingUp,
  Printer,
  RefreshCw,
  Building,
  Clock,
  AlertCircle,
} from "lucide-react"

const Reports = () => {
  const { user } = useAuth()
  const [reportType, setReportType] = useState("status")
  const [period, setPeriod] = useState("month")
  const [college, setCollege] = useState("")
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [colleges, setColleges] = useState([])
  const [chartType, setChartType] = useState("bar")
  const [reportTitle, setReportTitle] = useState("Issue Status Distribution")
  const reportRef = useRef(null)

  useEffect(() => {
    fetchColleges()
  }, [])

  useEffect(() => {
    fetchReport()
  }, [reportType, period, college])

  const fetchColleges = async () => {
    try {
      const collegeData = await getColleges()
      setColleges(collegeData)
    } catch (error) {
      console.error("Error loading colleges:", error)
    }
  }

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await generateReport(reportType, period, college)

      // Transform data for charts if needed
      let transformedData = []

      switch (reportType) {
        case "status":
          transformedData = [
            { name: "Pending", value: data.pending || 0, color: "#F59E0B" },
            { name: "In Progress", value: data.in_progress || 0, color: "#3B82F6" },
            { name: "Resolved", value: data.resolved || 0, color: "#10B981" },
            { name: "Closed", value: data.closed || 0, color: "#6B7280" },
          ]
          setReportTitle("Issue Status Distribution")
          break

        case "priority":
          transformedData = [
            { name: "Low", value: data.low || 0, color: "#10B981" },
            { name: "Medium", value: data.medium || 0, color: "#3B82F6" },
            { name: "High", value: data.high || 0, color: "#F59E0B" },
            { name: "Urgent", value: data.urgent || 0, color: "#EF4444" },
          ]
          setReportTitle("Issue Priority Distribution")
          break

        case "college":
          transformedData = Object.entries(data).map(([name, value]) => ({
            name,
            value,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          }))
          setReportTitle("Issues by College")
          break

        case "resolution_time":
          transformedData = Object.entries(data).map(([name, value]) => ({
            name,
            value,
            color: "#3B82F6",
          }))
          setReportTitle("Average Resolution Time by College (Days)")
          break

        case "trend":
          transformedData = Object.entries(data).map(([date, counts]) => ({
            date,
            created: counts.created || 0,
            resolved: counts.resolved || 0,
          }))
          setReportTitle("Issue Creation and Resolution Trends")
          break

        default:
          transformedData = data
      }

      setReportData(transformedData)
      setLoading(false)
    } catch (error) {
      console.error("Error generating report:", error)
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = reportRef.current
    const originalContents = document.body.innerHTML

    document.body.innerHTML = printContent.innerHTML

    window.print()

    document.body.innerHTML = originalContents
    window.location.reload()
  }

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Add headers
    if (reportType === "trend") {
      csvContent += "Date,Created Issues,Resolved Issues\n"

      // Add data rows
      reportData.forEach((item) => {
        csvContent += `${item.date},${item.created},${item.resolved}\n`
      })
    } else {
      csvContent += "Category,Value\n"

      // Add data rows
      reportData.forEach((item) => {
        csvContent += `${item.name},${item.value}\n`
      })
    }

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `${reportTitle.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Clean up
    document.body.removeChild(link)
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )
    }

    if (reportData.length === 0) {
      return (
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <BarChart2 className="mb-2 h-12 w-12 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No data available for the selected criteria.</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Try changing the report type, time period, or college.
          </p>
        </div>
      )
    }

    if (reportType === "trend") {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "4px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
                  border: "none",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="created" name="Created Issues" stroke="#3B82F6" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved Issues" stroke="#10B981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chartType === "pie") {
      return (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, "Count"]}
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
      )
    }

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={reportData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            layout={reportType === "college" || reportType === "resolution_time" ? "vertical" : "horizontal"}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={reportType !== "college" && reportType !== "resolution_time"}
            />
            {reportType === "college" || reportType === "resolution_time" ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={150} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "4px",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
                border: "none",
              }}
            />
            <Bar dataKey="value" name="Count">
              {reportData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "week":
        return "Last 7 days"
      case "month":
        return "Last 30 days"
      case "quarter":
        return "Last 3 months"
      case "year":
        return "Last 12 months"
      default:
        return "Last 30 days"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and analyze reports on academic issues.</p>
        </div>
      </div>

      {/* Report Controls */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="report-type" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Report Type
            </label>
            <div className="flex items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
              <span className="px-3 text-gray-500 dark:text-gray-400">
                <FileText size={16} />
              </span>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-md border-0 bg-transparent py-2 pl-1 pr-8 text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
              >
                <option value="status">Status Distribution</option>
                <option value="priority">Priority Distribution</option>
                <option value="college">Issues by College</option>
                <option value="resolution_time">Resolution Time by College</option>
                <option value="trend">Issue Trends</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="period" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period
            </label>
            <div className="flex items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
              <span className="px-3 text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
              </span>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-md border-0 bg-transparent py-2 pl-1 pr-8 text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 3 months</option>
                <option value="year">Last 12 months</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="college" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              College
            </label>
            <div className="flex items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
              <span className="px-3 text-gray-500 dark:text-gray-400">
                <Building size={16} />
              </span>
              <select
                id="college"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full rounded-md border-0 bg-transparent py-2 pl-1 pr-8 text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
              >
                <option value="">All Colleges</option>
                {colleges.map((c, index) => (
                  <option key={index} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="chart-type" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Chart Type
            </label>
            <div className="flex items-center rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
              <span className="px-3 text-gray-500 dark:text-gray-400">
                {chartType === "bar" ? <BarChart2 size={16} /> : <PieChartIcon size={16} />}
              </span>
              <select
                id="chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full rounded-md border-0 bg-transparent py-2 pl-1 pr-8 text-gray-900 focus:ring-2 focus:ring-primary dark:text-white"
                disabled={reportType === "trend" || reportType === "resolution_time"}
              >
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{reportTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getPeriodLabel()} • {college ? college : "All Colleges"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={loading || reportData.length === 0}
            >
              <Download size={16} /> Export CSV
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={loading || reportData.length === 0}
            >
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="print:block print:p-6">
          <div className="print:mb-6 print:text-center">
            <h1 className="print:text-2xl print:font-bold">{reportTitle}</h1>
            <p className="print:text-sm print:text-gray-600">
              {getPeriodLabel()} • {college ? college : "All Colleges"} • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          {renderChart()}

          {reportData.length > 0 && (
            <div className="mt-6 overflow-x-auto print:mt-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-500 dark:border-gray-700">
                    <th className="px-4 py-2">{reportType === "trend" ? "Date" : "Category"}</th>
                    {reportType === "trend" ? (
                      <>
                        <th className="px-4 py-2">Created Issues</th>
                        <th className="px-4 py-2">Resolved Issues</th>
                      </>
                    ) : (
                      <th className="px-4 py-2">Count</th>
                    )}
                    {reportType !== "trend" && <th className="px-4 py-2">Percentage</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportType === "trend" ? (
                    reportData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                      >
                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{item.date}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{item.created}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{item.resolved}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {reportData.map((item, index) => {
                        const total = reportData.reduce((sum, i) => sum + i.value, 0)
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0

                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                          >
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{item.value}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{percentage}%</td>
                          </tr>
                        )
                      })}
                      <tr className="border-b border-gray-200 font-medium text-sm dark:border-gray-700">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">Total</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {reportData.reduce((sum, item) => sum + item.value, 0)}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">100%</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report Insights */}
      {reportData.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Report Insights</h2>

          <div className="space-y-4">
            {reportType === "status" && (
              <>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Status Distribution Analysis</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {reportData.find((item) => item.name === "Pending")?.value >
                        reportData.find((item) => item.name === "Resolved")?.value
                          ? "There are more pending issues than resolved ones. Consider allocating more resources to address the backlog."
                          : "The number of resolved issues is higher than pending ones, indicating good progress in issue resolution."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Resolution Efficiency</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {(reportData.find((item) => item.name === "Resolved")?.value || 0) +
                          (reportData.find((item) => item.name === "Closed")?.value || 0) >
                        0
                          ? `${(reportData.find((item) => item.name === "Resolved")?.value || 0) + (reportData.find((item) => item.name === "Closed")?.value || 0)} issues have been successfully addressed during this period.`
                          : "No issues have been resolved during this period. Review the issue resolution process."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === "priority" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Priority Assessment</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {(reportData.find((item) => item.name === "High")?.value || 0) +
                        (reportData.find((item) => item.name === "Urgent")?.value || 0) >
                      (reportData.find((item) => item.name === "Low")?.value || 0) +
                        (reportData.find((item) => item.name === "Medium")?.value || 0)
                        ? "There's a high number of high-priority issues. This may indicate systemic problems that need immediate attention."
                        : "Most issues are of low or medium priority, suggesting that critical academic problems are being managed effectively."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportType === "college" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                    <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">College Distribution Analysis</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {reportData.length > 0 &&
                        `${reportData.sort((a, b) => b.value - a.value)[0].name} has the highest number of issues (${reportData.sort((a, b) => b.value - a.value)[0].value}), 
                        which may indicate areas that need additional support or review.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportType === "trend" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Trend Analysis</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {reportData.length > 1 &&
                        `The trend shows ${
                          reportData[reportData.length - 1].created > reportData[0].created
                            ? "an increase"
                            : "a decrease"
                        } in issue creation over time. ${
                          reportData[reportData.length - 1].resolved > reportData[0].resolved
                            ? "Resolution rates have improved"
                            : "Resolution rates have declined"
                        } during this period.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportType === "resolution_time" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Resolution Time Analysis</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {reportData.length > 0 &&
                        `${reportData.sort((a, b) => b.value - a.value)[0].name} has the longest average resolution time (${reportData.sort((a, b) => b.value - a.value)[0].value} days). 
                        Consider reviewing the issue handling process for this college to improve efficiency.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900">
                  <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Recommendations</h3>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>Review the data regularly to identify patterns and trends in academic issues.</li>
                    <li>Share these reports with department heads to improve issue resolution processes.</li>
                    <li>Consider implementing targeted interventions for colleges with high issue counts.</li>
                    <li>Set up automated alerts for unusual spikes in high-priority issues.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
