import initialAbout from '../data/about.js'
import initialAchievements from '../data/achievements.js'
import initialEducation from '../data/education.js'
import initialPersonalInfo from '../data/personalInfo.js'
import initialProjects from '../data/projects.js'
import initialSkills from '../data/skills.js'

const STORAGE_KEY = 'shanmukha-portfolio:v1'
const CHANGE_EVENT = 'portfolio-data-change'
const defaultState = {
  profile: { ...initialPersonalInfo },
  about: { ...initialAbout },
  skills: [...initialSkills],
  projects: [...initialProjects],
  education: [...initialEducation],
  achievements: [...initialAchievements],
  resume: null,
  updatedAt: null,
}

function readState() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return structuredClone(defaultState)
  return { ...structuredClone(defaultState), ...JSON.parse(saved) }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Browser storage is full. Use a smaller image or PDF, or remove unused uploads.')
    }
    throw new Error('Portfolio changes could not be saved in this browser.')
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  return state
}

function updateState(updater) {
  const current = readState()
  const next = updater(current)
  next.updatedAt = new Date().toISOString()
  return writeState(next)
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function upsert(records, id, patch) {
  const index = records.findIndex((record) => record.id === id)
  if (index < 0) throw new Error('That portfolio item no longer exists. Refresh and try again.')
  return records.map((record, itemIndex) => itemIndex === index ? { ...record, ...patch, id } : record)
}

export function subscribeToPortfolioChanges(callback) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function getPortfolio() {
  return readState()
}

export function getProfile() {
  return readState().profile
}

export function updateProfile(profile) {
  return updateState((state) => ({ ...state, profile: { ...state.profile, ...profile } })).profile
}

export function getContact() {
  const { email, phone, location } = getProfile()
  return { email, phone, location }
}

export function updateContact(contact) {
  return updateProfile(contact)
}

export function getAbout() {
  return readState().about
}

export function updateAbout(about) {
  return updateState((state) => ({ ...state, about: { ...state.about, ...about } })).about
}

export function getSkills() {
  return readState().skills
}

export function addSkill(skill) {
  const item = { ...skill, id: makeId() }
  updateState((state) => ({ ...state, skills: [...state.skills, item] }))
  return item
}

export function updateSkill(id, skill) {
  let updated
  updateState((state) => {
    const skills = upsert(state.skills, id, skill)
    updated = skills.find((item) => item.id === id)
    return { ...state, skills }
  })
  return updated
}

export function deleteSkill(id) {
  return updateState((state) => ({ ...state, skills: state.skills.filter((item) => item.id !== id) })).skills
}

export function getProjects() {
  return readState().projects
}

export function addProject(project) {
  const item = { ...project, id: makeId() }
  updateState((state) => ({ ...state, projects: [...state.projects, item] }))
  return item
}

export function updateProject(id, project) {
  let updated
  updateState((state) => {
    const projects = upsert(state.projects, id, project)
    updated = projects.find((item) => item.id === id)
    return { ...state, projects }
  })
  return updated
}

export function deleteProject(id) {
  return updateState((state) => ({ ...state, projects: state.projects.filter((item) => item.id !== id) })).projects
}

export function getEducation() {
  return readState().education
}

export function updateEducation(id, education) {
  let updated
  updateState((state) => {
    const records = upsert(state.education, id, education)
    updated = records.find((item) => item.id === id)
    return { ...state, education: records }
  })
  return updated
}

export function addEducation(education) {
  const item = { ...education, id: makeId() }
  updateState((state) => ({ ...state, education: [...state.education, item] }))
  return item
}

export function getAchievements() {
  return readState().achievements
}

export function addAchievement(achievement) {
  const item = { ...achievement, id: makeId() }
  updateState((state) => ({ ...state, achievements: [...state.achievements, item] }))
  return item
}

export function updateAchievement(id, achievement) {
  let updated
  updateState((state) => {
    const achievements = upsert(state.achievements, id, achievement)
    updated = achievements.find((item) => item.id === id)
    return { ...state, achievements }
  })
  return updated
}

export function deleteAchievement(id) {
  return updateState((state) => ({ ...state, achievements: state.achievements.filter((item) => item.id !== id) })).achievements
}

export function getResume() {
  return readState().resume
}

export function updateResume(resume) {
  return updateState((state) => ({ ...state, resume })).resume
}

export function readFileAsDataUrl(file, { maxBytes, acceptedTypes, label }) {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error(`Choose a supported ${label} file.`)
  }
  if (file.size > maxBytes) {
    throw new Error(`${label} files must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller for browser storage.`)
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`The selected ${label} file could not be read.`))
        return
      }
      resolve(reader.result)
    })
    reader.addEventListener('error', () => reject(new Error(`The selected ${label} file could not be read.`)))
    reader.readAsDataURL(file)
  })
}
