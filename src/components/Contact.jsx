import { useState } from 'react'

import { isConfiguredEmail, isConfiguredExternalLink } from '../lib/links.js'

const initialForm = { name: '', email: '', subject: '', message: '', company_website: '' }

function Contact({ profile }) {
  const [values, setValues] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((currentValues) => ({ ...currentValues, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
    setStatus(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const nextErrors = {}
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const subject = String(formData.get('subject') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()

    if (name.length < 2) nextErrors.name = 'Please enter your name (at least 2 characters).'
    if (!form.elements.email.validity.valid || !email) {
      nextErrors.email = 'Please enter a valid email address.'
    }
    if (subject.length < 3) nextErrors.subject = 'Please enter a subject (at least 3 characters).'
    if (message.length < 10) nextErrors.message = 'Please enter a message of at least 10 characters.'

    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) {
      setStatus({ type: 'error', message: 'Please correct the highlighted fields and try again.' })
      form.elements[firstInvalidField].focus()
      return
    }

    if (String(formData.get('company_website') ?? '').trim()) return
    const subjectLine = encodeURIComponent(subject)
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nReply to: ${email}`)
    window.location.href = `mailto:${profile.email}?subject=${subjectLine}&body=${body}`
    setStatus({ type: 'success', message: 'Your email app should open with your message ready to send.' })
  }

  return (
    <section id="contact" className="contact-section" aria-labelledby="contact-title">
      <div className="contact-heading">
        <p className="eyebrow">Have something in mind?</p>
        <h2 id="contact-title">Let&apos;s make it<br /><span>mean something.</span></h2>
        <p>Have a project, question, or opportunity in mind? I&apos;d love to hear from you.</p>
      </div>

      <div className="contact-layout">
        <aside className="contact-details" aria-label="Contact details">
          <p className="contact-details-intro">A few ways to get in touch.</p>
          {isConfiguredEmail(profile.email) && (
            <a className="contact-detail" href={`mailto:${profile.email}`}>
              <span className="contact-detail-label">Email</span>
              <span>{profile.email}</span>
              <span className="contact-detail-arrow" aria-hidden="true">↗</span>
            </a>
          )}
          {profile.phone && (
            <a className="contact-detail" href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`}>
              <span className="contact-detail-label">Phone</span>
              <span>{profile.phone}</span>
              <span className="contact-detail-arrow" aria-hidden="true">↗</span>
            </a>
          )}
          {isConfiguredExternalLink(profile.linkedIn) && (
            <a className="contact-detail" href={profile.linkedIn} target="_blank" rel="noreferrer">
              <span className="contact-detail-label">LinkedIn</span>
              <span>Connect with me</span>
              <span className="contact-detail-arrow" aria-hidden="true">↗</span>
            </a>
          )}
          {isConfiguredExternalLink(profile.github) && (
            <a className="contact-detail" href={profile.github} target="_blank" rel="noreferrer">
              <span className="contact-detail-label">GitHub</span>
              <span>Explore my work</span>
              <span className="contact-detail-arrow" aria-hidden="true">↗</span>
            </a>
          )}
        </aside>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-honeypot" aria-hidden="true">
            <label htmlFor="contact-company-website">Leave this field empty</label>
            <input
              autoComplete="off"
              id="contact-company-website"
              name="company_website"
              tabIndex="-1"
              value={values.company_website ?? ''}
              onChange={handleChange}
            />
          </div>
          <div className="contact-form-row">
            <div className="contact-field">
              <label htmlFor="contact-name">Name</label>
              <input
                autoComplete="name"
                id="contact-name"
                name="name"
                value={values.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
                required
              />
              {errors.name && <span className="contact-field-error" id="contact-name-error">{errors.name}</span>}
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email</label>
              <input
                autoComplete="email"
                id="contact-email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                required
              />
              {errors.email && <span className="contact-field-error" id="contact-email-error">{errors.email}</span>}
            </div>
          </div>
          <div className="contact-field">
            <label htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
              required
            />
            {errors.subject && <span className="contact-field-error" id="contact-subject-error">{errors.subject}</span>}
          </div>
          <div className="contact-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows="5"
              value={values.message}
              onChange={handleChange}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
              required
            />
            {errors.message && <span className="contact-field-error" id="contact-message-error">{errors.message}</span>}
          </div>
          <button className="contact-submit" type="submit">
            Send Message <span aria-hidden="true">↗</span>
          </button>
          {status && (
            <p className={`contact-form-status is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

export default Contact
