import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

const professions = [
  'Developer', 'Designer', 'Doctor', 'Marketer', 'Architect', 'Data Scientist',
  'Lawyer', 'Photographer', 'Freelancer', 'Researcher', 'Chef', 'Engineer',
]

const marqueeText = '✦ Developer ✦ Designer ✦ Doctor ✦ Marketer ✦ Architect ✦ Photographer ✦ Data Scientist ✦ Lawyer ✦ Chef ✦ Freelancer ✦ Engineer ✦ Researcher '
const mutedText = 'var(--muted)'
const mutedStrongText = 'var(--muted-strong)'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }}>
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
      <section id="how-it-works" style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto' }}>
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

      {/* Features Bento Grid */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText, letterSpacing: '0.15em', marginBottom: 12 }}>
          WHAT MAKES IT DIFFERENT
        </div>
        <h2 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 40 }}>
          Built different.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div className="glass" style={{ padding: '44px 36px', flex: 1 }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>Scores your portfolio</h3>
              <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>AI rates it 0-100. Tells you exactly what's weak and why.</p>
            </motion.div>
            <motion.div className="glass" style={{ padding: '44px 36px', flex: 1 }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>Reads job descriptions</h3>
              <p style={{ fontSize: 16, color: mutedText, lineHeight: 1.7 }}>Paste any JD. We rewrite your portfolio around it.</p>
            </motion.div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div className="glass" style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>ATS-ready output</h3>
              <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.6 }}>Passes recruiter filters automatically.</p>
            </motion.div>
            <motion.div className="glass" style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Recruiter simulation</h3>
              <p style={{ fontSize: 15, color: mutedText, lineHeight: 1.6 }}>See what a recruiter focuses on in 6 seconds.</p>
            </motion.div>
            <motion.div className="glass" style={{ padding: '32px 28px' }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
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
      }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pulse-dot">●</span> Portify
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: mutedStrongText }}>
          Built at Rajalakshmi Engineering College - 2025
        </div>
      </footer>
    </div>
  )
}
