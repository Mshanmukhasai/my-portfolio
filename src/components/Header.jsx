import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'

const navigation = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Skills', id: 'skills' },
  { label: 'Projects', id: 'projects' },
  { label: 'Education', id: 'education' },
  { label: 'Achievements', id: 'achievements' },
  { label: 'Resume', id: 'resume' },
  { label: 'Contact', id: 'contact' },
]
const observedSections = navigation.map(({ id }) => id)

function Header() {
  const [activeSection, setActiveSection] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .filter((entry, _, visibleEntries) => (
            !visibleEntries.some(
              (otherEntry) =>
                entry.target !== otherEntry.target && entry.target.contains(otherEntry.target),
            )
          ))
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)

        if (visibleSections[0]) {
          setActiveSection(visibleSections[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      },
    )

    observedSections.forEach((id) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.querySelector('.menu-toggle')?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="M Shanmukha Sai, home">
        ms<span>.</span>
      </a>

      <button
        className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        id="primary-navigation"
        className={`main-nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        {navigation.map(({ label, id }) => (
          <a
            key={id}
            className={activeSection === id ? 'active' : ''}
            href={`#${id}`}
            aria-current={activeSection === id ? 'location' : undefined}
            onClick={closeMenu}
          >
            {label}
          </a>
        ))}
        <a
          className="nav-add-details"
          href="/admin/dashboard"
          onClick={closeMenu}
        >
          Add Details <span aria-hidden="true">＋</span>
        </a>
        <ThemeToggle />
      </nav>
    </header>
  )
}

export default Header
