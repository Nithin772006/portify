import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFormStore } from '../store/formStore'
import { useAuth, API } from '../hooks/useAuth'
import DotWave from '../components/DotWave'
import GenerationCinematic, { MIN_DURATION_MS } from '../components/GenerationCinematic'

type SectionKey = 'projects' | 'experience' | 'education'
type StepKey = 'profession' | 'basic' | 'skills' | SectionKey | 'job' | 'review'
type StoreFieldKey = 'name' | 'title' | 'location' | 'email' | 'phone' | 'linkedin' | 'github' | 'bio'
type CustomFieldKey =
  | 'portfolio'
  | 'dribbble'
  | 'behance'
  | 'kaggle'
  | 'hospital'
  | 'specialization'
  | 'barAssociation'
  | 'firmWebsite'
  | 'restaurant'
  | 'instagram'
  | 'googleScholar'
  | 'orcid'
type VisibleFieldKey = StoreFieldKey | CustomFieldKey

type ProfessionSchema = {
  label: string
  emoji?: string
  requiredFields: string[]
  optionalFields: string[]
  suggestedSkills: string[]
  sections: SectionKey[]
}

type ProfessionOption = {
  key: string
  label: string
  badge: string
}

type FieldConfig = {
  key: VisibleFieldKey
  label: string
  placeholder: string
  type?: 'text' | 'email' | 'url' | 'tel'
  rows?: number
  multiline?: boolean
}

type ProjectStepCopy = {
  title: string
  description: string
  itemLabel: string
  titlePlaceholder: string
  descriptionPlaceholder: string
  primaryLinkLabel: string
  primaryLinkPlaceholder: string
  secondaryLinkLabel: string
  secondaryLinkPlaceholder: string
  stackLabel: string
  stackPlaceholder: string
}

type ExperienceStepCopy = {
  title: string
  description: string
  itemLabel: string
  organizationPlaceholder: string
  rolePlaceholder: string
  descriptionPlaceholder: string
}

type EducationStepCopy = {
  title: string
  description: string
  institutionPlaceholder: string
  degreePlaceholder: string
  fieldPlaceholder: string
  yearPlaceholder: string
}

const professionOptions: ProfessionOption[] = [
  { key: 'software-engineer', label: 'Software Engineer', badge: 'SE' },
  { key: 'ui-ux-designer', label: 'UI/UX Designer', badge: 'UX' },
  { key: 'data-scientist', label: 'Data Scientist', badge: 'DS' },
  { key: 'doctor', label: 'Doctor', badge: 'MD' },
  { key: 'lawyer', label: 'Lawyer', badge: 'LW' },
  { key: 'marketing-manager', label: 'Marketing Manager', badge: 'MM' },
  { key: 'architect', label: 'Architect', badge: 'AR' },
  { key: 'photographer', label: 'Photographer', badge: 'PH' },
  { key: 'chef', label: 'Chef', badge: 'CF' },
  { key: 'freelancer', label: 'Freelancer', badge: 'FR' },
  { key: 'researcher', label: 'Researcher', badge: 'RS' },
  { key: 'mechanical-engineer', label: 'Mechanical Engineer', badge: 'ME' },
]

const DEFAULT_SCHEMA: ProfessionSchema = {
  label: 'Professional',
  requiredFields: ['name', 'title', 'bio', 'skills', 'location', 'email'],
  optionalFields: ['phone', 'linkedin'],
  suggestedSkills: [],
  sections: ['projects', 'experience', 'education'],
}

const BUILT_IN_FIELD_KEYS = new Set<StoreFieldKey>([
  'name',
  'title',
  'location',
  'email',
  'phone',
  'linkedin',
  'github',
  'bio',
])

const themeText = {
  primary: 'var(--fg)',
  muted: 'var(--muted)',
  mutedStrong: 'var(--muted-strong)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  bg: 'var(--bg)',
  overlay: 'var(--overlay)',
  track: 'var(--track)',
  cardHover: 'var(--card-hover)',
  chipBg: 'var(--chip-bg)',
  chipBorder: '1px solid var(--chip-border)',
  chipText: 'var(--chip-text)',
} as const

const titlePlaceholders: Record<string, string> = {
  'software-engineer': 'Senior Software Engineer',
  'ui-ux-designer': 'Product Designer',
  'data-scientist': 'Machine Learning Engineer',
  doctor: 'Consultant Cardiologist',
  lawyer: 'Corporate Counsel',
  'marketing-manager': 'Growth Marketing Manager',
  architect: 'Licensed Architect',
  photographer: 'Portrait and Event Photographer',
  chef: 'Executive Chef',
  freelancer: 'Independent Consultant',
  researcher: 'Research Scientist',
  'mechanical-engineer': 'Mechanical Design Engineer',
}

const bioPlaceholders: Record<string, string> = {
  'software-engineer': 'Write about the systems you build, the teams you work with, and the engineering problems you enjoy solving...',
  'ui-ux-designer': 'Describe the products you design, your process, and the user outcomes you focus on...',
  'data-scientist': 'Summarize your modeling, analytics, and business impact across data projects...',
  doctor: 'Summarize your clinical background, specialties, patient-care philosophy, and certifications...',
  lawyer: 'Describe your practice areas, case experience, and how you support clients...',
  'marketing-manager': 'Write about the campaigns you lead, the channels you own, and the outcomes you drive...',
  architect: 'Describe the spaces you design, your design approach, and the projects you deliver...',
  photographer: 'Share the kind of stories you shoot, your style, and the clients or moments you capture...',
  chef: 'Write about your cuisine, kitchen leadership, and the dining experiences you create...',
  freelancer: 'Describe the services you offer, the clients you help, and the problems you solve independently...',
  researcher: 'Summarize your research focus, methods, and the questions that drive your work...',
  'mechanical-engineer': 'Describe your engineering strengths, product development work, and technical problem-solving approach...',
}

function isBuiltInFieldKey(key: VisibleFieldKey): key is StoreFieldKey {
  return BUILT_IN_FIELD_KEYS.has(key as StoreFieldKey)
}

function toLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim()
}

function getFieldConfig(key: VisibleFieldKey, profession: string): FieldConfig {
  switch (key) {
    case 'name':
      return { key, label: 'Full Name', placeholder: 'John Doe' }
    case 'title':
      return { key, label: 'Professional Title', placeholder: titlePlaceholders[profession] || 'Professional Title' }
    case 'location':
      return { key, label: 'Location', placeholder: 'Chennai, India' }
    case 'email':
      return { key, label: 'Email', placeholder: 'name@example.com', type: 'email' }
    case 'phone':
      return { key, label: 'Phone', placeholder: '+91 ...', type: 'tel' }
    case 'linkedin':
      return { key, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...', type: 'url' }
    case 'github':
      return { key, label: 'GitHub URL', placeholder: 'https://github.com/...', type: 'url' }
    case 'portfolio':
      return { key, label: 'Portfolio URL', placeholder: 'https://yourportfolio.com', type: 'url' }
    case 'dribbble':
      return { key, label: 'Dribbble URL', placeholder: 'https://dribbble.com/...', type: 'url' }
    case 'behance':
      return { key, label: 'Behance URL', placeholder: 'https://behance.net/...', type: 'url' }
    case 'kaggle':
      return { key, label: 'Kaggle URL', placeholder: 'https://kaggle.com/...', type: 'url' }
    case 'hospital':
      return { key, label: 'Hospital / Clinic', placeholder: 'Apollo Hospitals' }
    case 'specialization':
      return { key, label: 'Specialization', placeholder: 'Cardiology' }
    case 'barAssociation':
      return { key, label: 'Bar Association', placeholder: 'Bar Council of Tamil Nadu' }
    case 'firmWebsite':
      return { key, label: 'Firm Website', placeholder: 'https://yourfirm.com', type: 'url' }
    case 'restaurant':
      return { key, label: 'Restaurant / Kitchen', placeholder: 'Restaurant Name' }
    case 'instagram':
      return { key, label: 'Instagram URL', placeholder: 'https://instagram.com/...', type: 'url' }
    case 'googleScholar':
      return { key, label: 'Google Scholar URL', placeholder: 'https://scholar.google.com/...', type: 'url' }
    case 'orcid':
      return { key, label: 'ORCID URL', placeholder: 'https://orcid.org/...', type: 'url' }
    case 'bio':
      return {
        key,
        label: 'Portfolio Bio',
        placeholder: bioPlaceholders[profession] || 'Write about yourself, your experience, and what drives you...',
        multiline: true,
        rows: 5,
      }
    default:
      return { key, label: toLabel(key), placeholder: `Enter your ${toLabel(key).toLowerCase()}...` }
  }
}

function getProjectStepCopy(profession: string): ProjectStepCopy {
  const defaults: ProjectStepCopy = {
    title: 'Your projects',
    description: 'Showcase your best work.',
    itemLabel: 'Project',
    titlePlaceholder: 'Project title',
    descriptionPlaceholder: 'What does this project do? What impact did it have?',
    primaryLinkLabel: 'GitHub URL',
    primaryLinkPlaceholder: 'https://github.com/... (optional)',
    secondaryLinkLabel: 'Live URL',
    secondaryLinkPlaceholder: 'https://... (optional)',
    stackLabel: 'Tech Stack',
    stackPlaceholder: 'Type tech and press Enter...',
  }

  const overrides: Record<string, Partial<ProjectStepCopy>> = {
    'ui-ux-designer': {
      title: 'Case studies',
      description: 'Add the strongest product or UX case studies.',
      itemLabel: 'Case Study',
      titlePlaceholder: 'Case study title',
      descriptionPlaceholder: 'What was the challenge, your process, and the outcome?',
      primaryLinkLabel: 'Case Study URL',
      primaryLinkPlaceholder: 'https://behance.net/... (optional)',
      secondaryLinkLabel: 'Prototype / Live URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Tools Used',
      stackPlaceholder: 'Type a tool and press Enter...',
    },
    'data-scientist': {
      title: 'Projects and models',
      description: 'Highlight the analysis, models, and measurable outcomes you delivered.',
      descriptionPlaceholder: 'What data problem did you solve and what result did it drive?',
      primaryLinkLabel: 'Notebook / GitHub URL',
      primaryLinkPlaceholder: 'https://github.com/... (optional)',
      secondaryLinkLabel: 'Demo / Article URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Libraries / Tools',
      stackPlaceholder: 'Type a library or tool and press Enter...',
    },
    'marketing-manager': {
      title: 'Campaigns and launches',
      description: 'Show the campaigns, launches, and growth initiatives you led.',
      itemLabel: 'Campaign',
      titlePlaceholder: 'Campaign name',
      descriptionPlaceholder: 'What was the goal, execution, and performance outcome?',
      primaryLinkLabel: 'Campaign URL',
      primaryLinkPlaceholder: 'https://... (optional)',
      secondaryLinkLabel: 'Landing Page URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Channels / Tools',
      stackPlaceholder: 'Type a channel or tool and press Enter...',
    },
    architect: {
      title: 'Signature projects',
      description: 'Highlight built work, concepts, or studio projects that define your practice.',
      titlePlaceholder: 'Project or building name',
      descriptionPlaceholder: 'What was the brief, your contribution, and the design outcome?',
      primaryLinkLabel: 'Project Page URL',
      primaryLinkPlaceholder: 'https://... (optional)',
      secondaryLinkLabel: 'Walkthrough / Gallery URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Tools / Systems',
      stackPlaceholder: 'Type a tool or system and press Enter...',
    },
    photographer: {
      title: 'Featured shoots',
      description: 'Highlight shoots, series, or client work that best represent your style.',
      itemLabel: 'Shoot',
      titlePlaceholder: 'Shoot or series name',
      descriptionPlaceholder: 'What was the brief, style, and result?',
      primaryLinkLabel: 'Portfolio URL',
      primaryLinkPlaceholder: 'https://yourportfolio.com/... (optional)',
      secondaryLinkLabel: 'Instagram / Gallery URL',
      secondaryLinkPlaceholder: 'https://instagram.com/... (optional)',
      stackLabel: 'Styles / Tools',
      stackPlaceholder: 'Type a style or tool and press Enter...',
    },
    freelancer: {
      title: 'Client work',
      description: 'Show the strongest client-facing work you want to sell through your portfolio.',
      titlePlaceholder: 'Client project name',
      descriptionPlaceholder: 'What did the client need and what result did you deliver?',
      primaryLinkLabel: 'Portfolio / Case Study URL',
      primaryLinkPlaceholder: 'https://... (optional)',
      secondaryLinkLabel: 'Live URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Skills / Tools',
      stackPlaceholder: 'Type a skill or tool and press Enter...',
    },
    researcher: {
      title: 'Studies and publications',
      description: 'Add research projects, publications, or studies with clear context and contribution.',
      itemLabel: 'Study',
      titlePlaceholder: 'Study or paper title',
      descriptionPlaceholder: 'What question did you investigate and what was your contribution?',
      primaryLinkLabel: 'Publication URL',
      primaryLinkPlaceholder: 'https://... (optional)',
      secondaryLinkLabel: 'Dataset / Lab URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Methods / Tools',
      stackPlaceholder: 'Type a method or tool and press Enter...',
    },
    'mechanical-engineer': {
      title: 'Engineering projects',
      description: 'Show product, design, or simulation work with clear technical impact.',
      descriptionPlaceholder: 'What problem did you solve and what engineering result did you achieve?',
      primaryLinkLabel: 'CAD / GitHub URL',
      primaryLinkPlaceholder: 'https://... (optional)',
      secondaryLinkLabel: 'Prototype / Demo URL',
      secondaryLinkPlaceholder: 'https://... (optional)',
      stackLabel: 'Tools / Methods',
      stackPlaceholder: 'Type a tool or method and press Enter...',
    },
  }

  return { ...defaults, ...(overrides[profession] || {}) }
}

function getExperienceStepCopy(profession: string): ExperienceStepCopy {
  const defaults: ExperienceStepCopy = {
    title: 'Work experience',
    description: 'Add your professional experience.',
    itemLabel: 'Experience',
    organizationPlaceholder: 'Company Name',
    rolePlaceholder: 'Role / Position',
    descriptionPlaceholder: 'Describe your role and achievements...',
  }

  const overrides: Record<string, Partial<ExperienceStepCopy>> = {
    'ui-ux-designer': {
      title: 'Product design experience',
      description: 'Add the teams, products, and product areas you designed for.',
      organizationPlaceholder: 'Company / Product Team',
      rolePlaceholder: 'Role / Design Focus',
      descriptionPlaceholder: 'Describe the problems you solved, collaborators, and outcomes...',
    },
    'data-scientist': {
      title: 'Data experience',
      description: 'Add the teams and roles where you used analytics, modeling, or experimentation.',
      organizationPlaceholder: 'Company / Team',
      rolePlaceholder: 'Role / Focus',
      descriptionPlaceholder: 'Describe the data work, models, and business impact...',
    },
    doctor: {
      title: 'Clinical experience',
      description: 'Add hospitals, clinics, residencies, or fellowships.',
      organizationPlaceholder: 'Hospital / Clinic',
      rolePlaceholder: 'Role / Specialty',
      descriptionPlaceholder: 'Describe patient care, procedures, leadership, or outcomes...',
    },
    lawyer: {
      title: 'Legal experience',
      description: 'Add firms, chambers, or in-house legal roles.',
      organizationPlaceholder: 'Firm / Chamber / Company',
      rolePlaceholder: 'Role / Practice Area',
      descriptionPlaceholder: 'Describe the matters, negotiations, research, or client outcomes...',
    },
    'marketing-manager': {
      title: 'Marketing experience',
      description: 'Add the companies, brands, and growth roles you have led.',
      organizationPlaceholder: 'Company / Brand',
      rolePlaceholder: 'Role / Channel Focus',
      descriptionPlaceholder: 'Describe the campaigns, channels, and performance outcomes...',
    },
    architect: {
      title: 'Studio experience',
      description: 'Add firms, studios, and the project work you delivered there.',
      organizationPlaceholder: 'Firm / Studio',
      rolePlaceholder: 'Role / Project Focus',
      descriptionPlaceholder: 'Describe design scope, delivery stage, and project impact...',
    },
    photographer: {
      title: 'Client and studio experience',
      description: 'Add studios, agencies, or client relationships that shaped your portfolio.',
      organizationPlaceholder: 'Studio / Client',
      rolePlaceholder: 'Role / Focus',
      descriptionPlaceholder: 'Describe the assignments, style, and outcomes...',
    },
    chef: {
      title: 'Kitchen experience',
      description: 'Add restaurants, kitchens, pop-ups, or hospitality roles.',
      organizationPlaceholder: 'Restaurant / Kitchen',
      rolePlaceholder: 'Role / Station',
      descriptionPlaceholder: 'Describe menu ownership, service volume, or operational wins...',
    },
    freelancer: {
      title: 'Client experience',
      description: 'Add the clients, retainers, or project work that built your independent practice.',
      organizationPlaceholder: 'Client / Company',
      rolePlaceholder: 'Service / Role',
      descriptionPlaceholder: 'Describe the scope, responsibility, and delivered outcome...',
    },
    researcher: {
      title: 'Research experience',
      description: 'Add labs, universities, or institutions where your research was developed.',
      organizationPlaceholder: 'University / Lab / Institution',
      rolePlaceholder: 'Role / Research Focus',
      descriptionPlaceholder: 'Describe your methods, publications, and contribution...',
    },
    'mechanical-engineer': {
      title: 'Engineering experience',
      description: 'Add the teams, plants, or product groups where you delivered engineering work.',
      organizationPlaceholder: 'Company / Plant / Team',
      rolePlaceholder: 'Role / Discipline',
      descriptionPlaceholder: 'Describe the systems, analysis, or manufacturing impact...',
    },
  }

  return { ...defaults, ...(overrides[profession] || {}) }
}

function getEducationStepCopy(profession: string): EducationStepCopy {
  const defaults: EducationStepCopy = {
    title: 'Education',
    description: 'Your educational background.',
    institutionPlaceholder: 'Institution',
    degreePlaceholder: 'Degree (e.g. B.Tech, MBA)',
    fieldPlaceholder: 'Field of Study',
    yearPlaceholder: 'Graduation Year',
  }

  const overrides: Record<string, Partial<EducationStepCopy>> = {
    'ui-ux-designer': {
      title: 'Design education',
      description: 'Add the schools, courses, or programs that shaped your design foundation.',
      institutionPlaceholder: 'School / Institution',
      degreePlaceholder: 'Degree / Program',
      fieldPlaceholder: 'Design Discipline',
    },
    doctor: {
      title: 'Education and credentials',
      description: 'Add medical school, residency, fellowship, or certifications.',
      institutionPlaceholder: 'Medical School / Institution',
      degreePlaceholder: 'Degree / Program',
      fieldPlaceholder: 'Residency / Specialty',
      yearPlaceholder: 'Completion Year',
    },
    lawyer: {
      title: 'Education and credentials',
      description: 'Add law school, legal education, or certifications relevant to your practice.',
      institutionPlaceholder: 'Law School / Institution',
      degreePlaceholder: 'Degree / Program',
      fieldPlaceholder: 'Field / Practice Focus',
    },
    architect: {
      title: 'Academic background',
      description: 'Add the education and credentials behind your architecture practice.',
      institutionPlaceholder: 'School / Institution',
      degreePlaceholder: 'Degree / Program',
      fieldPlaceholder: 'Architecture / Discipline',
    },
    chef: {
      title: 'Training and certifications',
      description: 'Add culinary school, apprenticeships, or certifications.',
      institutionPlaceholder: 'Culinary School / Institution',
      degreePlaceholder: 'Program / Certification',
      fieldPlaceholder: 'Cuisine / Specialization',
      yearPlaceholder: 'Completion Year',
    },
    researcher: {
      title: 'Academic background',
      description: 'Add the degrees and institutions supporting your research work.',
      institutionPlaceholder: 'University / Institution',
      degreePlaceholder: 'Degree',
      fieldPlaceholder: 'Field of Research',
    },
    'mechanical-engineer': {
      title: 'Education',
      description: 'Add the academic foundation behind your engineering work.',
      degreePlaceholder: 'Degree / Program',
      fieldPlaceholder: 'Mechanical / Design Focus',
    },
  }

  return { ...defaults, ...(overrides[profession] || {}) }
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const store = useFormStore()
  const [schema, setSchema] = useState<ProfessionSchema | null>(null)
  const [generating, setGenerating] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (user?.email && !store.email) {
      store.setField('email', user.email)
      store.setField('name', user.name || '')
    }
  }, [store, user])

  useEffect(() => {
    let cancelled = false
    setSchema(null)

    if (!store.profession) {
      return () => {
        cancelled = true
      }
    }

    API.get(`/schema/${store.profession}`)
      .then((response) => {
        if (!cancelled) {
          setSchema(response.data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchema(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [store.profession])

  const activeSchema = useMemo<ProfessionSchema>(() => {
    const fallbackLabel = professionOptions.find((option) => option.key === store.profession)?.label || DEFAULT_SCHEMA.label
    return {
      label: schema?.label || fallbackLabel,
      emoji: schema?.emoji,
      requiredFields: schema?.requiredFields || DEFAULT_SCHEMA.requiredFields,
      optionalFields: schema?.optionalFields || DEFAULT_SCHEMA.optionalFields,
      suggestedSkills: schema?.suggestedSkills || DEFAULT_SCHEMA.suggestedSkills,
      sections: schema?.sections || DEFAULT_SCHEMA.sections,
    }
  }, [schema, store.profession])

  const steps = useMemo<StepKey[]>(() => {
    return ['profession', 'basic', 'skills', ...activeSchema.sections, 'job', 'review']
  }, [activeSchema.sections])

  const totalSteps = steps.length
  const currentStepKey = steps[store.currentStep - 1] || 'profession'
  const requiredFieldSet = useMemo(() => new Set(activeSchema.requiredFields), [activeSchema.requiredFields])

  const visibleFieldKeys = useMemo<VisibleFieldKey[]>(() => {
    const orderedKeys = [...new Set([...activeSchema.requiredFields, ...activeSchema.optionalFields])]
    return orderedKeys.filter((key): key is VisibleFieldKey => key !== 'skills')
  }, [activeSchema.optionalFields, activeSchema.requiredFields])

  const visibleFields = useMemo(() => {
    return visibleFieldKeys.map((key) => getFieldConfig(key, store.profession))
  }, [store.profession, visibleFieldKeys])

  const projectCopy = useMemo(() => getProjectStepCopy(store.profession), [store.profession])
  const experienceCopy = useMemo(() => getExperienceStepCopy(store.profession), [store.profession])
  const educationCopy = useMemo(() => getEducationStepCopy(store.profession), [store.profession])

  useEffect(() => {
    if (store.currentStep > totalSteps) {
      store.setStep(totalSteps)
    }
  }, [store, totalSteps])

  const next = () => store.setStep(Math.min(store.currentStep + 1, totalSteps))
  const prev = () => store.setStep(Math.max(store.currentStep - 1, 1))

  const getFieldValue = (key: VisibleFieldKey) => {
    if (isBuiltInFieldKey(key)) {
      return store[key] || ''
    }
    return store.customFields[key] || ''
  }

  const setFieldValue = (key: VisibleFieldKey, value: string) => {
    if (isBuiltInFieldKey(key)) {
      store.setField(key, value)
      return
    }
    store.setCustomField(key, value)
  }

  const buildSubmissionData = () => {
    const formData: Record<string, any> = {
      profession: store.profession,
      skills: store.skills,
      jobDescription: store.jobDescription,
    }

    visibleFieldKeys.forEach((key) => {
      formData[key] = getFieldValue(key)
    })

    if (activeSchema.sections.includes('projects')) {
      formData.projects = store.projects.filter((project) => project.title)
    }

    if (activeSchema.sections.includes('experience')) {
      formData.experience = store.experience.filter((entry) => entry.company || entry.role)
    }

    if (activeSchema.sections.includes('education')) {
      formData.education = store.education
    }

    return formData
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const generationRequest = API.post('/portfolio/generate', buildSubmissionData())
      await new Promise((resolve) => setTimeout(resolve, MIN_DURATION_MS))
      await generationRequest
      navigate('/dashboard')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Generation failed')
      setGenerating(false)
    }
  }

  const completedCustomDetails = visibleFieldKeys
    .filter((key) => !isBuiltInFieldKey(key))
    .filter((key) => (store.customFields[key] || '').trim()).length

  if (generating) {
    return <GenerationCinematic name={store.name || user?.name || 'Portfolio'} />
  }

  return (
    <div style={{ minHeight: '100vh', background: themeText.bg }}>
      <DotWave />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: themeText.overlay, backdropFilter: 'blur(12px)', padding: '16px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 800, margin: '0 auto' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: themeText.muted }}>
            Step {store.currentStep} of {totalSteps}
          </span>
          <div style={{ flex: 1, marginLeft: 20, height: 2, background: themeText.track, borderRadius: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(store.currentStep / totalSteps) * 100}%`, background: themeText.primary, borderRadius: 1, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 40px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={store.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStepKey === 'profession' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>What's your profession?</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 40 }}>This controls which form details and sections appear next.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {professionOptions.map((option) => (
                    <div
                      key={option.key}
                      className="glass"
                      onClick={() => store.setProfession(option.key)}
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderColor: store.profession === option.key ? themeText.borderStrong : undefined,
                        background: store.profession === option.key ? themeText.cardHover : undefined,
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 8, fontFamily: 'monospace', letterSpacing: '0.12em' }}>{option.badge}</div>
                      <div style={{ fontSize: 13, fontFamily: 'monospace' }}>{option.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStepKey === 'basic' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Basic information</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 40 }}>
                  Build your {activeSchema.label.toLowerCase()} profile with the details that matter for this profession.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {visibleFields.map((field) => {
                    const label = requiredFieldSet.has(field.key) ? `${field.label} *` : `${field.label} (optional)`
                    return (
                      <div key={field.key}>
                        <label style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 6 }}>{label}</label>
                        {field.multiline ? (
                          <textarea
                            className="glass-input"
                            value={getFieldValue(field.key)}
                            onChange={(event) => setFieldValue(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            rows={field.rows || 5}
                          />
                        ) : (
                          <input
                            className="glass-input"
                            type={field.type || 'text'}
                            value={getFieldValue(field.key)}
                            onChange={(event) => setFieldValue(field.key, event.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                        {field.key === 'bio' && (
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: themeText.mutedStrong, marginTop: 4 }}>
                            {store.bio.split(/\s+/).filter(Boolean).length} words
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStepKey === 'skills' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Your skills</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>
                  Add the tools, strengths, and methods that define your {activeSchema.label.toLowerCase()} profile. {store.skills.length} skills added.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    className="glass-input"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && skillInput.trim()) {
                        event.preventDefault()
                        store.addSkill(skillInput.trim())
                        setSkillInput('')
                      }
                    }}
                    placeholder="Type a skill and press Enter..."
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {store.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: themeText.chipBg,
                        border: themeText.chipBorder,
                        borderRadius: 9999,
                        padding: '6px 14px',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => store.removeSkill(skill)}
                        style={{ background: 'none', border: 'none', color: themeText.muted, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>

                {activeSchema.suggestedSkills.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.mutedStrong, marginBottom: 12 }}>Suggested for {activeSchema.label}:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {activeSchema.suggestedSkills.filter((skill) => !store.skills.includes(skill)).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => store.addSkill(skill)}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 9999,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: themeText.muted,
                            background: 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.borderColor = themeText.borderStrong
                            event.currentTarget.style.color = themeText.primary
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.borderColor = themeText.border
                            event.currentTarget.style.color = themeText.muted
                          }}
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {currentStepKey === 'projects' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{projectCopy.title}</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>{projectCopy.description}</p>
                {store.projects.map((project, index) => (
                  <div key={index} className="glass" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: themeText.muted }}>{projectCopy.itemLabel} {index + 1}</span>
                      {index > 0 && (
                        <button onClick={() => store.removeProject(index)} style={{ background: 'none', border: 'none', color: themeText.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="glass-input" placeholder={projectCopy.titlePlaceholder} value={project.title} onChange={(event) => store.setProject(index, { title: event.target.value })} />
                      <textarea className="glass-input" placeholder={projectCopy.descriptionPlaceholder} value={project.description} onChange={(event) => store.setProject(index, { description: event.target.value })} rows={3} />
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: themeText.mutedStrong }}>{project.description.length} chars</div>
                      <div>
                        <label style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 6 }}>{projectCopy.primaryLinkLabel}</label>
                        <input className="glass-input" placeholder={projectCopy.primaryLinkPlaceholder} value={project.githubUrl} onChange={(event) => store.setProject(index, { githubUrl: event.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 6 }}>{projectCopy.secondaryLinkLabel}</label>
                        <input className="glass-input" placeholder={projectCopy.secondaryLinkPlaceholder} value={project.liveUrl} onChange={(event) => store.setProject(index, { liveUrl: event.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.muted, display: 'block', marginBottom: 6 }}>{projectCopy.stackLabel}</label>
                        <input
                          className="glass-input"
                          placeholder={projectCopy.stackPlaceholder}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              const value = event.currentTarget.value.trim()
                              if (value) {
                                store.setProject(index, { techStack: [...project.techStack, value] })
                                event.currentTarget.value = ''
                              }
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {project.techStack.map((item, itemIndex) => (
                            <span key={itemIndex} style={{ background: 'var(--surface-soft-strong)', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontFamily: 'monospace', color: themeText.chipText, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {item}
                              <button onClick={() => store.setProject(index, { techStack: project.techStack.filter((_, techIndex) => techIndex !== itemIndex) })} style={{ background: 'none', border: 'none', color: themeText.muted, cursor: 'pointer', fontSize: 12, padding: 0 }}>x</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {store.projects.length < 5 && (
                  <button className="glass-btn" onClick={() => store.addProject()}>+ Add Another {projectCopy.itemLabel}</button>
                )}
              </div>
            )}

            {currentStepKey === 'experience' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{experienceCopy.title}</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>{experienceCopy.description}</p>
                {store.experience.map((entry, index) => (
                  <div key={index} className="glass" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: themeText.muted }}>{experienceCopy.itemLabel} {index + 1}</span>
                      {index > 0 && (
                        <button onClick={() => store.removeExperience(index)} style={{ background: 'none', border: 'none', color: themeText.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>Remove</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="glass-input" placeholder={experienceCopy.organizationPlaceholder} value={entry.company} onChange={(event) => store.setExperience(index, { company: event.target.value })} />
                      <input className="glass-input" placeholder={experienceCopy.rolePlaceholder} value={entry.role} onChange={(event) => store.setExperience(index, { role: event.target.value })} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input className="glass-input" type="date" value={entry.startDate} onChange={(event) => store.setExperience(index, { startDate: event.target.value })} />
                        <input className="glass-input" type="date" value={entry.endDate} onChange={(event) => store.setExperience(index, { endDate: event.target.value })} disabled={entry.isPresent} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: themeText.mutedStrong, cursor: 'pointer' }}>
                        <input type="checkbox" checked={entry.isPresent} onChange={(event) => store.setExperience(index, { isPresent: event.target.checked })} /> Currently working here
                      </label>
                      <textarea className="glass-input" placeholder={experienceCopy.descriptionPlaceholder} value={entry.description} onChange={(event) => store.setExperience(index, { description: event.target.value })} rows={3} />
                    </div>
                  </div>
                ))}
                {store.experience.length < 4 && (
                  <button className="glass-btn" onClick={() => store.addExperience()}>+ Add {experienceCopy.itemLabel}</button>
                )}
              </div>
            )}

            {currentStepKey === 'education' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>{educationCopy.title}</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>{educationCopy.description}</p>
                <div className="glass" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input className="glass-input" placeholder={educationCopy.institutionPlaceholder} value={store.education.institution} onChange={(event) => store.setEducation({ institution: event.target.value })} />
                    <input className="glass-input" placeholder={educationCopy.degreePlaceholder} value={store.education.degree} onChange={(event) => store.setEducation({ degree: event.target.value })} />
                    <input className="glass-input" placeholder={educationCopy.fieldPlaceholder} value={store.education.fieldOfStudy} onChange={(event) => store.setEducation({ fieldOfStudy: event.target.value })} />
                    <input className="glass-input" placeholder={educationCopy.yearPlaceholder} value={store.education.graduationYear} onChange={(event) => store.setEducation({ graduationYear: event.target.value })} />
                  </div>
                </div>
              </div>
            )}
            {currentStepKey === 'job' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Target a job? <span style={{ color: themeText.mutedStrong }}>(optional)</span></h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>Paste a job description to tailor your portfolio to it.</p>
                <textarea
                  className="glass-input"
                  value={store.jobDescription}
                  onChange={(event) => store.setField('jobDescription', event.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                />
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: themeText.mutedStrong, marginTop: 8 }}>
                  We'll analyze it and restructure your portfolio content to match what this employer wants.
                </p>
              </div>
            )}

            {currentStepKey === 'review' && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Review and Generate</h2>
                <p style={{ color: themeText.muted, fontSize: 14, marginBottom: 24 }}>Everything look good?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ReviewCard label="Profession" value={activeSchema.label} />
                  <ReviewCard label="Name" value={store.name} />
                  <ReviewCard label="Title" value={store.title} />
                  <ReviewCard label="Location" value={store.location} />
                  <ReviewCard label="Skills" value={store.skills.join(', ')} />
                  {visibleFieldKeys.some((key) => !isBuiltInFieldKey(key)) && (
                    <ReviewCard label="Specialized Details" value={`${completedCustomDetails}/${visibleFieldKeys.filter((key) => !isBuiltInFieldKey(key)).length} completed`} />
                  )}
                  {activeSchema.sections.includes('projects') && (
                    <ReviewCard label={projectCopy.title} value={`${store.projects.filter((project) => project.title).length} item(s)`} />
                  )}
                  {activeSchema.sections.includes('experience') && (
                    <ReviewCard label={experienceCopy.title} value={`${store.experience.filter((entry) => entry.company || entry.role).length} entry(ies)`} />
                  )}
                  {activeSchema.sections.includes('education') && (
                    <ReviewCard label={educationCopy.title} value={store.education.institution ? `${store.education.degree} at ${store.education.institution}` : 'Not provided'} />
                  )}
                </div>

                <button
                  className="glass-btn large"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 32 }}
                  onClick={handleGenerate}
                >
                  Generate Portfolio
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--track)' }}>
          <button
            className="glass-btn"
            onClick={prev}
            disabled={store.currentStep === 1}
            style={{ opacity: store.currentStep === 1 ? 0.3 : 1 }}
          >
            Back
          </button>

          {store.currentStep < totalSteps && (
            <button
              className="glass-btn"
              onClick={next}
              disabled={currentStepKey === 'profession' && !store.profession}
            >
              {currentStepKey === 'job' ? (store.jobDescription ? 'Next' : 'Skip') : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: themeText.muted }}>{label}</span>
      <span style={{ fontSize: 14, color: themeText.primary, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '-'}
      </span>
    </div>
  )
}
