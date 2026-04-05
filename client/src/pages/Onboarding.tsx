import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFormStore } from '../store/formStore'
import { useAuth, API } from '../hooks/useAuth'
import DotWave from '../components/DotWave'

const TOTAL_STEPS = 8

const professionOptions = [
  { key: 'software-engineer', label: 'Software Engineer', emoji: '💻' },
  { key: 'ui-ux-designer', label: 'UI/UX Designer', emoji: '🎨' },
  { key: 'data-scientist', label: 'Data Scientist', emoji: '📊' },
  { key: 'doctor', label: 'Doctor', emoji: '🩺' },
  { key: 'lawyer', label: 'Lawyer', emoji: '⚖️' },
  { key: 'marketing-manager', label: 'Marketing Manager', emoji: '📈' },
  { key: 'architect', label: 'Architect', emoji: '🏛️' },
  { key: 'photographer', label: 'Photographer', emoji: '📸' },
  { key: 'chef', label: 'Chef', emoji: '👨‍🍳' },
  { key: 'freelancer', label: 'Freelancer', emoji: '🚀' },
  { key: 'researcher', label: 'Researcher', emoji: '🔬' },
  { key: 'mechanical-engineer', label: 'Mechanical Engineer', emoji: '⚙️' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const store = useFormStore()
  const [schema, setSchema] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [genStage, setGenStage] = useState(0)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (user?.email && !store.email) {
      store.setField('email', user.email)
      store.setField('name', user.name || '')
    }
  }, [user])

  useEffect(() => {
    if (store.profession) {
      API.get(`/schema/${store.profession}`)
        .then(r => setSchema(r.data))
        .catch(() => {})
    }
  }, [store.profession])

  const next = () => store.setStep(Math.min(store.currentStep + 1, TOTAL_STEPS))
  const prev = () => store.setStep(Math.max(store.currentStep - 1, 1))

  const handleGenerate = async () => {
    setGenerating(true)
    const stages = [
      'Analyzing your data...',
      'Scoring your portfolio...',
      'Enhancing your bio...',
      'Selecting template...',
      'Building your portfolio...',
      'Going live...',
    ]
    const delays = [500, 1000, 2000, 500, 1000, 500]

    for (let i = 0; i < stages.length; i++) {
      setGenStage(i)
      await new Promise(r => setTimeout(r, delays[i]))
    }

    try {
      await API.post('/portfolio/generate', store.getFormData())
      navigate('/dashboard')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Generation failed')
      setGenerating(false)
    }
  }

  const genStages = [
    '● Analyzing your data...',
    '● Scoring your portfolio...',
    '● Enhancing your bio...',
    '● Selecting template...',
    '● Building your portfolio...',
    '● Going live...',
  ]

  if (generating) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <DotWave />
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#52525b', letterSpacing: '0.15em', marginBottom: 16 }}>GENERATING</div>
        {genStages.map((stage, i) => (
          <AnimatePresence key={i}>
            {i <= genStage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === genStage ? 1 : 0.3, y: 0 }}
                style={{ fontFamily: 'monospace', fontSize: 14, color: i === genStage ? '#fafafa' : '#52525b' }}
              >
                {stage}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <DotWave />

      {/* Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', padding: '16px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 800, margin: '0 auto' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#71717a' }}>
            Step {store.currentStep} of {TOTAL_STEPS}
          </span>
          <div style={{ flex: 1, marginLeft: 20, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(store.currentStep / TOTAL_STEPS) * 100}%`, background: '#fafafa', borderRadius: 1, transition: 'width 0.3s ease' }} />
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
            {/* Step 1: Profession */}
            {store.currentStep === 1 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>What's your profession?</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 40 }}>This helps us choose the right template and tone.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {professionOptions.map(p => (
                    <div
                      key={p.key}
                      className="glass"
                      onClick={() => store.setProfession(p.key)}
                      style={{
                        padding: 24,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderColor: store.profession === p.key ? 'rgba(255,255,255,0.6)' : undefined,
                        background: store.profession === p.key ? 'rgba(255,255,255,0.08)' : undefined,
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{p.emoji}</div>
                      <div style={{ fontSize: 13, fontFamily: 'monospace' }}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {store.currentStep === 2 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Basic information</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 40 }}>Tell us about yourself.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Full Name *</label>
                    <input className="glass-input" value={store.name} onChange={e => store.setField('name', e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Professional Title *</label>
                    <input className="glass-input" value={store.title} onChange={e => store.setField('title', e.target.value)} placeholder="Senior React Developer" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Location *</label>
                    <input className="glass-input" value={store.location} onChange={e => store.setField('location', e.target.value)} placeholder="Chennai, India" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Email</label>
                    <input className="glass-input" type="email" value={store.email} onChange={e => store.setField('email', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Phone (optional)</label>
                    <input className="glass-input" value={store.phone} onChange={e => store.setField('phone', e.target.value)} placeholder="+91 ..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>LinkedIn URL (optional)</label>
                    <input className="glass-input" value={store.linkedin} onChange={e => store.setField('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>GitHub URL (optional)</label>
                    <input className="glass-input" value={store.github} onChange={e => store.setField('github', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Portfolio Bio *</label>
                    <textarea className="glass-input" value={store.bio} onChange={e => store.setField('bio', e.target.value)} placeholder="Write about yourself, your experience, and what drives you..." rows={5} />
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b', marginTop: 4 }}>{store.bio.split(/\s+/).filter(Boolean).length} words</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {store.currentStep === 3 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Your skills</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Type a skill and press Enter to add. {store.skills.length} skills added.</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    className="glass-input"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && skillInput.trim()) {
                        e.preventDefault()
                        store.addSkill(skillInput.trim())
                        setSkillInput('')
                      }
                    }}
                    placeholder="Type a skill and press Enter..."
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {store.skills.map(skill => (
                    <span
                      key={skill}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
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
                        style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {schema?.suggestedSkills && (
                  <div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#52525b', marginBottom: 12 }}>Suggested for {schema.label}:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {schema.suggestedSkills.filter((s: string) => !store.skills.includes(s)).map((s: string) => (
                        <button
                          key={s}
                          onClick={() => store.addSkill(s)}
                          style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 9999,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: '#71717a',
                            background: 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fafafa' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#71717a' }}
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Projects */}
            {store.currentStep === 4 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Your projects</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Showcase your best work.</p>
                {store.projects.map((project, idx) => (
                  <div key={idx} className="glass" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a' }}>Project {idx + 1}</span>
                      {idx > 0 && (
                        <button onClick={() => store.removeProject(idx)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="glass-input" placeholder="Project title" value={project.title} onChange={e => store.setProject(idx, { title: e.target.value })} />
                      <textarea className="glass-input" placeholder="What does this project do? What impact did it have?" value={project.description} onChange={e => store.setProject(idx, { description: e.target.value })} rows={3} />
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#52525b' }}>{project.description.length} chars</div>
                      <input className="glass-input" placeholder="GitHub URL (optional)" value={project.githubUrl} onChange={e => store.setProject(idx, { githubUrl: e.target.value })} />
                      <input className="glass-input" placeholder="Live URL (optional)" value={project.liveUrl} onChange={e => store.setProject(idx, { liveUrl: e.target.value })} />
                      <div>
                        <label style={{ fontSize: 12, fontFamily: 'monospace', color: '#71717a', display: 'block', marginBottom: 6 }}>Tech Stack</label>
                        <input
                          className="glass-input"
                          placeholder="Type tech and press Enter..."
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const val = e.currentTarget.value.trim()
                              if (val) {
                                store.setProject(idx, { techStack: [...project.techStack, val] })
                                e.currentTarget.value = ''
                              }
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {project.techStack.map((t, ti) => (
                            <span key={ti} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontFamily: 'monospace', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {t}
                              <button onClick={() => store.setProject(idx, { techStack: project.techStack.filter((_, i) => i !== ti) })} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, padding: 0 }}>×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {store.projects.length < 5 && (
                  <button className="glass-btn" onClick={() => store.addProject()}>+ Add Another Project</button>
                )}
              </div>
            )}

            {/* Step 5: Experience */}
            {store.currentStep === 5 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Work experience</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Add your professional experience.</p>
                {store.experience.map((exp, idx) => (
                  <div key={idx} className="glass" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a' }}>Experience {idx + 1}</span>
                      {idx > 0 && (
                        <button onClick={() => store.removeExperience(idx)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>Remove</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input className="glass-input" placeholder="Company Name" value={exp.company} onChange={e => store.setExperience(idx, { company: e.target.value })} />
                      <input className="glass-input" placeholder="Role / Position" value={exp.role} onChange={e => store.setExperience(idx, { role: e.target.value })} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input className="glass-input" type="date" value={exp.startDate} onChange={e => store.setExperience(idx, { startDate: e.target.value })} />
                        <input className="glass-input" type="date" value={exp.endDate} onChange={e => store.setExperience(idx, { endDate: e.target.value })} disabled={exp.isPresent} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa', cursor: 'pointer' }}>
                        <input type="checkbox" checked={exp.isPresent} onChange={e => store.setExperience(idx, { isPresent: e.target.checked })} /> Currently working here
                      </label>
                      <textarea className="glass-input" placeholder="Describe your role and achievements..." value={exp.description} onChange={e => store.setExperience(idx, { description: e.target.value })} rows={3} />
                    </div>
                  </div>
                ))}
                {store.experience.length < 4 && (
                  <button className="glass-btn" onClick={() => store.addExperience()}>+ Add Experience</button>
                )}
              </div>
            )}

            {/* Step 6: Education */}
            {store.currentStep === 6 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Education</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Your educational background.</p>
                <div className="glass" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input className="glass-input" placeholder="Institution" value={store.education.institution} onChange={e => store.setEducation({ institution: e.target.value })} />
                    <input className="glass-input" placeholder="Degree (e.g. B.Tech, MBA)" value={store.education.degree} onChange={e => store.setEducation({ degree: e.target.value })} />
                    <input className="glass-input" placeholder="Field of Study" value={store.education.fieldOfStudy} onChange={e => store.setEducation({ fieldOfStudy: e.target.value })} />
                    <input className="glass-input" placeholder="Graduation Year" value={store.education.graduationYear} onChange={e => store.setEducation({ graduationYear: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Job Description */}
            {store.currentStep === 7 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Target a job? <span style={{ color: '#52525b' }}>(optional)</span></h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Paste a job description to tailor your portfolio to it.</p>
                <textarea
                  className="glass-input"
                  value={store.jobDescription}
                  onChange={e => store.setField('jobDescription', e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                />
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#52525b', marginTop: 8 }}>
                  We'll analyze it and restructure your portfolio content to match what this employer wants.
                </p>
              </div>
            )}

            {/* Step 8: Review & Generate */}
            {store.currentStep === 8 && (
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Review & Generate</h2>
                <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>Everything look good?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ReviewCard label="Profession" value={professionOptions.find(p => p.key === store.profession)?.label || store.profession} />
                  <ReviewCard label="Name" value={store.name} />
                  <ReviewCard label="Title" value={store.title} />
                  <ReviewCard label="Location" value={store.location} />
                  <ReviewCard label="Skills" value={store.skills.join(', ')} />
                  <ReviewCard label="Projects" value={`${store.projects.filter(p => p.title).length} project(s)`} />
                  <ReviewCard label="Experience" value={`${store.experience.filter(e => e.company).length} entry(ies)`} />
                  <ReviewCard label="Education" value={store.education.institution ? `${store.education.degree} at ${store.education.institution}` : 'Not provided'} />
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

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            className="glass-btn"
            onClick={prev}
            disabled={store.currentStep === 1}
            style={{ opacity: store.currentStep === 1 ? 0.3 : 1 }}
          >
            ← Back
          </button>

          {store.currentStep < TOTAL_STEPS && (
            <button
              className="glass-btn"
              onClick={next}
              disabled={store.currentStep === 1 && !store.profession}
            >
              {store.currentStep === 7 ? (store.jobDescription ? 'Next →' : 'Skip →') : 'Next →'}
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
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#d4d4d8', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '—'}
      </span>
    </div>
  )
}
