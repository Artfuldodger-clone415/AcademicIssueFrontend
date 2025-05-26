import axios from "axios"

// Add better error logging
console.log("API URL:", process.env.REACT_APP_API_URL)

// Validate environment variable
if (!process.env.REACT_APP_API_URL) {
  console.error("REACT_APP_API_URL environment variable is not set!")
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("refresh_token")

        if (!refreshToken) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
          return Promise.reject(error)
        }

        const API_BASE_URL = process.env.REACT_APP_API_URL
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem("access_token", access)

        api.defaults.headers.common["Authorization"] = `Bearer ${access}`
        originalRequest.headers.Authorization = `Bearer ${access}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// ✅ Add a register function to your API
export const register = async (userData) => {
  const response = await api.post("/register/", userData)
  return response.data
}

// Issues API
export const getIssues = async (filters = {}) => {
  const response = await api.get("/issues/", { params: filters })
  return response.data
}

export const getIssue = async (id) => {
  const response = await api.get(`/issues/${id}/`)
  return response.data
}

export const addIssue = async (issueData) => {
  const response = await api.post("/issues/", issueData)
  return response.data
}

export const updateIssue = async (id, issueData) => {
  const response = await api.patch(`/issues/${id}/`, issueData)
  return response.data
}

export const deleteIssue = async (id) => {
  await api.delete(`/issues/${id}/`)
  return true
}

export const assignIssue = async (id, userId) => {
  const response = await api.post(`/issues/${id}/assign/`, { user_id: userId })
  return response.data
}

// Comments API
export const getComments = async (issueId) => {
  const response = await api.get(`/issues/${issueId}/comments/`)
  return response.data
}

export const addComment = async (issueId, content) => {
  const response = await api.post(`/issues/${issueId}/comments/`, {
    issue: issueId,
    content,
  })
  return response.data
}

// Notifications API
export const getNotifications = async () => {
  const response = await api.get("/notifications/")
  return response.data
}

export const markNotificationAsRead = async (id) => {
  const response = await api.post(`/notifications/${id}/mark_read/`)
  return response.data
}

export const markAllNotificationsAsRead = async () => {
  const response = await api.post("/notifications/mark_all_read/")
  return response.data
}

// Users API
export const getLecturers = async () => {
  const response = await api.get("/users/?role=lecturer")
  return response.data
}

export const getUsers = async () => {
  const response = await api.get("/users/")
  return response.data
}

// Added functions for the missing endpoints
export const getIssueStats = async () => {
  const response = await api.get("/issues/stats/")
  return response.data
}

export const getCourseUnits = async () => {
  const response = await api.get("/course-units/")
  return response.data
}

export const getColleges = async () => {
  const response = await api.get("/colleges/")
  return response.data
}

export const getStudents = async () => {
  const response = await api.get("/users/?role=student")
  return response.data
}

export const generateReport = async (reportType, period, college) => {
  const params = {
    type: reportType,
    period: period,
  }

  if (college) {
    params.college = college
  }

  const response = await api.get("/reports/generate/", { params })
  return response.data
}

// Profile API
export const getCurrentUser = async () => {
  const response = await api.get("/users/me/")
  return response.data
}

export const updateProfile = async (userData) => {
  const response = await api.patch("/users/me/", userData)
  return response.data
}

// Authentication
export const login = async (credentials) => {
  const response = await api.post("/token/", credentials)
  const { access, refresh } = response.data

  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)

  return response.data
}

export const logout = async () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  return true
}

export default api
