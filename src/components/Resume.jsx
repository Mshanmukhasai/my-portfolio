import { isConfiguredEmail, isConfiguredExternalLink } from '../lib/links.js'

function Resume({ profile, education: educationRecords, skills, resumeUrl }) {
  const fileAvailable = Boolean(resumeUrl)
  const linksDisabled = !fileAvailable

  return (
    <section id="resume" className="resume-section" aria-labelledby="resume-title">
      <div className="resume-heading">
        <p className="eyebrow">Experience, at a glance</p>
        <h2 id="resume-title">Resume<span>.</span></h2>
        <p className="resume-intro">{profile.introduction}</p>
      </div>

      <div className="resume-sheet">
        <header className="resume-profile">
          <div>
            <p className="resume-kicker">CURRICULUM VITAE</p>
            <h3>{profile.name}</h3>
            <p className="resume-role">{profile.title}</p>
          </div>
          <address className="resume-contact">
            {isConfiguredEmail(profile.email) && <p><span>Email</span>{profile.email}</p>}
            {profile.phone && <p><span>Phone</span>{profile.phone}</p>}
            {profile.location && <p><span>Location</span>{profile.location}</p>}
            {isConfiguredExternalLink(profile.linkedIn) && <p><span>LinkedIn</span>{profile.linkedIn}</p>}
            {isConfiguredExternalLink(profile.github) && <p><span>GitHub</span>{profile.github}</p>}
          </address>
        </header>

        <div className="resume-content-grid">
          <div className="resume-main-column">
            <section className="resume-block" aria-labelledby="resume-education-title">
              <h4 id="resume-education-title">Education</h4>
              {educationRecords.map((item) => (
                <article className="resume-entry" key={`${item.degree}-${item.institution}`}>
                  <div className="resume-entry-heading">
                    <h5>{item.degree}</h5>
                    <span>{item.startYear ?? item.start_year} — {item.endYear ?? item.end_year}</span>
                  </div>
                  <p className="resume-entry-organization">{item.institution}</p>
                  <p>{item.specialization}</p>
                </article>
              ))}
            </section>
          </div>

          <aside className="resume-sidebar">
            <section className="resume-block" aria-labelledby="resume-skills-title">
              <h4 id="resume-skills-title">Skills</h4>
              <ul className="resume-skills">
                {skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <div className="resume-actions">
        <a
          className={`hero-button hero-button-primary${linksDisabled ? ' is-disabled' : ''}`}
          href={fileAvailable ? resumeUrl : undefined}
          download={fileAvailable ? 'resume.pdf' : undefined}
          aria-disabled={linksDisabled}
          onClick={(event) => linksDisabled && event.preventDefault()}
        >
          Download Resume <span aria-hidden="true">↓</span>
        </a>
        <a
          className={`hero-button hero-button-secondary${linksDisabled ? ' is-disabled' : ''}`}
          href={fileAvailable ? resumeUrl : undefined}
          target={fileAvailable ? '_blank' : undefined}
          rel={fileAvailable ? 'noreferrer' : undefined}
          aria-disabled={linksDisabled}
          onClick={(event) => linksDisabled && event.preventDefault()}
        >
          View Resume <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="resume-file-message" role="status">
        {!fileAvailable && <>The PDF isn’t uploaded yet. Upload a resume from the <a href="/admin/resume">admin dashboard</a> to enable viewing and downloading.</>}
      </p>
    </section>
  )
}

export default Resume
