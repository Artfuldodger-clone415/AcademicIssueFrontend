"use client"

import { useState, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Camera, Save, User, Mail, Phone, School, Shield, AlertCircle, CheckCircle } from "lucide-react"

const Profile = () => {
  const { user, updateUserProfile } = useAuth()
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
  })
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const updatedData = {
        ...formData,
        profile_photo: profilePhoto,
      }

      await updateUserProfile(updatedData)
      setSuccess("Profile updated successfully")

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        // Format error messages from API
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n")
        setError(errorMessages)
      } else {
        setError("Failed to update profile. Please try again.")
      }

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="profile-container">
      <div className="card">
        <div className="card-header">
          <h1>My Profile</h1>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <div>
                <h3>Error</h3>
                <div style={{ whiteSpace: "pre-line" }}>{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <div>
                <h3>Success</h3>
                <div>{success}</div>
              </div>
            </div>
          )}

          <div className="profile-header">
            <div className="profile-avatar">
              {profilePhoto ? (
                <img src={profilePhoto || "/placeholder.svg"} alt={`${user.first_name}'s profile`} />
              ) : (
                <>
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </>
              )}
              <div className="profile-avatar-overlay" onClick={() => fileInputRef.current.click()}>
                <Camera size={16} />
                <span>Change Photo</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="file-upload"
              accept="image/*"
              onChange={handlePhotoChange}
            />

            <div className="profile-info">
              <h1>
                {user.first_name} {user.last_name}
              </h1>

              <div className="profile-role">
                <Shield size={14} />
                {user.role.replace("_", " ").charAt(0).toUpperCase() + user.role.replace("_", " ").slice(1)}
              </div>

              <div className="profile-section">
                <div className="profile-label">Email</div>
                <div className="profile-value">{user.email}</div>
              </div>

              <div className="profile-section">
                <div className="profile-label">College</div>
                <div className="profile-value">{user.college || "No college specified"}</div>
              </div>

              <div className="profile-section">
                <div className="profile-label">Joined</div>
                <div className="profile-value">{new Date(user.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card mb-4">
              <div className="card-header">
                <h2>
                  <User size={18} /> Personal Information
                </h2>
              </div>
              <div className="card-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} className="mr-1" /> Email
                  </label>
                  <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number">
                    <Phone size={16} className="mr-1" /> Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <h2>
                  <School size={18} /> Academic Information
                </h2>
              </div>
              <div className="card-body">
                <div className="grid-2">
                  {user.role === "student" && (
                    <div className="form-group">
                      <label htmlFor="student_number">Student Number</label>
                      <input
                        type="text"
                        id="student_number"
                        value={user.student_number || ""}
                        disabled
                        style={{ backgroundColor: "var(--muted)" }}
                      />
                      <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                        Contact the registrar to update your student number
                      </p>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="college">College</label>
                    <input
                      type="text"
                      id="college"
                      value={user.college || ""}
                      disabled
                      style={{ backgroundColor: "var(--muted)" }}
                    />
                    <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      Contact the registrar to update your college
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <div className="loading" style={{ width: "1rem", height: "1rem", margin: 0 }}></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Account Security</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <h3>Change Password</h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              To change your password, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
