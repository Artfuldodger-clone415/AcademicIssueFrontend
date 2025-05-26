import axios from "axios"

// ✅ Use environment variable or fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

console.log("API Base URL:", API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for slow Render cold starts
})

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("Making API request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    })

    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("API response success:", {
      status: response.status,
      url: response.config.url,
    })
    return response
  },
  async (error) => {
    console.error("API response error:", {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
    })

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

        const response = await api.post("/token/refresh/", {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem("access_token", access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// ✅ Registration function
export const register = async (userData) => {
  try {
    console.log("Registering user with data:", { ...userData, password: "[HIDDEN]", password2: "[HIDDEN]" })
    const response = await api.post("/register/", userData)
    console.log("Registration successful")
    return response.data
  } catch (error) {
    console.error("Registration failed:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Login function
export const login = async (credentials) => {
  try {
    console.log("Attempting login for user:", credentials.username)
    const response = await api.post("/token/", credentials)
    const { access, refresh } = response.data

    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)

    console.log("Login successful")
    return response.data
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/profile/")
    return response.data
  } catch (error) {
    console.error("Failed to fetch current user:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Colleges function
export const getColleges = async () => {
  try {
    const response = await api.get("/colleges/")
    return response.data
  } catch (error) {
    console.error("Failed to fetch colleges:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Course units function
export const getCourseUnits = async () => {
  try {
    const response = await api.get("/course-units/")
    return response.data
  } catch (error) {
    console.error("Failed to fetch course units:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Update user profile
export const updateProfile = async (userData) => {
  try {
    const response = await api.patch("/profile/", userData)
    return response.data
  } catch (error) {
    console.error("Failed to update profile:", error.response?.data || error.message)
    throw error
  }
}

// ✅ Issues API
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

// ✅ Comments API
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

// ✅ Notifications API
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

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/unread-count/")
  return response.data
}

// ✅ Users API
export const getUsers = async () => {
  const response = await api.get("/users/")
  return response.data
}

export const getLecturers = async () => {
  const response = await api.get("/lecturers/")
  return response.data
}

export const getStudents = async () => {
  const response = await api.get("/students/")
  return response.data
}

export const getRegistrars = async () => {
  const response = await api.get("/registrars/")
  return response.data
}

// ✅ Dashboard API
export const getDashboardData = async () => {
  const response = await api.get("/dashboard/")
  return response.data
}

// ✅ Reports API
export const getIssueReport = async (params = {}) => {
  const response = await api.get("/issues/report/", { params })
  return response.data
}

export const getUnassignedIssues = async () => {
  const response = await api.get("/issues/unassigned/")
  return response.data
}

// ✅ Role fields API
export const getRoleFields = async () => {
  const response = await api.get("/role-fields/")
  return response.data
}

// Additional utility functions
export const getIssueStats = async () => {
  const response = await api.get("/issues/stats/")
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

  const response = await api.get("/issues/report/", { params })
  return response.data
}

export const logout = async () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  return true
}

export default api
