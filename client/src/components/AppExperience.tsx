import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

type SceneKind = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'simulate'

type ScenePreset = {
  accent: string
  secondary: string
  tertiary: string
  wash: string
  washStrong: string
  panel: string
  outline: string
}

const scenePresets: Record<SceneKind, ScenePreset> = {
  landing: {
    accent: '#7dd3fc',
    secondary: '#a78bfa',
    tertiary: '#f97316',
    wash: 'rgba(125, 211, 252, 0.22)',
    washStrong: 'rgba(167, 139, 250, 0.26)',
    panel: 'rgba(8, 12, 24, 0.56)',
    outline: 'rgba(125, 211, 252, 0.24)',
  },
  auth: {
    accent: '#f472b6',
    secondary: '#818cf8',
    tertiary: '#22d3ee',
    wash: 'rgba(244, 114, 182, 0.18)',
    washStrong: 'rgba(129, 140, 248, 0.24)',
    panel: 'rgba(14, 11, 30, 0.58)',
    outline: 'rgba(244, 114, 182, 0.22)',
  },
  onboarding: {
    accent: '#22d3ee',
    secondary: '#34d399',
    tertiary: '#a78bfa',
    wash: 'rgba(34, 211, 238, 0.16)',
    washStrong: 'rgba(52, 211, 153, 0.18)',
    panel: 'rgba(6, 18, 26, 0.54)',
    outline: 'rgba(34, 211, 238, 0.18)',
  },
  dashboard: {
    accent: '#818cf8',
    secondary: '#22d3ee',
    tertiary: '#f472b6',
    wash: 'rgba(129, 140, 248, 0.2)',
    washStrong: 'rgba(34, 211, 238, 0.18)',
    panel: 'rgba(7, 11, 24, 0.62)',
    outline: 'rgba(129, 140, 248, 0.26)',
  },
  simulate: {
    accent: '#fb923c',
    secondary: '#f472b6',
    tertiary: '#22d3ee',
    wash: 'rgba(251, 146, 60, 0.22)',
    washStrong: 'rgba(244, 114, 182, 0.22)',
    panel: 'rgba(22, 10, 12, 0.62)',
    outline: 'rgba(251, 146, 60, 0.24)',
  },
}

function resolveSceneKind(pathname: string): SceneKind {
  if (pathname.startsWith('/dashboard/simulate')) {
    return 'simulate'
  }
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard'
  }
  if (pathname.startsWith('/onboarding')) {
    return 'onboarding'
  }
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return 'auth'
  }
  return 'landing'
}

function SceneLights({ preset }: { preset: ScenePreset }) {
  const leadLight = useRef<THREE.PointLight>(null)
  const fillLight = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (leadLight.current) {
      leadLight.current.position.x = THREE.MathUtils.lerp(leadLight.current.position.x, state.pointer.x * 2.8, 0.05)
      leadLight.current.position.y = THREE.MathUtils.lerp(leadLight.current.position.y, state.pointer.y * 1.8 + 1.2, 0.05)
    }

    if (fillLight.current) {
      fillLight.current.position.x = THREE.MathUtils.lerp(fillLight.current.position.x, -state.pointer.x * 2.1, 0.04)
      fillLight.current.position.y = THREE.MathUtils.lerp(fillLight.current.position.y, -state.pointer.y * 1.2 - 0.6, 0.04)
    }
  })

  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight intensity={0.55} color={preset.accent} groundColor={preset.secondary} />
      <pointLight ref={leadLight} position={[2.2, 1.8, 4.8]} intensity={12} color={preset.accent} distance={14} />
      <pointLight ref={fillLight} position={[-2.6, -1.2, 3.6]} intensity={8.5} color={preset.secondary} distance={13} />
      <pointLight position={[0, -2.4, 2.4]} intensity={6.5} color={preset.tertiary} distance={12} />
    </>
  )
}

function ParticleLayer({
  preset,
  count,
  radius,
  size,
  speed,
}: {
  preset: ScenePreset
  count: number
  radius: number
  size: number
  speed: number
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const colorA = new THREE.Color(preset.accent)
    const colorB = new THREE.Color(preset.secondary)
    const colorC = new THREE.Color(preset.tertiary)
    const positionsArray = new Float32Array(count * 3)
    const colorsArray = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3
      const angle = Math.random() * Math.PI * 2
      const spiral = radius * (0.35 + Math.random() * 0.9)
      const height = (Math.random() - 0.5) * radius * 1.8
      positionsArray[stride] = Math.cos(angle) * spiral
      positionsArray[stride + 1] = Math.sin(angle * 1.25) * (radius * 0.35) + height * 0.4
      positionsArray[stride + 2] = Math.sin(angle) * spiral * 0.9 + (Math.random() - 0.5) * radius

      const mixedColor = colorA.clone().lerp(index % 2 === 0 ? colorB : colorC, Math.random() * 0.8)
      colorsArray[stride] = mixedColor.r
      colorsArray[stride + 1] = mixedColor.g
      colorsArray[stride + 2] = mixedColor.b
    }

    return {
      positions: positionsArray,
      colors: colorsArray,
    }
  }, [count, preset, radius])

  useFrame((state, delta) => {
    if (!pointsRef.current) {
      return
    }

    pointsRef.current.rotation.y += delta * speed
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, state.pointer.y * 0.12, 0.03)
    pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, state.pointer.x * 0.6, 0.03)
    pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, state.pointer.y * 0.35, 0.03)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        transparent
        opacity={0.72}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function FloatingSolids({
  preset,
  reducedMotion,
}: {
  preset: ScenePreset
  reducedMotion: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  const solids = useMemo(() => ([
    { position: [-2.8, 1.8, -0.6] as const, scale: 0.92, color: preset.accent, kind: 'icosahedron' as const },
    { position: [2.6, -1.4, -0.2] as const, scale: 0.84, color: preset.secondary, kind: 'torus' as const },
    { position: [0.4, 2.2, -1.4] as const, scale: 0.72, color: preset.tertiary, kind: 'octahedron' as const },
    { position: [-1.2, -2.1, -1.1] as const, scale: 0.64, color: preset.secondary, kind: 'torus' as const },
  ]), [preset.accent, preset.secondary, preset.tertiary])

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return
    }

    groupRef.current.rotation.y += delta * (reducedMotion ? 0.08 : 0.16)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, state.pointer.y * 0.18, 0.035)
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, state.pointer.x * 0.55, 0.04)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, state.pointer.y * 0.32, 0.04)
  })

  return (
    <group ref={groupRef}>
      {solids.map((solid, index) => (
        <Float
          key={`${solid.kind}-${index}`}
          speed={reducedMotion ? 0.35 : 0.8 + (index * 0.12)}
          rotationIntensity={reducedMotion ? 0.16 : 0.46}
          floatIntensity={reducedMotion ? 0.22 : 0.56}
        >
          <mesh position={solid.position} scale={solid.scale}>
            {solid.kind === 'icosahedron' && <icosahedronGeometry args={[1.35, 1]} />}
            {solid.kind === 'torus' && <torusKnotGeometry args={[0.68, 0.18, 120, 18]} />}
            {solid.kind === 'octahedron' && <octahedronGeometry args={[1.16, 0]} />}
            <meshPhysicalMaterial
              color={solid.color}
              emissive={solid.color}
              emissiveIntensity={0.3}
              roughness={0.14}
              metalness={0.34}
              clearcoat={1}
              clearcoatRoughness={0.18}
              transparent
              opacity={0.68}
            />
          </mesh>
        </Float>
      ))}

      <mesh position={[0, -0.2, -4.6]} rotation={[Math.PI / 2.8, 0.4, 0]}>
        <torusGeometry args={[3.9, 0.04, 18, 160]} />
        <meshBasicMaterial color={preset.accent} transparent opacity={0.18} />
      </mesh>
      <mesh position={[0.8, -0.1, -5.2]} rotation={[Math.PI / 2.6, -0.5, 0.3]}>
        <torusGeometry args={[5.3, 0.035, 18, 180]} />
        <meshBasicMaterial color={preset.secondary} transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

function ExperienceCanvas({
  preset,
  reducedMotion,
}: {
  preset: ScenePreset
  reducedMotion: boolean
}) {
  return (
    <Canvas
      className="site-3d-stage__canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <SceneLights preset={preset} />
      <ParticleLayer preset={preset} count={reducedMotion ? 180 : 360} radius={6.5} size={0.06} speed={0.08} />
      <ParticleLayer preset={preset} count={reducedMotion ? 100 : 220} radius={9} size={0.04} speed={-0.05} />
      <FloatingSolids preset={preset} reducedMotion={reducedMotion} />
    </Canvas>
  )
}

export default function AppExperience({ children }: { children: ReactNode }) {
  const location = useLocation()
  const reduceMotionPreference = useReducedMotion()
  const reducedMotion = Boolean(reduceMotionPreference)
  const sceneKind = resolveSceneKind(location.pathname)
  const preset = scenePresets[sceneKind]

  useEffect(() => {
    const root = document.documentElement
    const target = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    let frameId = 0

    const updatePointer = (event: PointerEvent) => {
      target.x = event.clientX / Math.max(window.innerWidth, 1)
      target.y = event.clientY / Math.max(window.innerHeight, 1)
    }

    const resetPointer = () => {
      target.x = 0.5
      target.y = 0.5
    }

    const tick = () => {
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08

      root.style.setProperty('--pointer-x-screen', `${(current.x * 100).toFixed(2)}%`)
      root.style.setProperty('--pointer-y-screen', `${(current.y * 100).toFixed(2)}%`)
      root.style.setProperty('--pointer-shift-x', `${((current.x - 0.5) * 76).toFixed(2)}px`)
      root.style.setProperty('--pointer-shift-y', `${((current.y - 0.5) * 76).toFixed(2)}px`)

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    window.addEventListener('pointermove', updatePointer)
    window.addEventListener('pointerleave', resetPointer)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerleave', resetPointer)
    }
  }, [])

  const sceneStyle = {
    '--scene-accent': preset.accent,
    '--scene-secondary': preset.secondary,
    '--scene-tertiary': preset.tertiary,
    '--scene-wash': preset.wash,
    '--scene-wash-strong': preset.washStrong,
    '--scene-panel': preset.panel,
    '--scene-outline': preset.outline,
  } as CSSProperties

  return (
    <div className="app-shell" data-scene={sceneKind} style={sceneStyle}>
      <div className="site-3d-stage" aria-hidden="true">
        <ExperienceCanvas preset={preset} reducedMotion={reducedMotion} />
        <div className="site-3d-stage__wash" />
        <div className="site-3d-stage__grid" />
        <div className="site-3d-stage__grain" />
      </div>
      {children}
    </div>
  )
}
