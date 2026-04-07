import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

const STAGES = ['Building your portfolio...', 'Adding depth...', 'Almost ready...'] as const
const MIN_DURATION_MS = 4200

function sampleTextPoints(text: string, width: number, height: number, desiredCount: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return []
  }

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(Math.min(width * 0.18, 144))}px Inter, Arial, sans-serif`
  ctx.fillText(text, width / 2, height / 2)

  const imageData = ctx.getImageData(0, 0, width, height).data
  const points: Array<[number, number]> = []
  const step = Math.max(4, Math.floor(Math.sqrt((width * height) / Math.max(desiredCount, 1))))

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = imageData[((y * width) + x) * 4 + 3]
      if (alpha > 140) {
        const nx = (x / width) * 2 - 1
        const ny = -((y / height) * 2 - 1)
        points.push([nx * 2.6, ny * 1.4])
      }
    }
  }

  if (!points.length) {
    return []
  }

  const sampled: Array<[number, number]> = []
  for (let i = 0; i < desiredCount; i += 1) {
    sampled.push(points[i % points.length])
  }
  return sampled
}

export default function GenerationCinematic({ name }: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const progressRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const displayName = useMemo(() => {
    const clean = name.trim().toUpperCase()
    return clean ? clean.slice(0, 18) : 'PORTFOLIO'
  }, [name])

  useEffect(() => {
    let rafId = 0
    const start = performance.now()

    const tick = (now: number) => {
      const next = Math.min((now - start) / MIN_DURATION_MS, 1)
      progressRef.current = next
      setProgress(next)
      if (next < 1) {
        rafId = window.requestAnimationFrame(tick)
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const mobile = window.matchMedia('(max-width: 768px)').matches
    const particleCount = mobile ? 900 : 1800
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setClearColor(0x000000, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100)
    camera.position.z = 7.5

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const targets = new Float32Array(particleCount * 3)
    const wander = new Float32Array(particleCount * 3)
    const textPoints = sampleTextPoints(displayName, 1024, 320, particleCount)

    for (let i = 0; i < particleCount; i += 1) {
      const index = i * 3
      positions[index] = (Math.random() - 0.5) * 11
      positions[index + 1] = (Math.random() - 0.5) * 7
      positions[index + 2] = (Math.random() - 0.5) * 4
      wander[index] = (Math.random() - 0.5) * 0.006
      wander[index + 1] = (Math.random() - 0.5) * 0.004
      wander[index + 2] = (Math.random() - 0.5) * 0.003

      const point = textPoints[i] || [0, 0]
      targets[index] = point[0]
      targets[index + 1] = point[1]
      targets[index + 2] = (Math.random() - 0.5) * 0.4
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: mobile ? 0.03 : 0.022,
        transparent: true,
        opacity: 0.9,
      }),
    )
    scene.add(points)

    const fieldGeometry = new THREE.BufferGeometry()
    const fieldCount = mobile ? 220 : 480
    const fieldPositions = new Float32Array(fieldCount * 3)
    for (let i = 0; i < fieldCount; i += 1) {
      const index = i * 3
      fieldPositions[index] = (Math.random() - 0.5) * 16
      fieldPositions[index + 1] = (Math.random() - 0.5) * 9
      fieldPositions[index + 2] = (Math.random() - 0.5) * 6
    }
    fieldGeometry.setAttribute('position', new THREE.BufferAttribute(fieldPositions, 3))
    const field = new THREE.Points(
      fieldGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.012,
        transparent: true,
        opacity: 0.18,
      }),
    )
    scene.add(field)

    const ring = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.8, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
      }),
    )
    scene.add(ring)

    function resize() {
      const width = window.innerWidth
      const height = window.innerHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    resize()
    window.addEventListener('resize', resize)

    let rafId = 0
    const animate = (now: number) => {
      const time = now * 0.001
      const morph = progressRef.current
      const attribute = geometry.attributes.position as THREE.BufferAttribute

      ring.rotation.x += 0.0012
      ring.rotation.y += 0.0016
      ring.scale.setScalar(1 - (morph * 0.2))
      camera.position.z = 7.5 - (morph * 2.2)

      for (let i = 0; i < particleCount; i += 1) {
        const index = i * 3
        positions[index] += ((targets[index] + Math.sin(time + i) * 0.01) - positions[index]) * (0.026 + (morph * 0.05))
        positions[index + 1] += ((targets[index + 1] + Math.cos(time * 1.1 + i) * 0.008) - positions[index + 1]) * (0.026 + (morph * 0.05))
        positions[index + 2] += ((targets[index + 2]) - positions[index + 2]) * (0.024 + (morph * 0.05))
        positions[index] += wander[index] * (1 - morph)
        positions[index + 1] += wander[index + 1] * (1 - morph)
        positions[index + 2] += wander[index + 2] * (1 - morph)
      }

      attribute.needsUpdate = true
      field.rotation.y += 0.0008
      renderer.render(scene, camera)
      rafId = window.requestAnimationFrame(animate)
    }

    rafId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      fieldGeometry.dispose()
      points.material.dispose()
      field.material.dispose()
      ring.geometry.dispose()
      ring.material.dispose()
      renderer.dispose()
    }
  }, [displayName])

  const stageIndex = progress < 0.38 ? 0 : progress < 0.74 ? 1 : 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 26%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.03), transparent 18%), #000000',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          color: '#ffffff',
        }}
      >
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.5)' }}>
          GENERATING
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={STAGES[stageIndex]}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.3rem)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {STAGES[stageIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        <motion.div
          style={{ height: '100%', background: '#ffffff', transformOrigin: 'left center' }}
          animate={{ scaleX: progress }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
      </div>
    </motion.div>
  )
}

export { MIN_DURATION_MS }
