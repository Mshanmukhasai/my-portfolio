import { useState } from 'react'

import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'
import Contact from '../components/Contact.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import Resume from '../components/Resume.jsx'
import profilePlaceholder from '../assets/profile-placeholder.svg'
import usePortfolioData from '../hooks/usePortfolioData.js'
import { isConfiguredExternalLink } from '../lib/links.js'

const categoryIcons = {
  Programming: 'code',
  'Web Development': 'web',
  'AI & Machine Learning': 'ai',
  'AI / ML': 'ai',
  Database: 'database',
  Tools: 'tools',
}

function Home() {
  const { profile, about, skills, skillNames, projects, education, achievements, resumeUrl, storageError } = usePortfolioData()
  const [activeProjectCategory, setActiveProjectCategory] = useState('All')
  const visibleProjects = activeProjectCategory === 'All'
    ? projects
    : projects.filter((project) => project.category === activeProjectCategory)
  const skillsByCategory = Array.from(
    skills.reduce((groupedSkills, skill) => {
      const category = skill.category || 'General'
      if (!groupedSkills.has(category)) groupedSkills.set(category, [])
      groupedSkills.get(category).push(skill.name)
      return groupedSkills
    }, new Map()),
    ([title, categorySkills]) => ({
      title,
      icon: categoryIcons[title] ?? 'tools',
      skills: categorySkills,
    }),
  )
  const availableProjectCategories = [
    'All',
    ...new Set(projects.map(({ category }) => category).filter(Boolean)),
  ]
  const displayedAboutCards = [
    { id: 'about-me', number: '01', title: 'About Me', description: about.aboutMe || profile.introduction, className: 'about-card-wide' },
    { id: 'career-goal', number: '02', title: 'Career Goal', description: about.careerGoal, className: '' },
    { id: 'areas-of-interest', number: '03', title: 'Areas of Interest', items: about.areasOfInterest, className: '' },
    { id: 'currently-learning', number: '04', title: 'Currently Learning', items: about.currentlyLearning, className: '' },
  ].filter((card) => card.id === 'about-me' || card.description || card.items?.length)

  return (
    <div className="page-shell">
      <div className="content-wrap">
        <Header />

        <main>
          {storageError && <p className="portfolio-api-notice" role="alert">{storageError}</p>}
          <section id="home" className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="hero-greeting">Hello, I&apos;m</p>
              <h1 id="hero-title" className="hero-name">{profile.name}<span>.</span></h1>
              <p className="hero-title">{profile.title}</p>
              <p className="hero-description">{profile.introduction}</p>
              <div className="hero-actions">
                <a className="hero-button hero-button-primary" href="#projects">
                  View My Projects <span aria-hidden="true">↗</span>
                </a>
                <a className="hero-button hero-button-secondary" href="#resume">
                  Download Resume <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="hero-socials" aria-label="Social profiles">
                {isConfiguredExternalLink(profile.linkedIn) && (
                  <a href={profile.linkedIn} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5.2 3.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM3.7 9h3v11.2h-3V9Zm5 0h2.9v1.5h.1c.4-.8 1.5-1.8 3.2-1.8 3.4 0 4 2.2 4 5.1v6.4h-3v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8h-3V9Z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}
                {isConfiguredExternalLink(profile.github) && (
                  <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.6-.2.6-.4v-1.7c-2.4.5-2.9-1-2.9-1-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.7.1-.6.3-1 .6-1.2-1.9-.2-3.9-1-3.9-4.2 0-.9.3-1.6.9-2.2-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.3.8a8 8 0 0 1 4.2 0c1.6-1 2.3-.8 2.3-.8.5 1.1.2 2 .1 2.2.6.6.9 1.3.9 2.2 0 3.2-2 4-3.9 4.2.3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4A9.3 9.3 0 0 0 12 2.8Z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>

            <div className="hero-profile">
              <div className="profile-orbit profile-orbit-one" />
              <div className="profile-orbit profile-orbit-two" />
              <div className="profile-photo-frame">
                <img
                  className="profile-photo"
                  src={profile.photo}
                  alt={`${profile.name} profile portrait`}
                  onError={(event) => {
                    if (event.currentTarget.src !== profilePlaceholder) {
                      event.currentTarget.src = profile.photoFallback || profilePlaceholder
                    }
                  }}
                />
              </div>
              <div className="profile-badge">
                <span className="profile-badge-dot" />
                <span>Building what&apos;s next</span>
              </div>
              <span className="profile-caption">CREATIVE TECHNOLOGY · HUMAN FIRST</span>
            </div>
          </section>

          <section id="projects" className="work-section" aria-labelledby="work-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">A collection of things I’ve built</p>
                <h2 id="work-title">Selected projects<span>.</span></h2>
              </div>
              <p className="section-aside">Curiosity, craft, and<br />a little bit of code.</p>
            </div>
            <div className="project-filters" aria-label="Filter projects by category">
              {availableProjectCategories.map((category) => (
                <button
                  key={category}
                  className={`project-filter${activeProjectCategory === category ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={activeProjectCategory === category}
                  onClick={() => setActiveProjectCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="project-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.number} project={project} />
              ))}
            </div>
            {!projects.length && <p className="achievement-empty-state">Projects will appear here when you add them from the dashboard.</p>}
          </section>

          <section id="about" className="about-section" aria-labelledby="about-title">
            <div className="about-intro">
              <img
                className="about-profile-photo"
                src={profile.photo}
                alt={`${profile.name} profile portrait`}
                onError={(event) => {
                  if (event.currentTarget.src !== profilePlaceholder) {
                    event.currentTarget.src = profile.photoFallback || profilePlaceholder
                  }
                }}
              />
              <div className="about-section-heading">
                <p className="eyebrow">A little context</p>
                <h2 id="about-title">The person behind the work<span>.</span></h2>
                <p>My background, what I care about, and where I’m headed.</p>
              </div>
            </div>
            <div className="about-card-grid">
              {displayedAboutCards.map(({ id, number, title, description, items, className }) => (
                <article key={id} id={id} className={`about-card ${className}`}>
                  <div className="about-card-topline">
                    <span className="about-card-number">{number}</span>
                    <span className="about-card-mark" aria-hidden="true">↗</span>
                  </div>
                  <h3>{title}</h3>
                  {description && <p>{description}</p>}
                  {items?.length > 0 && (
                    <ul className="about-card-tags">
                      {items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </div>
            {!skills.length && <p className="achievement-empty-state">Add your skills from the dashboard to display them here.</p>}
            <a className="hero-button hero-button-primary about-resume-button" href="#resume">
              Download Resume <span aria-hidden="true">↓</span>
            </a>
          </section>

          <section id="skills" className="details-section" aria-labelledby="skills-title">
            <div className="skills-section-heading">
              <div>
                <p className="eyebrow">Technologies and tools</p>
                <h2 id="skills-title">Skills<span>.</span></h2>
              </div>
              <p>Tools I use to explore ideas and turn them into useful things.</p>
            </div>
            <div className="skills-grid">
              {skillsByCategory.map(({ title, icon, skills: categorySkills }) => (
                <article className="skill-category-card" key={title}>
                  <div className={`skill-category-icon skill-icon-${icon}`} aria-hidden="true">
                    {icon === 'code' && (
                      <svg viewBox="0 0 24 24">
                        <path d="m8 7-5 5 5 5M16 7l5 5-5 5m-2-12-4 14" />
                      </svg>
                    )}
                    {icon === 'web' && (
                      <svg viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18M7 6.5h.01M10 6.5h.01M8 13l-2 2 2 2m4 0 2-2-2-2" />
                      </svg>
                    )}
                    {icon === 'ai' && (
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="2.5" />
                        <circle cx="5" cy="6" r="1.5" />
                        <circle cx="19" cy="6" r="1.5" />
                        <circle cx="5" cy="18" r="1.5" />
                        <circle cx="19" cy="18" r="1.5" />
                        <path d="m7 7 3.2 3.2m6.8-3.2-3.2 3.2M7 17l3.2-3.2m6.8 3.2-3.2-3.2" />
                      </svg>
                    )}
                    {icon === 'database' && (
                      <svg viewBox="0 0 24 24">
                        <ellipse cx="12" cy="5" rx="8" ry="3" />
                        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                      </svg>
                    )}
                    {icon === 'tools' && (
                      <svg viewBox="0 0 24 24">
                        <path d="M14 6a5 5 0 0 0-6.5 6.5L3 17l4 4 4.5-4.5A5 5 0 0 0 18 10l-3 3-4-4 3-3Z" />
                        <path d="m15 15 5 5" />
                      </svg>
                    )}
                  </div>
                  <h3>{title}</h3>
                  <ul className="skill-items">
                    {categorySkills.map((skill) => (
                      <li key={skill}>
                        <span className="skill-item-marker" aria-hidden="true" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section id="education" className="profile-details-section" aria-labelledby="education-title">
            <div className="profile-section-heading">
              <div>
                <p className="eyebrow">Learning and growing</p>
                <h2 id="education-title">Education<span>.</span></h2>
              </div>
              <p>Your academic background and study timeline.</p>
            </div>
            <div className="education-list">
              {education.map((item) => (
                <article className="education-card"                 key={item.id ?? `${item.degree}-${item.institution}`}>
                  <div className="education-card-timeline" aria-hidden="true">
                    <span />
                  </div>
                  <div className="education-card-content">
                    <p className="education-years">{item.startYear} — {item.endYear}</p>
                    <h3>{item.degree}</h3>
                    <p className="education-institution">{item.institution}</p>
                    <p className="education-specialization">
                      <span>Specialization</span>{item.specialization}
                    </p>
                    {item.currentStatus && <p className="education-specialization"><span>Status</span>{item.currentStatus}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="achievements" className="profile-details-section achievements-section" aria-labelledby="achievements-title">
            <div className="profile-section-heading">
              <div>
                <p className="eyebrow">Milestones along the way</p>
                <h2 id="achievements-title">Achievements<span>.</span></h2>
              </div>
              <p>Certificates, events, and experiences worth remembering.</p>
            </div>
            {achievements.length ? <div className="achievement-grid">
              {achievements.map((achievement) => (
                <article
                  className="achievement-card"
                  key={achievement.id ?? `${achievement.type}-${achievement.title}`}
                  aria-label={`${achievement.type}: ${achievement.title}`}
                >
                  <div className="achievement-card-topline">
                    <span className="achievement-type">{achievement.type}</span>
                    <span className="achievement-year">{achievement.year}</span>
                  </div>
                  <h3>{achievement.title}</h3>
                  <p className="achievement-organization">{achievement.organization}</p>
                  <p className="achievement-details">{achievement.details}</p>
                  {achievement.certificateUrl && (
                    <a className="achievement-certificate-link" href={achievement.certificateUrl} target="_blank" rel="noreferrer">
                      View certificate <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </article>
              ))}
            </div> : <p className="achievement-empty-state">Achievements and certifications will be added soon.</p>}
          </section>

          <Resume profile={profile} education={education} skills={skillNames} resumeUrl={resumeUrl} />

          <Contact profile={profile} />
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default Home
