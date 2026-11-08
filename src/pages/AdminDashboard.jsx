import { useEffect, useState } from 'react'

import ThemeToggle from '../components/ThemeToggle.jsx'
import { initialDetails, loadPortfolio, savePortfolio, uploadProfilePhoto } from '../services/portfolioStorage.js'

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'profile_photo', label: 'Profile Photo URL' },
  { name: 'title', label: 'Title', required: true },
  { name: 'introduction', label: 'Introduction / About Me', multiline: true, wide: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'location', label: 'Location' },
  { name: 'degree', label: 'Degree' },
  { name: 'branch', label: 'Branch' },
  { name: 'college', label: 'College' },
  { name: 'start_year', label: 'Start Year', type: 'number' },
  { name: 'end_year', label: 'End Year', type: 'number' },
  { name: 'github_url', label: 'GitHub URL', type: 'url' },
  { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
  { name: 'resume_url', label: 'Resume URL', type: 'url' },
]

function AdminDashboard() {
  const [values, setValues] = useState({ ...initialDetails })
  const [hasRecord, setHasRecord] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoIsAvailable, setPhotoIsAvailable] = useState(true)

  useEffect(() => {
    let isCurrent = true
    loadPortfolio({ force: true })
      .then(({ record }) => {
        if (!isCurrent) return
        if (record) {
          setValues(Object.fromEntries(Object.keys(initialDetails).map((field) => [
            field,
            record[field] ?? initialDetails[field],
          ])))
          setHasRecord(true)
        }
      })
      .catch((error) => {
        if (isCurrent) setStatus({ type: 'error', message: error.message || 'Saved portfolio details could not be loaded.' })
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview('')
      return undefined
    }
    const url = URL.createObjectURL(selectedPhoto)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedPhoto])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setStatus(null)
  }

  function resetForm() {
    setValues({ ...initialDetails })
    setSelectedPhoto(null)
    setPhotoIsAvailable(true)
    setStatus({ type: 'success', message: 'Form reset to the initial portfolio details.' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setStatus(null)
    try {
      const details = { ...values }
      if (selectedPhoto) details.profile_photo = await uploadProfilePhoto(selectedPhoto)
      const { record } = await savePortfolio(details)
      setValues(Object.fromEntries(Object.keys(initialDetails).map((field) => [
        field,
        record[field] ?? '',
      ])))
      setHasRecord(true)
      setSelectedPhoto(null)
      setPhotoIsAvailable(true)
      setStatus({ type: 'success', message: 'Portfolio details saved to Supabase.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save portfolio details.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/" aria-label="Return to portfolio">
          M<span>.</span><small>M SHANMUKHA SAI</small>
        </a>
        <p className="dashboard-nav-label">PORTFOLIO</p>
        <nav className="dashboard-nav" aria-label="Admin dashboard">
          <a className="dashboard-nav-item is-active" href="/admin/dashboard" aria-current="page">
            <span className="dashboard-nav-icon" aria-hidden="true">◉</span><span>Admin Dashboard</span>
          </a>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <a className="dashboard-logout" href="/"><span className="dashboard-nav-icon" aria-hidden="true">↗</span>Back to website</a>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="dashboard-breadcrumb">PORTFOLIO / ADMIN DASHBOARD</p><h1>ADMIN DASHBOARD</h1></div>
          <div className="dashboard-topbar-actions">
            <ThemeToggle />
            <a className="dashboard-view-site" href="/">Preview Portfolio <span aria-hidden="true">↗</span></a>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-editor-panel">
            <div className="dashboard-panel-heading">
              <p className="eyebrow">PORTFOLIO CONTENT</p>
              <h2>Your portfolio details</h2>
              <p>Edit your public profile. Changes are saved to the existing Supabase portfolio record.</p>
            </div>

            {isLoading ? (
              <p className="dashboard-message-meta" role="status">Loading saved portfolio details…</p>
            ) : (
              <form className="dashboard-edit-form" onSubmit={handleSubmit}>
                {!hasRecord && (
                  <p className="dashboard-message-meta">No portfolio record exists yet. Saving will create the first record in the existing table.</p>
                )}
                <div className="dashboard-photo-manager">
                  <div className="dashboard-photo-preview">
                    {photoPreview || (photoIsAvailable && values.profile_photo) ? (
                      <img
                        src={photoPreview || values.profile_photo}
                        alt="Profile photo preview"
                        onError={() => setPhotoIsAvailable(false)}
                      />
                    ) : <span aria-label="No profile photo selected">＋</span>}
                  </div>
                  <div className="dashboard-photo-controls">
                    <strong>Profile Photo</strong>
                    <p>Use a public image URL or upload a JPEG, PNG, or WebP image up to 5 MB.</p>
                    <label className="dashboard-cancel-button dashboard-photo-select">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          setSelectedPhoto(event.target.files?.[0] ?? null)
                          setPhotoIsAvailable(true)
                        }}
                      />
                    </label>
                    {selectedPhoto && <span className="dashboard-draft-label">{selectedPhoto.name}</span>}
                  </div>
                </div>

                <div className="dashboard-edit-grid">
                  {fields.map((field) => (
                    <div className={`dashboard-edit-field${field.wide ? ' is-wide' : ''}`} key={field.name}>
                      <label htmlFor={`portfolio-${field.name}`}>{field.label}</label>
                      {field.multiline ? (
                        <textarea
                          id={`portfolio-${field.name}`}
                          name={field.name}
                          rows={5}
                          value={values[field.name] ?? ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <input
                          id={`portfolio-${field.name}`}
                          name={field.name}
                          type={field.type || 'text'}
                          min={field.type === 'number' ? 1900 : undefined}
                          max={field.type === 'number' ? 2200 : undefined}
                          step={field.type === 'number' ? 1 : undefined}
                          value={values[field.name] ?? ''}
                          onChange={handleChange}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {status && (
                  <p className={`dashboard-save-message is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
                    {status.message}
                  </p>
                )}

                <div className="dashboard-form-footer">
                  <div className="dashboard-resume-actions">
                    <button className="dashboard-primary-button" type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving…' : hasRecord ? 'Update Details' : 'Save Details'}
                    </button>
                    <button className="dashboard-cancel-button" type="button" onClick={resetForm} disabled={isSaving}>
                      Reset
                    </button>
                    <a className="dashboard-view-site" href="/">Preview Portfolio <span aria-hidden="true">↗</span></a>
                  </div>
                  <span className="dashboard-draft-label">Saved directly to Supabase</span>
                </div>
              </form>
            )}
          </section>
          <p className="dashboard-temp-notice">
            <span aria-hidden="true">i</span>
            Admin editing is public and does not require sign-in. Anyone who visits this page may change portfolio details.
          </p>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
