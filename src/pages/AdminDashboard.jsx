import { useEffect, useMemo, useRef, useState } from 'react'

import profilePlaceholder from '../assets/profile-placeholder.svg'
import ThemeToggle from '../components/ThemeToggle.jsx'
import {
  addAchievement,
  addEducation,
  addProject,
  addSkill,
  deleteAchievement,
  deleteProject,
  deleteSkill,
  getAbout,
  getAchievements,
  getContact,
  getEducation,
  getPortfolio,
  getProfile,
  getProjects,
  getResume,
  getSkills,
  readFileAsDataUrl,
  updateAbout,
  updateAchievement,
  updateContact,
  updateEducation,
  updateProfile,
  updateProject,
  updateResume,
  updateSkill,
} from '../services/portfolioStorage.js'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'about', label: 'About', icon: '◌' },
  { id: 'skills', label: 'Skills', icon: '⌘' },
  { id: 'projects', label: 'Projects', icon: '▦' },
  { id: 'education', label: 'Education', icon: '▤' },
  { id: 'achievements', label: 'Achievements', icon: '✳' },
  { id: 'resume', label: 'Resume', icon: '▧' },
  { id: 'contact', label: 'Contact', icon: '✉' },
]

const sections = {
  profile: {
    title: 'Profile',
    description: 'Manage the information displayed on your Home and About sections.',
    singular: true,
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'title', label: 'Professional title', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'location', label: 'Location' },
      { name: 'linkedIn', label: 'LinkedIn URL', type: 'url' },
      { name: 'github', label: 'GitHub URL', type: 'url' },
      { name: 'introduction', label: 'Introduction', multiline: true },
    ],
  },
  contact: {
    title: 'Contact',
    description: 'Edit the contact information displayed on your public Contact section.',
    singular: true,
    fields: [
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'location', label: 'Location' },
    ],
  },
  about: {
    title: 'About',
    description: 'Manage the information displayed in your public About section.',
    singular: true,
    fields: [
      { name: 'aboutMe', label: 'About Me', multiline: true },
      { name: 'careerGoal', label: 'Career Goal', multiline: true },
      { name: 'areasOfInterest', label: 'Areas of Interest', multiline: true, list: true },
      { name: 'currentlyLearning', label: 'Currently Learning', multiline: true, list: true },
    ],
  },
  skills: {
    title: 'Skills',
    description: 'Add only the skills you want to show on your public portfolio.',
    fields: [
      { name: 'name', label: 'Skill name', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Programming', 'AI & Machine Learning', 'Web Development', 'Database', 'Tools', 'Other'] },
    ],
  },
  projects: {
    title: 'Projects',
    description: 'Add your real projects; saved projects appear on the public Projects section.',
    fields: [
      { name: 'title', label: 'Project name', required: true },
      { name: 'description', label: 'Project description', multiline: true },
      { name: 'technologies', label: 'Technologies', multiline: true, list: true },
      { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { name: 'demoUrl', label: 'Live demo URL', type: 'url' },
      { name: 'imageAlt', label: 'Project image description' },
    ],
    file: { field: 'imageUrl', label: 'Project image', accept: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 1024 * 1024, sizeLabel: '1 MB' },
  },
  education: {
    title: 'Education',
    description: 'Manage the degrees, courses, and academic details shown publicly.',
    fields: [
      { name: 'degree', label: 'Degree or course', required: true },
      { name: 'specialization', label: 'Specialization' },
      { name: 'institution', label: 'College or university', required: true },
      { name: 'startYear', label: 'Start year', required: true },
      { name: 'endYear', label: 'Expected completion / end year', required: true },
      { name: 'currentStatus', label: 'Current status' },
    ],
  },
  achievements: {
    title: 'Achievements',
    description: 'Add actual achievements; no example achievements are prefilled.',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'organization', label: 'Organization' },
      { name: 'year', label: 'Year' },
      { name: 'type', label: 'Type', type: 'select', required: true, options: ['Certificate', 'Hackathon', 'Award', 'Competition', 'Workshop', 'Course'] },
      { name: 'description', label: 'Description', multiline: true },
      { name: 'certificateUrl', label: 'Certificate link or image URL', type: 'url' },
    ],
    file: { field: 'certificateUrl', label: 'Certificate image', accept: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 1024 * 1024, sizeLabel: '1 MB' },
  },
}

const sectionReaders = {
  profile: () => [getProfile()],
  contact: () => [getContact()],
  about: () => [getAbout()],
  skills: getSkills,
  projects: getProjects,
  education: getEducation,
  achievements: getAchievements,
  resume: () => [getResume()].filter(Boolean),
}

const sectionActions = {
  skills: { add: addSkill, update: updateSkill, remove: deleteSkill },
  projects: { add: addProject, update: updateProject, remove: deleteProject },
  education: { add: addEducation, update: updateEducation },
  achievements: { add: addAchievement, update: updateAchievement, remove: deleteAchievement },
}

const summarySections = [
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'skills', label: 'Skills', icon: '⌘' },
  { id: 'projects', label: 'Projects', icon: '▦' },
  { id: 'education', label: 'Education', icon: '▤' },
  { id: 'achievements', label: 'Achievements', icon: '✳' },
  { id: 'resume', label: 'Resume', icon: '▧' },
  { id: 'contact', label: 'Contact', icon: '✉' },
]

function getTitle(record, section) {
  if (section === 'skills') return record.name
  if (section === 'education') return record.degree
  return record.title || 'Portfolio content'
}

function getSummary(record, section) {
  if (section === 'skills') return record.category
  if (section === 'projects') return record.description || (record.technologies || []).join(', ')
  if (section === 'education') return `${record.institution} · ${record.specialization || record.currentStatus || ''}`
  if (section === 'achievements') return `${record.type} · ${record.organization || ''} ${record.year || ''}`.trim()
  return ''
}

function initialFieldValue(field, record) {
  const value = record?.[field.name]
  return field.list ? (Array.isArray(value) ? value.join('\n') : '') : field.name === 'technologies'
    ? (Array.isArray(value) ? value.join(', ') : '')
    : value ?? ''
}

function AdminDashboard({ path }) {
  const activeSection = path.split('/')[2] || 'dashboard'
  const currentSection = sections[activeSection]
  const [records, setRecords] = useState([])
  const [isEditorOpen, setIsEditorOpen] = useState(() => new URLSearchParams(window.location.search).get('action') === 'new')
  const [editingRecord, setEditingRecord] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [resume, setResume] = useState(() => getResume())
  const [photoPreview, setPhotoPreview] = useState('')
  const previousSection = useRef(activeSection)

  const profile = useMemo(() => getProfile(), [refreshVersion])
  const summaryCounts = useMemo(() => {
    const data = getPortfolio()
    return {
      profile: 1,
      skills: data.skills.length,
      projects: data.projects.length,
      education: data.education.length,
      achievements: data.achievements.length,
      resume: data.resume ? 1 : 0,
      contact: 1,
    }
  }, [refreshVersion])
  const activeLabel = navigation.find(({ id }) => id === activeSection)?.label || 'Dashboard'

  useEffect(() => {
    const sectionChanged = previousSection.current !== activeSection
    previousSection.current = activeSection
    try {
      setRecords(sectionReaders[activeSection]?.() ?? [])
      if (activeSection === 'resume') setResume(getResume())
      setStatus(null)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Saved portfolio data could not be loaded.' })
    }
    if (sectionChanged) {
      setIsEditorOpen(false)
      setEditingRecord(null)
      setSelectedFile(null)
      setMobileMenuOpen(false)
    }

    if (new URLSearchParams(window.location.search).get('action') === 'new' && sections[activeSection] && !sections[activeSection].singular) {
      setEditingRecord(null)
      setFormValues(Object.fromEntries(sections[activeSection].fields.map((field) => [field.name, ''])))
      setIsEditorOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [activeSection])

  useEffect(() => {
    if (!selectedFile || activeSection !== 'profile') {
      setPhotoPreview('')
      return undefined
    }
    const url = URL.createObjectURL(selectedFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [activeSection, selectedFile])

  function beginEdit(record = null) {
    setEditingRecord(record)
    setFormValues(Object.fromEntries((currentSection?.fields || []).map((field) => [
      field.name,
      initialFieldValue(field, record),
    ])))
    setSelectedFile(null)
    setIsEditorOpen(true)
    setStatus(null)
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setStatus(null)
    try {
      const payload = Object.fromEntries((currentSection?.fields || []).map((field) => {
        const value = formValues[field.name] ?? ''
        if (field.list || field.name === 'technologies') {
          return [field.name, value.split(/\r?\n|,/).map((part) => part.trim()).filter(Boolean)]
        }
        return [field.name, value.trim()]
      }))
      if (selectedFile && activeSection === 'profile') {
        payload.photo = await readFileAsDataUrl(selectedFile, {
          maxBytes: 1024 * 1024,
          acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
          label: 'Profile photo',
        })
      } else if (selectedFile && currentSection.file) {
        payload[currentSection.file.field] = await readFileAsDataUrl(selectedFile, {
          maxBytes: currentSection.file.maxBytes,
          acceptedTypes: currentSection.file.accept,
          label: currentSection.file.label,
        })
      }

      if (activeSection === 'profile') updateProfile(payload)
      else if (activeSection === 'contact') updateContact(payload)
      else if (activeSection === 'about') updateAbout(payload)
      else if (editingRecord) sectionActions[activeSection].update(editingRecord.id, payload)
      else sectionActions[activeSection].add(payload)

      setRecords(sectionReaders[activeSection]())
      setRefreshVersion((version) => version + 1)
      setIsEditorOpen(false)
      setEditingRecord(null)
      setSelectedFile(null)
      setStatus({ type: 'success', message: `${currentSection.title} ${editingRecord ? 'updated' : 'saved'} successfully.` })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save changes. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  function handleDelete(record) {
    const label = getTitle(record, activeSection)
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return
    try {
      sectionActions[activeSection].remove(record.id)
      setRecords(sectionReaders[activeSection]())
      setRefreshVersion((version) => version + 1)
      setStatus({ type: 'success', message: `${currentSection.title.slice(0, -1)} deleted successfully.` })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to delete this item.' })
    }
  }

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus({ type: 'error', message: 'Choose a PDF file for your resume.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'The resume PDF must be 2 MB or smaller for browser storage.' })
      return
    }
    setIsSaving(true)
    setStatus(null)
    try {
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer())
      if (signature !== '%PDF-') throw new Error('The selected file is not a valid PDF.')
      const dataUrl = await readFileAsDataUrl(file, {
        maxBytes: 2 * 1024 * 1024,
        acceptedTypes: ['application/pdf'],
        label: 'Resume PDF',
      })
      updateResume({ name: file.name, dataUrl })
      setResume(getResume())
      setRefreshVersion((version) => version + 1)
      setStatus({ type: 'success', message: 'Resume uploaded successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save the resume.' })
    } finally {
      setIsSaving(false)
    }
  }

  function handleResumeDelete() {
    if (!window.confirm('Delete the current resume?')) return
    try {
      updateResume(null)
      setResume(null)
      setRefreshVersion((version) => version + 1)
      setStatus({ type: 'success', message: 'Resume deleted successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to delete the resume.' })
    }
  }

  return (
    <div className="admin-dashboard">
      <aside className={`dashboard-sidebar${mobileMenuOpen ? ' is-mobile-open' : ''}`}>
        <a className="dashboard-brand" href="/" aria-label="Return to portfolio">
          M<span>.</span><small>M SHANMUKHA SAI</small>
        </a>
        <p className="dashboard-nav-label">PORTFOLIO</p>
        <nav className="dashboard-nav" aria-label="Admin dashboard">
          {navigation.map(({ id, label, icon }) => (
            <a
              className={`dashboard-nav-item${activeSection === id ? ' is-active' : ''}`}
              href={`/admin/${id}`}
              key={id}
              aria-current={activeSection === id ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user">
            <span className="dashboard-avatar">MS</span>
            <span><strong>M Shanmukha Sai</strong><small>Local editor</small></span>
          </div>
          <a className="dashboard-logout" href="/"><span className="dashboard-nav-icon" aria-hidden="true">↗</span>Back to website</a>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-mobile-menu"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >☰</button>
          <div><p className="dashboard-breadcrumb">PORTFOLIO / {activeLabel.toUpperCase()}</p><h1>{activeLabel.toUpperCase()}</h1></div>
          <div className="dashboard-topbar-actions"><ThemeToggle /><a className="dashboard-view-site" href="/">View Site <span aria-hidden="true">↗</span></a></div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'dashboard' ? (
            <>
              <div className="dashboard-welcome">
                <div><p className="eyebrow">PORTFOLIO EDITOR</p><h2>Welcome, M Shanmukha Sai</h2><p>Manage your portfolio details from one place.</p></div>
                <a className="dashboard-primary-button" href="/">View Site <span aria-hidden="true">↗</span></a>
              </div>
              <div className="dashboard-summary-grid dashboard-summary-grid-seven">
                {summarySections.map(({ id, label, icon }) => (
                  <a className="dashboard-summary-card" href={`/admin/${id}`} key={id}>
                    <div className="dashboard-summary-top"><span>{label}</span><span className="dashboard-nav-icon">{icon}</span></div>
                    <strong>{summaryCounts[id]}</strong><small>{id === 'resume' ? 'Saved resume' : 'Manage portfolio details'}</small>
                  </a>
                ))}
              </div>
              <section className="dashboard-overview-panel">
                <div className="dashboard-panel-heading"><h3>Quick actions</h3><p>Jump directly to a portfolio editor.</p></div>
                <div className="dashboard-quick-links">
                  {[['Add Project', 'projects'], ['Add Skill', 'skills'], ['Add Achievement', 'achievements'], ['Edit Profile', 'profile']].map(([label, section]) => (
                    <a href={`/admin/${section}${section === 'profile' ? '' : '?action=new'}`} key={section}><span>{label}</span><span aria-hidden="true">↗</span></a>
                  ))}
                </div>
              </section>
              <p className="dashboard-temp-notice"><span aria-hidden="true">i</span>This is a client-side editor. Anyone who can access this browser can change its local portfolio data; it does not protect sensitive or private information.</p>
            </>
          ) : activeSection === 'resume' ? (
            <section className="dashboard-editor-panel">
              <div className="dashboard-panel-heading"><p className="eyebrow">PORTFOLIO CONTENT</p><h2>Resume</h2><p>Upload or replace the PDF shown on your public Resume section.</p></div>
              {resume && <div className="dashboard-resume-actions"><p>Current resume: <a href={resume.dataUrl} target="_blank" rel="noreferrer">{resume.name} ↗</a></p></div>}
              <div className="dashboard-resume-actions">
                <label className="dashboard-primary-button dashboard-file-button">{isSaving ? 'Saving…' : resume ? 'Replace Resume' : 'Upload Resume'}
                  <input type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} disabled={isSaving} />
                </label>
                {resume && <button className="dashboard-cancel-button" type="button" onClick={handleResumeDelete} disabled={isSaving}>Delete Resume</button>}
                <span className="dashboard-draft-label">PDF only · Up to 2 MB</span>
              </div>
              {status && <p className={`dashboard-save-message is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
            </section>
          ) : (
            <section className="dashboard-editor-panel">
              <div className="dashboard-panel-heading dashboard-record-heading">
                <div><p className="eyebrow">PORTFOLIO CONTENT</p><h2>{currentSection?.title}</h2><p>{currentSection?.description}</p></div>
                <button className="dashboard-primary-button" type="button" onClick={() => beginEdit(currentSection?.singular ? records[0] ?? {} : null)}>
                  {currentSection?.singular ? 'Edit' : 'Add new'} <span aria-hidden="true">＋</span>
                </button>
              </div>
              {status && <p className={`dashboard-save-message is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
              {isEditorOpen && currentSection && (
                <form className="dashboard-edit-form" onSubmit={handleSave}>
                  <div className="dashboard-form-title"><h3>{editingRecord || currentSection.singular ? 'Edit' : 'Add'} {currentSection.title.toLowerCase()}</h3><button className="dashboard-cancel-button" type="button" onClick={() => setIsEditorOpen(false)} disabled={isSaving}>Cancel</button></div>
                  {activeSection === 'profile' && (
                    <div className="dashboard-photo-manager">
                      <div className="dashboard-photo-preview"><img src={photoPreview || profile.photo || profilePlaceholder} alt="Current profile" onError={(event) => { event.currentTarget.src = profilePlaceholder }} /></div>
                      <div className="dashboard-photo-controls"><strong>Current Profile Photo</strong><p>JPEG, PNG, or WebP · Up to 1 MB</p><label className="dashboard-cancel-button dashboard-photo-select">Change Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label></div>
                    </div>
                  )}
                  {currentSection.file && (
                    <div className="dashboard-photo-manager">
                      <div className="dashboard-photo-controls"><strong>{currentSection.file.label}</strong><p>Accepted image formats · Up to {currentSection.file.sizeLabel}</p><label className="dashboard-cancel-button dashboard-photo-select">Choose Image<input type="file" accept={currentSection.file.accept.join(',')} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /></label>{selectedFile && <p>{selectedFile.name}</p>}</div>
                    </div>
                  )}
                  <div className="dashboard-edit-grid">
                    {currentSection.fields.map((field) => (
                      <div className={`dashboard-edit-field${field.multiline ? ' is-wide' : ''}`} key={field.name}>
                        <label htmlFor={`draft-${field.name}`}>{field.label}</label>
                        {field.type === 'select' ? <select id={`draft-${field.name}`} name={field.name} value={formValues[field.name] ?? field.options[0]} onChange={handleFieldChange} required={field.required}>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
                          : field.multiline ? <textarea id={`draft-${field.name}`} name={field.name} rows={5} value={formValues[field.name] ?? ''} onChange={handleFieldChange} required={field.required} />
                            : <input id={`draft-${field.name}`} name={field.name} type={field.type ?? 'text'} value={formValues[field.name] ?? ''} onChange={handleFieldChange} required={field.required} />}
                        {field.list && <small>Enter one item per line.</small>}
                      </div>
                    ))}
                  </div>
                  <div className="dashboard-form-footer"><span className="dashboard-draft-label"><span /> Saves in this browser</span><button className="dashboard-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Changes'} <span aria-hidden="true">↗</span></button></div>
                </form>
              )}
              {records.length > 0 && !currentSection?.singular && (
                <div className="dashboard-record-list">{records.map((record) => (
                  <article className="dashboard-record" key={record.id}>
                    <div className="dashboard-record-copy"><h3>{getTitle(record, activeSection)}</h3><p>{getSummary(record, activeSection)}</p></div>
                    <div className="dashboard-record-actions"><button type="button" onClick={() => beginEdit(record)}>Edit</button><button className="is-delete" type="button" onClick={() => handleDelete(record)}>Delete</button></div>
                  </article>
                ))}</div>
              )}
              {!isEditorOpen && !records.length && (
                <div className="dashboard-empty-state"><span aria-hidden="true">▤</span><h3>No {currentSection?.title.toLowerCase()} added yet</h3><p>{activeSection === 'achievements' ? 'Achievements and certifications will be added soon.' : 'Add your first details to show them on the public portfolio.'}</p></div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
