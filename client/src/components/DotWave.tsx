import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function DotWave() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const SEPARATION = 150
    const AMOUNTX = 40
    const AMOUNTY = 60

    let animationId: number
    let count = 0

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.set(0, 355, 1220)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // Create particles
    const numParticles = AMOUNTX * AMOUNTY
    const positions = new Float32Array(numParticles * 3)
    const colors = new Float32Array(numParticles * 3)

    let i = 0
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i * 3] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2)
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2)

        colors[i * 3] = 200 / 255
        colors[i * 3 + 1] = 200 / 255
        colors[i * 3 + 2] = 200 / 255

        i++
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    function animate() {
      animationId = requestAnimationFrame(animate)

      const positions = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array
      let idx = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[idx * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50
          idx++
        }
      }
      particles.geometry.attributes.position.needsUpdate = true
      count += 0.1

      renderer.render(scene, camera)
    }

    animate()

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
