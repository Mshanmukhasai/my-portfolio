import { isConfiguredExternalLink } from '../lib/links.js'

function ProjectCard({ project }) {
  const {
    number,
    title,
    description,
    category,
    image,
    technologies = [],
    githubUrl,
    demoUrl,
  } = project
  return (
    <article className="project-card">
      <div className="project-image-wrap">
        <img
          className="project-image"
          src={image.src}
          alt={image.alt}
          loading="lazy"
          onError={(event) => {
            if (image.fallbackSrc && event.currentTarget.dataset.fallbackApplied !== 'true') {
              event.currentTarget.dataset.fallbackApplied = 'true'
              event.currentTarget.src = image.fallbackSrc
              return
            }
            event.currentTarget.hidden = true
          }}
        />
        <span className="project-number">{number}</span>
        <span className="project-category">{category}</span>
      </div>
      <div className="project-content">
        <div className="project-heading">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <ul className="project-technologies" aria-label="Technologies used">
          {technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
        {(isConfiguredExternalLink(githubUrl) || isConfiguredExternalLink(demoUrl)) && (
          <div className="project-actions">
            {isConfiguredExternalLink(githubUrl) && (
              <a href={githubUrl} target="_blank" rel="noreferrer">
                GitHub <span aria-hidden="true">↗</span>
              </a>
            )}
            {isConfiguredExternalLink(demoUrl) && (
              <a href={demoUrl} target="_blank" rel="noreferrer">
                Live Demo <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
