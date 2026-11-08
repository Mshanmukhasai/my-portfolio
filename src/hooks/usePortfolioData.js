import { useEffect, useState } from 'react'

import profilePlaceholder from '../assets/profile-placeholder.svg'
import { getPortfolio, loadPortfolio, subscribeToPortfolioChanges } from '../services/portfolioStorage.js'

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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const unsubscribe = subscribeToPortfolioChanges((data) => {
      if (isCurrent) setPortfolio(data)
    })

    loadPortfolio({ force: true })
      .then((data) => {
        if (!isCurrent) return
        setPortfolio(data)
        setStorageError('')
      })
      .catch((error) => {
        if (!isCurrent) return
        setStorageError(error.message || 'Portfolio data could not be loaded from Supabase.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
      unsubscribe()
    }
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
    resumeUrl: portfolio.resume?.url || '',
    storageError,
    isLoading,
  }
}
