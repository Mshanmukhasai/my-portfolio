import initialAbout from '../data/about.js'
import initialAchievements from '../data/achievements.js'
import initialEducation from '../data/education.js'
import initialPersonalInfo from '../data/personalInfo.js'
import initialProjects from '../data/projects.js'
import initialSkills from '../data/skills.js'
import { requireSupabase } from '../lib/supabase.js'

const TABLE_NAME = 'portfolio'
const STORAGE_BUCKET = 'portfolio-assets'
const CHANGE_EVENT = 'portfolio-data-change'

export const initialDetails = {
  name: initialPersonalInfo.name,
  profile_photo: initialPersonalInfo.photo,
  title: initialPersonalInfo.title,
  introduction: initialPersonalInfo.introduction,
  email: initialPersonalInfo.email,
  phone: initialPersonalInfo.phone,
  location: initialPersonalInfo.location,
  degree: initialEducation[0]?.degree || 'B.Tech',
  branch: initialEducation[0]?.specialization || 'Artificial Intelligence and Machine Learning',
  college: 'Jain University',
  start_year: initialEducation[0]?.startYear || '2025',
  end_year: initialEducation[0]?.endYear || '2028',
  github_url: '',
  linkedin_url: '',
  resume_url: '',
}

const defaultState = {
  record: null,
  profile: { ...initialPersonalInfo },
  about: { ...initialAbout },
  skills: [...initialSkills],
  projects: [...initialProjects],
  education: [...initialEducation],
  achievements: [...initialAchievements],
  resume: null,
}

let portfolioCache = structuredClone(defaultState)
let portfolioLoaded = false

function notifyPortfolioChanges() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function mapRecordToState(record) {
  const details = record
    ? Object.fromEntries(Object.keys(initialDetails).map((field) => [field, record[field] ?? initialDetails[field]]))
    : initialDetails

  const profile = {
    ...initialPersonalInfo,
    name: details.name,
    title: details.title,
    introduction: details.introduction,
    email: details.email,
    phone: details.phone,
    location: details.location,
    linkedIn: details.linkedin_url,
    github: details.github_url,
    photo: details.profile_photo,
  }

  return {
    ...structuredClone(defaultState),
    record,
    profile,
    about: { ...initialAbout, aboutMe: details.introduction },
    education: record
      ? [{
          id: 'portfolio-education',
          degree: details.degree,
          institution: details.college,
          specialization: details.branch,
          startYear: String(details.start_year),
          endYear: String(details.end_year),
          currentStatus: 'Currently pursuing',
        }]
      : [...initialEducation],
    resume: details.resume_url ? { name: 'Resume', url: details.resume_url } : null,
  }
}

function setPortfolioCache(record) {
  portfolioCache = mapRecordToState(record)
  portfolioLoaded = true
  notifyPortfolioChanges()
  return portfolioCache
}

function throwSupabaseError(error, operation) {
  if (!error) return
  console.error(`Supabase portfolio ${operation} failed.`, error)
  throw new Error(`Portfolio details could not be ${operation}. Check access to the existing public.portfolio table and your Supabase connection.`)
}

export async function loadPortfolio({ force = false } = {}) {
  if (portfolioLoaded && !force) return portfolioCache

  const client = requireSupabase()
  const { data, error } = await client
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  throwSupabaseError(error, 'loaded')
  return setPortfolioCache(data)
}

export async function savePortfolio(details) {
  const client = requireSupabase()
  const { data: existingRecord, error: lookupError } = await client
    .from(TABLE_NAME)
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  throwSupabaseError(lookupError, 'loaded')

  const values = Object.fromEntries(Object.keys(initialDetails).map((field) => [
    field,
    String(details[field] ?? '').trim(),
  ]))
  values.start_year = values.start_year ? Number(values.start_year) : null
  values.end_year = values.end_year ? Number(values.end_year) : null

  if (existingRecord) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .update(values)
      .eq('id', existingRecord.id)
      .select('*')
      .single()
    throwSupabaseError(error, 'updated')
    return setPortfolioCache(data)
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .insert(values)
    .select('*')
    .single()
  throwSupabaseError(error, 'saved')
  return setPortfolioCache(data)
}

export async function uploadProfilePhoto(file) {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP profile photo.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Profile photos must be 5 MB or smaller.')
  }

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `profile/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const client = requireSupabase()
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '0',
    contentType: file.type,
    upsert: false,
  })
  throwSupabaseError(error, 'uploaded')

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function subscribeToPortfolioChanges(callback) {
  const handleChange = () => callback(portfolioCache)
  window.addEventListener(CHANGE_EVENT, handleChange)
  return () => window.removeEventListener(CHANGE_EVENT, handleChange)
}

export function getPortfolio() {
  return portfolioCache
}

export function getPortfolioRecord() {
  return portfolioCache.record
}
