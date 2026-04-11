import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

const professions = [
  'Developer', 'Designer', 'Doctor', 'Marketer', 'Architect', 'Data Scientist',
  'Lawyer', 'Photographer', 'Freelancer', 'Researcher', 'Chef', 'Engineer',
]

const aboutHighlights = [
  {
    title: 'Designed for speed',
    desc: 'Go from raw details to a polished live portfolio without touching layout code or design tools.',
  },
  {
    title: 'Scored for outcomes',
    desc: 'Portify reviews the portfolio, flags weak spots, and gives you a clear path to improve before you share it.',
  },
  {
    title: 'Built for iteration',
    desc: 'Update your role, target job, or strongest projects and generate a sharper version in the next pass.',
  },
]

const aboutMetrics = [
  { label: 'Input time', value: '< 10 min' },
  { label: 'Portfolio output', value: '1 live link' },
  { label: 'Review loop', value: 'AI-guided' },
]

const contactCards = [
  {
    title: 'Email',
    value: 'hello@portify.app',
    desc: 'Best for feedback, feature requests, and walkthrough questions.',
  },
  {
    title: 'Best for',
    value: 'Students and professionals',
    desc: 'Use Portify to build a strong first impression without spending hours on setup.',
  },
  {
    title: 'Response style',
    value: 'Direct and practical',
    desc: 'Share your goal and context, and we will respond with the shortest useful next step.',
  },
]

const marqueeText = '* Developer * Designer * Doctor * Marketer * Architect * Photographer * Data Scientist * Lawyer * Chef * Freelancer * Engineer * Researcher '
const mutedText = 'var(--muted)'
const mutedStrongText = 'var(--muted-strong)'

type ContactField = 'name' | 'email' | 'message'

export default function Landing() {
  const navigate = useNavigate()
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [contactSent, setContactSent] = useState(false)

  const handleContactChange = (field: ContactField) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setContactSent(false)
    setContactForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const subject = `Portify inquiry from ${contactForm.name}`
    const body = [
      `Name: ${contactForm.name}`,
      `Email: ${contactForm.email}`,
      '',
      contactForm.message,
    ].join('\n')

    window.location.href = `mailto:hello@portify.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setContactSent(true)
  }

  return (
    <div className="landing-page" style={{ position: 'relative', isolation: 'isolate' }}>
      <div className="static-page-backdrop" />
      <Navbar />

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: 60, textAlign: 'center', padding: '60px 24px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="glass"
            style={{ padding: '8px 18px', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.15em', color: mutedStrongText, borderRadius: 9999 }}
          >
            AI-Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 'clamp(56px, 10vw, 96px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            Your portfolio,<br />
            built in <em>seconds.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: 'monospace', fontSize: 18, color: mutedText, maxWidth: 520, lineHeight: 1.6 }}
          >
            Tell us your profession. We handle the rest.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 8 }}
          >
            <button className="glass-btn large" onClick={() => navigate('/register')}>
              Build Mine
            </button>
            <a
              href="#how-it-works"
              style={{ fontFamily: 'monospace', fontSize: 15, color: mutedText, borderBottom: '1px solid var(--border)', paddingBottom: 2 }}
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Strip */}
      <div style={{ width: '100%', background: 'var(--marquee-bg)', color: 'var(--marquee-fg)', padding: '18px 0', overflow: 'hidden', marginTop: 96 }}>
        <div className="marquee-track">
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            {marqueeText}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            {marqueeText}
          </span>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto', scrollMarginTop: 96 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          HOW IT WORKS
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 60 }}>
          Three steps.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { num: '01', title: 'Fill', desc: 'Your name, skills, and profession. Nothing else.' },
            { num: '02', title: 'Match', desc: 'AI picks the right template and tone for your role.' },
            { num: '03', title: 'Ship', desc: 'Live portfolio link. Ready to send.' },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              className="glass"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ padding: '44px 36px' }}
            >
              <div style={{ fontFamily: 'monospace', fontSize: 80, fontWeight: 900, color: 'var(--track-strong)', lineHeight: 1, marginBottom: 16 }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto', scrollMarginTop: 96 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          ABOUT PORTIFY
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Portfolios that explain themselves.
        </h2>
        <p style={{ fontSize: 18, color: mutedText, lineHeight: 1.7, maxWidth: 760, marginBottom: 40 }}>
          Portify turns scattered experience into a focused portfolio with clear structure, measurable feedback, and a live link you can share immediately. It is built for people who need a strong online presence without spending days assembling one.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          <motion.div
            className="glass"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 28 }}
          >
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.12em', marginBottom: 12 }}>
                WHY PEOPLE USE IT
              </div>
              <p style={{ fontSize: 18, color: mutedText, lineHeight: 1.7 }}>
                From students shipping a first portfolio to professionals refining a job-specific version, the workflow stays simple: add your details, review the output, and iterate with AI feedback when needed.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {aboutMetrics.map((metric) => (
                <div
                  key={metric.label}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-soft)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 20,
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.12em', color: mutedStrongText, textTransform: 'uppercase' }}>
                    {metric.label}
                  </span>
                  <strong style={{ fontSize: 18, fontWeight: 700 }}>{metric.value}</strong>
                </div>
              ))}
            </div>
          </motion.div>

          <div style={{ display: 'grid', gap: 16 }}>
            {aboutHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                className="glass"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                style={{ padding: '32px 28px' }}
              >
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          WHAT MAKES IT DIFFERENT
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 40 }}>
          Built different.
        </h2>

        <div className="landing-feature-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              className="glass"
              style={{ padding: '44px 36px', flex: 1 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>Scores your portfolio</h3>
              <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>AI rates it 0-100. Tells you exactly what is weak and why.</p>
            </motion.div>
            <motion.div
              className="glass"
              style={{ padding: '44px 36px', flex: 1 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>Reads job descriptions</h3>
              <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>Paste any JD. We rewrite your portfolio around it.</p>
            </motion.div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              className="glass"
              style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>ATS-ready output</h3>
              <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.6 }}>Passes recruiter filters automatically.</p>
            </motion.div>
            <motion.div
              className="glass"
              style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Recruiter simulation</h3>
              <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.6 }}>See what a recruiter focuses on in 6 seconds.</p>
            </motion.div>
            <motion.div
              className="glass"
              style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Location skill insights</h3>
              <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.6 }}>Know which skills are trending in your city.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Professions Grid */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          FOR EVERY CAREER
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 40 }}>
          Built for everyone.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {professions.map((prof) => (
            <motion.div
              key={prof}
              whileHover={{ scale: 1.02 }}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 9999,
                padding: '14px 22px',
                fontFamily: 'monospace',
                fontSize: 15,
                color: mutedStrongText,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--fg)'
                e.currentTarget.style.color = 'var(--bg)'
                e.currentTarget.style.borderColor = 'var(--fg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--muted-strong)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {prof}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 40px 120px', maxWidth: 1200, margin: '0 auto', scrollMarginTop: 96 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          CONTACT
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Start the conversation.
        </h2>
        <p style={{ fontSize: 18, color: mutedText, lineHeight: 1.7, maxWidth: 760, marginBottom: 40 }}>
          If you want a product walkthrough, have feedback on the generated portfolios, or need help getting started, send the details here and Portify will open a ready-to-send email draft.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          <motion.form
            className="glass"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleContactSubmit}
            style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label htmlFor="contact-name" style={{ display: 'block', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.12em', color: mutedStrongText, marginBottom: 8 }}>
                NAME
              </label>
              <input
                id="contact-name"
                className="glass-input"
                type="text"
                value={contactForm.name}
                onChange={handleContactChange('name')}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-email" style={{ display: 'block', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.12em', color: mutedStrongText, marginBottom: 8 }}>
                EMAIL
              </label>
              <input
                id="contact-email"
                className="glass-input"
                type="email"
                value={contactForm.email}
                onChange={handleContactChange('email')}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-message" style={{ display: 'block', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.12em', color: mutedStrongText, marginBottom: 8 }}>
                MESSAGE
              </label>
              <textarea
                id="contact-message"
                className="glass-input"
                value={contactForm.message}
                onChange={handleContactChange('message')}
                placeholder="What do you want help with?"
                required
              />
            </div>

            <button type="submit" className="glass-btn" style={{ justifyContent: 'center', marginTop: 4 }}>
              Open email draft
            </button>

            {contactSent && (
              <p style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, color: mutedStrongText }}>
                Your mail app should now have a draft addressed to hello@portify.app.
              </p>
            )}
          </motion.form>

          <div style={{ display: 'grid', gap: 16 }}>
            {contactCards.map((card, index) => (
              <motion.div
                key={card.title}
                className="glass"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                style={{ padding: '28px 24px' }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.12em', marginBottom: 10 }}>
                  {card.title.toUpperCase()}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{card.value}</div>
                <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.7 }}>{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '160px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 900, letterSpacing: '-0.04em' }}>
          Ready to stand out?
        </h2>
        <button
          className="glass-btn large"
          style={{ marginTop: 40 }}
          onClick={() => navigate('/register')}
        >
          Build your portfolio
        </button>
        <p style={{ fontFamily: 'monospace', fontSize: 14, color: mutedStrongText, marginTop: 18 }}>
          No account needed. No code. No design skills.
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="pulse-dot"
            aria-hidden="true"
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}
          />
          Portify
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="#about" className="landing-nav-link">About</a>
          <a href="#contact" className="landing-nav-link">Contact</a>
          <span>Built at Rajalakshmi Engineering College - 2025</span>
        </div>
      </footer>
    </div>
  )
}
