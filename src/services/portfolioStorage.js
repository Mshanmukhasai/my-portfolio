import initialAbout from '../data/about.js'
import initialAchievements from '../data/achievements.js'
import initialEducation from '../data/education.js'
import initialPersonalInfo from '../data/personalInfo.js'
import initialProjects from '../data/projects.js'
import initialSkills from '../data/skills.js'
import { requireSupabase } from '../lib/supabase.js'

const TABLE_NAME = 'portfolio_content'
const STORAGE_BUCKET = 'portfolio-assets'
const LEGACY_STORAGE_KEY = 'shanmukha-portfolio:v1'
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

let portfolioCache = structuredClone(defaultState)
let portfolioLoaded = false

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createPortfolioId() {
  return makeId()
}

function normalizeState(saved = {}) {
  const data = saved && typeof saved === 'object' ? saved : {}
  const normalizeRecords = (records) => Array.isArray(records)
    ? records.map((record) => ({ ...record, id: record.id || makeId() }))
    : []

  return {
    ...structuredClone(defaultState),
    ...data,
    profile: { ...defaultState.profile, ...(data.profile || {}) },
    about: { ...defaultState.about, ...(data.about || {}) },
    skills: normalizeRecords(data.skills ?? defaultState.skills),
    projects: normalizeRecords(data.projects ?? defaultState.projects),
    education: normalizeRecords(data.education ?? defaultState.education),
    achievements: normalizeRecords(data.achievements ?? defaultState.achievements),
    resume: data.resume ?? null,
  }
}

function notifyPortfolioChanges() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function setPortfolioCache(state) {
  portfolioCache = normalizeState(state)
  portfolioLoaded = true
  notifyPortfolioChanges()
  return portfolioCache
}

function throwSupabaseError(error, operation) {
  if (error) {
    console.error(`Supabase portfolio ${operation} failed.`, error)
    throw new Error(`Portfolio data could not be ${operation}. Check the Supabase table, policies, and network connection.`)
  }
}

async function uploadToPath(file, path, { acceptedTypes, maxBytes, label }) {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error(`Choose a supported ${label} file.`)
  }
  if (file.size > maxBytes) {
    throw new Error(`${label} files must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller.`)
  }

  const client = requireSupabase()
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '0',
    contentType: file.type,
    upsert: true,
  })
  throwSupabaseError(error, 'uploaded')

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

async function migrateLegacyImages(state) {
  const migrated = structuredClone(state)
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
  const convertDataUrl = async (dataUrl, path, label) => {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl
    const response = await fetch(dataUrl)
    const file = new File([await response.blob()], label, { type: response.headers.get('content-type') || '' })
    return uploadToPath(file, path, { acceptedTypes: imageTypes, maxBytes: 5 * 1024 * 1024, label })
  }

  migrated.profile.photo = await convertDataUrl(migrated.profile.photo, 'profile/main/avatar', 'Profile photo')
  for (const project of migrated.projects) {
    project.imageUrl = await convertDataUrl(project.imageUrl, `projects/${project.id}/cover`, 'Project image')
  }
  for (const achievement of migrated.achievements) {
    achievement.certificateUrl = await convertDataUrl(
      achievement.certificateUrl,
      `certificates/${achievement.id}/certificate`,
      'Certificate image',
    )
  }
  if (migrated.resume?.dataUrl?.startsWith('data:')) {
    const response = await fetch(migrated.resume.dataUrl)
    const file = new File([await response.blob()], migrated.resume.name || 'resume.pdf', { type: 'application/pdf' })
    migrated.resume.url = await uploadToPath(file, 'resume/current/document', {
      acceptedTypes: ['application/pdf'],
      maxBytes: 5 * 1024 * 1024,
      label: 'Resume',
    })
    delete migrated.resume.dataUrl
  }
  return migrated
}

async function persistPortfolio(state) {
  const client = requireSupabase()
  const content = normalizeState({ ...state, updatedAt: new Date().toISOString() })
  const { error } = await client
    .from(TABLE_NAME)
    .upsert({ id: 'main', content, updated_at: content.updatedAt }, { onConflict: 'id' })
  throwSupabaseError(error, 'saved')
  return setPortfolioCache(content)
}

export async function loadPortfolio({ force = false } = {}) {
  if (portfolioLoaded && !force) return portfolioCache

  const client = requireSupabase()
  const { data, error } = await client
    .from(TABLE_NAME)
    .select('content')
    .eq('id', 'main')
    .maybeSingle()
  throwSupabaseError(error, 'loaded')

  if (data?.content) return setPortfolioCache(data.content)

  const legacySaved = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacySaved) {
    let legacyState
    try {
      legacyState = normalizeState(JSON.parse(legacySaved))
    } catch (error) {
      console.error('Legacy portfolio data could not be parsed for cloud migration.', error)
      throw new Error('Saved browser portfolio data could not be migrated. It has been left unchanged.')
    }

    const migratedState = await migrateLegacyImages(legacyState)
    const savedState = await persistPortfolio(migratedState)
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return savedState
  }

  return setPortfolioCache(defaultState)
}

export function subscribeToPortfolioChanges(callback) {
  const handleChange = () => callback(portfolioCache)
  window.addEventListener(CHANGE_EVENT, handleChange)
  return () => window.removeEventListener(CHANGE_EVENT, handleChange)
}

export function getPortfolio() {
  return portfolioCache
}

export function getProfile() {
  return portfolioCache.profile
}

export async function updateProfile(profile) {
  const state = await loadPortfolio()
  const updated = await persistPortfolio({ ...state, profile: { ...state.profile, ...profile } })
  return updated.profile
}

export function getContact() {
  const { email, phone, location } = getProfile()
  return { email, phone, location }
}

export function updateContact(contact) {
  return updateProfile(contact)
}

export function getAbout() {
  return portfolioCache.about
}

export async function updateAbout(about) {
  const state = await loadPortfolio()
  const updated = await persistPortfolio({ ...state, about: { ...state.about, ...about } })
  return updated.about
}

export function getSkills() {
  return portfolioCache.skills
}

export async function addSkill(skill) {
  const item = { ...skill, id: skill.id || makeId() }
  const state = await loadPortfolio()
  await persistPortfolio({ ...state, skills: [...state.skills, item] })
  return item
}

export async function updateSkill(id, skill) {
  const state = await loadPortfolio()
  const skills = upsert(state.skills, id, skill)
  const updated = skills.find((item) => item.id === id)
  await persistPortfolio({ ...state, skills })
  return updated
}

export async function deleteSkill(id) {
  const state = await loadPortfolio()
  return (await persistPortfolio({ ...state, skills: state.skills.filter((item) => item.id !== id) })).skills
}

export function getProjects() {
  return portfolioCache.projects
}

export async function addProject(project) {
  const item = { ...project, id: project.id || makeId() }
  const state = await loadPortfolio()
  await persistPortfolio({ ...state, projects: [...state.projects, item] })
  return item
}

export async function updateProject(id, project) {
  const state = await loadPortfolio()
  const projects = upsert(state.projects, id, project)
  const updated = projects.find((item) => item.id === id)
  await persistPortfolio({ ...state, projects })
  return updated
}

export async function deleteProject(id) {
  const state = await loadPortfolio()
  return (await persistPortfolio({ ...state, projects: state.projects.filter((item) => item.id !== id) })).projects
}

export function getEducation() {
  return portfolioCache.education
}

export async function updateEducation(id, education) {
  const state = await loadPortfolio()
  const records = upsert(state.education, id, education)
  const updated = records.find((item) => item.id === id)
  await persistPortfolio({ ...state, education: records })
  return updated
}

export async function addEducation(education) {
  const item = { ...education, id: education.id || makeId() }
  const state = await loadPortfolio()
  await persistPortfolio({ ...state, education: [...state.education, item] })
  return item
}

export function getAchievements() {
  return portfolioCache.achievements
}

export async function addAchievement(achievement) {
  const item = { ...achievement, id: achievement.id || makeId() }
  const state = await loadPortfolio()
  await persistPortfolio({ ...state, achievements: [...state.achievements, item] })
  return item
}

export async function updateAchievement(id, achievement) {
  const state = await loadPortfolio()
  const achievements = upsert(state.achievements, id, achievement)
  const updated = achievements.find((item) => item.id === id)
  await persistPortfolio({ ...state, achievements })
  return updated
}

export async function deleteAchievement(id) {
  const state = await loadPortfolio()
  return (await persistPortfolio({
    ...state,
    achievements: state.achievements.filter((item) => item.id !== id),
  })).achievements
}

export function getResume() {
  return portfolioCache.resume
}

export async function updateResume(resume) {
  const state = await loadPortfolio()
  return (await persistPortfolio({ ...state, resume })).resume
}

export function uploadPortfolioFile(file, options) {
  const extension = file.type === 'image/jpeg' ? 'jpg'
    : file.type === 'image/png' ? 'png'
      : file.type === 'image/webp' ? 'webp'
        : file.type === 'application/pdf' ? 'pdf'
          : ''
  if (!extension) throw new Error(`Choose a supported ${options.label} file.`)
  return uploadToPath(file, `${options.folder}/${options.id}/${options.asset}.${extension}`, options)
}

function upsert(records, id, patch) {
  const index = records.findIndex((record) => record.id === id)
  if (index < 0) throw new Error('That portfolio item no longer exists. Refresh and try again.')
  return records.map((record, itemIndex) => itemIndex === index ? { ...record, ...patch, id } : record)
}
