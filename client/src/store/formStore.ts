import { create } from 'zustand'

interface Project {
  title: string
  description: string
  githubUrl: string
  liveUrl: string
  techStack: string[]
}

interface Experience {
  company: string
  role: string
  startDate: string
  endDate: string
  isPresent: boolean
  description: string
}

interface Education {
  institution: string
  degree: string
  fieldOfStudy: string
  graduationYear: string
}

interface FormState {
  currentStep: number
  profession: string
  name: string
  title: string
  location: string
  email: string
  phone: string
  linkedin: string
  github: string
  bio: string
  skills: string[]
  projects: Project[]
  experience: Experience[]
  education: Education
  jobDescription: string
  setStep: (step: number) => void
  setProfession: (p: string) => void
  setField: (key: string, value: any) => void
  addSkill: (skill: string) => void
  removeSkill: (skill: string) => void
  setProject: (index: number, data: Partial<Project>) => void
  addProject: () => void
  removeProject: (index: number) => void
  setExperience: (index: number, data: Partial<Experience>) => void
  addExperience: () => void
  removeExperience: (index: number) => void
  setEducation: (data: Partial<Education>) => void
  getFormData: () => Record<string, any>
  reset: () => void
}

const emptyProject: Project = { title: '', description: '', githubUrl: '', liveUrl: '', techStack: [] }
const emptyExperience: Experience = { company: '', role: '', startDate: '', endDate: '', isPresent: false, description: '' }
const emptyEducation: Education = { institution: '', degree: '', fieldOfStudy: '', graduationYear: '' }

export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  profession: '',
  name: '',
  title: '',
  location: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  bio: '',
  skills: [],
  projects: [{ ...emptyProject }],
  experience: [{ ...emptyExperience }],
  education: { ...emptyEducation },
  jobDescription: '',

  setStep: (step) => set({ currentStep: step }),
  setProfession: (p) => set({ profession: p }),
  setField: (key, value) => set({ [key]: value } as any),

  addSkill: (skill) => set((s) => {
    if (s.skills.includes(skill)) return s
    return { skills: [...s.skills, skill] }
  }),
  removeSkill: (skill) => set((s) => ({ skills: s.skills.filter(sk => sk !== skill) })),

  setProject: (index, data) => set((s) => {
    const projects = [...s.projects]
    projects[index] = { ...projects[index], ...data }
    return { projects }
  }),
  addProject: () => set((s) => {
    if (s.projects.length >= 5) return s
    return { projects: [...s.projects, { ...emptyProject }] }
  }),
  removeProject: (index) => set((s) => ({
    projects: s.projects.filter((_, i) => i !== index)
  })),

  setExperience: (index, data) => set((s) => {
    const experience = [...s.experience]
    experience[index] = { ...experience[index], ...data }
    return { experience }
  }),
  addExperience: () => set((s) => {
    if (s.experience.length >= 4) return s
    return { experience: [...s.experience, { ...emptyExperience }] }
  }),
  removeExperience: (index) => set((s) => ({
    experience: s.experience.filter((_, i) => i !== index)
  })),

  setEducation: (data) => set((s) => ({
    education: { ...s.education, ...data }
  })),

  getFormData: () => {
    const s = get()
    return {
      profession: s.profession,
      name: s.name,
      title: s.title,
      location: s.location,
      email: s.email,
      phone: s.phone,
      linkedin: s.linkedin,
      github: s.github,
      bio: s.bio,
      skills: s.skills,
      projects: s.projects.filter(p => p.title),
      experience: s.experience.filter(e => e.company || e.role),
      education: s.education,
      jobDescription: s.jobDescription,
    }
  },

  reset: () => set({
    currentStep: 1,
    profession: '',
    name: '',
    title: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    bio: '',
    skills: [],
    projects: [{ ...emptyProject }],
    experience: [{ ...emptyExperience }],
    education: { ...emptyEducation },
    jobDescription: '',
  }),
}))
