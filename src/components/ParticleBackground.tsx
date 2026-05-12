import { useEffect, useRef, useState } from 'react'
import particleIconUrl from '../assets/particle-icon.svg'

const PARTICLE_COUNT = 70
const REPULSION_RADIUS = 120
const REPULSION_STRENGTH = 4.0
const RETURN_RATE = 0.02

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseVx: number
  baseVy: number
  opacity: number
  size: number
}

function initParticles(width: number, height: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const speed = 0.25 + Math.random() * 0.3
    const angle = Math.random() * Math.PI * 2
    const baseVx = Math.cos(angle) * speed
    const baseVy = Math.sin(angle) * speed
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: baseVx,
      vy: baseVy,
      baseVx,
      baseVy,
      opacity: 0.22 + Math.random() * 0.24,
      size: 22 + Math.random() * 10,
    }
  })
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let canceled = false
    const image = new Image()
    image.onload = () => {
      if (canceled) {
        return
      }
      imageRef.current = image
      setIsLoaded(true)
    }
    image.src = particleIconUrl
    return () => {
      canceled = true
      image.onload = null
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }
    const handleMouseLeave = () => {
      mouseRef.current = null
    }
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) {
        mouseRef.current = { x: touch.clientX, y: touch.clientY }
      }
    }
    const handleTouchEnd = () => {
      mouseRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !imageRef.current) {
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    let cssWidth = 0
    let cssHeight = 0
    let frameId = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) {
        return
      }
      cssWidth = parent.offsetWidth
      cssHeight = parent.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = initParticles(cssWidth, cssHeight)
    }

    const draw = () => {
      const image = imageRef.current
      if (!image) {
        return
      }
      context.clearRect(0, 0, cssWidth, cssHeight)

      for (const particle of particlesRef.current) {
        const mouse = mouseRef.current
        if (mouse) {
          const dx = particle.x - mouse.x
          const dy = particle.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < REPULSION_RADIUS && distance > 0) {
            const force = (REPULSION_RADIUS - distance) / REPULSION_RADIUS
            particle.vx += (dx / distance) * force * REPULSION_STRENGTH
            particle.vy += (dy / distance) * force * REPULSION_STRENGTH
          }
        }

        particle.vx += (particle.baseVx - particle.vx) * RETURN_RATE
        particle.vy += (particle.baseVy - particle.vy) * RETURN_RATE
        particle.x += particle.vx
        particle.y += particle.vy

        const margin = particle.size
        if (particle.x < -margin) particle.x = cssWidth + margin
        else if (particle.x > cssWidth + margin) particle.x = -margin
        if (particle.y < -margin) particle.y = cssHeight + margin
        else if (particle.y > cssHeight + margin) particle.y = -margin

        context.globalAlpha = particle.opacity
        context.drawImage(
          image,
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size,
        )
      }

      context.globalAlpha = 1
      frameId = window.requestAnimationFrame(draw)
    }

    resize()
    frameId = window.requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [isLoaded])

  return <canvas ref={canvasRef} className="particle-background" />
}
