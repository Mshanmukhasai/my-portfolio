import { useEffect, useState } from 'react'

import profilePlaceholder from '../assets/profile-placeholder.svg'
import { getPortfolio, subscribeToPortfolioChanges } from '../services/portfolioStorage.js'

function mapProject(project, index) {
  return {
    ...project,
    number: String(index + 1).padStart(2, '0'),
    image: {
      src: project.imageUrl || profilePlaceholder,
      alt: project.imageAlt || project.title,
      fallbackSrc: profilePlaceholder,
    },
    githubUrl: project.githubUrl || '',
    demoUrl: project.demoUrl || '',
    technologies: project.technologies || [],
  }
}

export default function usePortfolioData() {
  const [portfolio, setPortfolio] = useState(() => getPortfolio())
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    function refreshPortfolio() {
      try {
        setPortfolio(getPortfolio())
        setStorageError('')
      } catch {
        setStorageError('Saved portfolio data could not be read. Use the dashboard to review and save your content again.')
      }
    }

    return subscribeToPortfolioChanges(refreshPortfolio)
  }, [])

  const projects = portfolio.projects.map(mapProject)
  const achievements = portfolio.achievements.map((achievement) => ({
    ...achievement,
    details: achievement.description,
  }))

  return {
    profile: {
      ...portfolio.profile,
      photoFallback: portfolio.profile.photoFallback || profilePlaceholder,
    },
    about: portfolio.about,
    skills: portfolio.skills,
    skillNames: portfolio.skills.map(({ name }) => name),
    projects,
    education: portfolio.education,
    achievements,
    resumeUrl: portfolio.resume?.dataUrl || '',
    storageError,
    isLoading: false,
  }
}
