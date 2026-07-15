import { useState, useRef, useEffect, useCallback } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  image: string
  rotation: number
  rotationSpeed: number
  scale: number
}

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinkleSpeed: number
  twinkleOffset: number
}

interface ShootingStar {
  id: number
  x: number
  y: number
  length: number
  speed: number
  opacity: number
}

interface InteractiveGalleryProps {
  images: string[]
}

const imageCache = new Map<string, HTMLImageElement>()

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

const generateStars = (count: number): Star[] => {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.002 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2
    })
  }
  return stars
}

export const InteractiveGallery = ({ images }: InteractiveGalleryProps) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState<Array<{ x: number; y: number; opacity: number }>>([])
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particleIdRef = useRef(0)
  const animationRef = useRef<number>(0)
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const usedImagesRef = useRef<Set<string>>(new Set())
  const timeRef = useRef(0)
  const starsRef = useRef<Star[]>(generateStars(150))

  useEffect(() => {
    images.forEach(src => {
      loadImage(src).then(img => {
        loadedImagesRef.current.set(src, img)
      }).catch(() => {})
    })
    usedImagesRef.current.clear()
  }, [images])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })

      setTrail(prev => {
        const newTrail = [...prev, { x, y, opacity: 1 }]
        return newTrail.slice(-12)
      })
    }

    const handleClick = () => {
      if (images.length === 0) return

      const availableImages = images.filter(img => !usedImagesRef.current.has(img))
      const imageToUse = availableImages.length > 0
        ? availableImages[Math.floor(Math.random() * availableImages.length)]
        : images[Math.floor(Math.random() * images.length)]

      if (availableImages.length > 0) {
        usedImagesRef.current.add(imageToUse)
      }

      const particleCount = 2
      for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3
          const speed = 2 + Math.random() * 2
          
          const newParticle: Particle = {
            id: particleIdRef.current++,
            x: mousePos.x,
            y: mousePos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1,
            maxLife: 2.5 + Math.random(),
            image: imageToUse,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            scale: 0.4 + Math.random() * 0.4
          }
          setParticles(prev => [...prev, newParticle])
        }, i * 150)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationRef.current)
    }
  }, [images, mousePos.x, mousePos.y])

  useEffect(() => {
    setTrail(prev => 
      prev.map(point => ({ ...point, opacity: point.opacity * 0.88 }))
         .filter(point => point.opacity > 0.05)
    )
  }, [])

  useEffect(() => {
    setParticles(prev => 
      prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.03,
        life: p.life - 0.008,
        rotation: p.rotation + p.rotationSpeed,
        scale: p.scale * 0.997
      })).filter(p => p.life > 0)
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const newShootingStar: ShootingStar = {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: -20,
          length: 80 + Math.random() * 60,
          speed: 4 + Math.random() * 3,
          opacity: 0.8
        }
        setShootingStars(prev => [...prev, newShootingStar])

        setTimeout(() => {
          setShootingStars(prev => prev.filter(s => s.id !== newShootingStar.id))
        }, 2000)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setShootingStars(prev => 
      prev.map(s => ({
        ...s,
        x: s.x + s.speed * 1.5,
        y: s.y + s.speed,
        opacity: s.opacity * 0.98
      })).filter(s => s.y < window.innerHeight + 50)
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      timeRef.current += 0.002
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      starsRef.current.forEach(star => {
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 1000 + star.twinkleOffset)
        const opacity = star.opacity + twinkle * 0.2
        
        ctx.beginPath()
        ctx.arc(
          (star.x / 100) * canvas.width,
          (star.y / 100) * canvas.height,
          star.size,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fill()

        if (star.size > 1.5) {
          ctx.beginPath()
          ctx.arc(
            (star.x / 100) * canvas.width,
            (star.y / 100) * canvas.height,
            star.size * 2,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = `rgba(200, 220, 255, ${opacity * 0.3})`
          ctx.fill()
        }
      })

      shootingStars.forEach(star => {
        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x - star.length * 1.5, star.y - star.length
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
        gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.opacity})`)
        gradient.addColorStop(1, `rgba(150, 180, 255, ${star.opacity * 0.5})`)

        ctx.beginPath()
        ctx.moveTo(star.x, star.y)
        ctx.lineTo(star.x - star.length * 1.5, star.y - star.length)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      })

      particles.forEach(particle => {
        const size = 90 * particle.life * particle.scale
        const img = loadedImagesRef.current.get(particle.image)

        if (img) {
          ctx.save()
          ctx.globalAlpha = particle.life * 0.9
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.translate(-size / 2, -size / 2)
          
          ctx.shadowColor = 'rgba(200, 220, 255, 0.6)'
          ctx.shadowBlur = 15
          
          ctx.drawImage(img, 0, 0, size, size)
          ctx.restore()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [particles, shootingStars])

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(file => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const result = event.target?.result as string
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 3 + Math.random() * 0.2
                const speed = 2 + Math.random() * 2
                
                const newParticle: Particle = {
                  id: particleIdRef.current++,
                  x: mousePos.x + (Math.random() - 0.5) * 100,
                  y: mousePos.y + (Math.random() - 0.5) * 100,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed - 0.5,
                  life: 1,
                  maxLife: 3 + Math.random(),
                  image: result,
                  rotation: Math.random() * Math.PI * 2,
                  rotationSpeed: (Math.random() - 0.5) * 0.02,
                  scale: 0.5 + Math.random() * 0.3
                }
                setParticles(prev => [...prev, newParticle])
              }, i * 120)
            }
          }
          reader.readAsDataURL(file)
        })
      }
    }
    input.click()
  }, [mousePos.x, mousePos.y])

  const handleReset = useCallback(() => {
    usedImagesRef.current.clear()
    setParticles([])
  }, [])

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2a2a5a 60%, #1a1a3a 100%)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl transition-all duration-1500"
          style={{
            left: `${mousePos.x - 300}px`,
            top: `${mousePos.y - 300}px`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-3xl transition-all duration-1200"
          style={{
            left: `${mousePos.x - 200}px`,
            top: `${mousePos.y - 200}px`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(60px)'
          }}
        />
        <div 
          className="absolute w-[250px] h-[250px] bg-cyan-300/8 rounded-full blur-3xl transition-all duration-800"
          style={{
            left: `${mousePos.x - 125}px`,
            top: `${mousePos.y - 125}px`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(40px)'
          }}
        />
      </div>

      {trail.map((point, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white/30 backdrop-blur-sm"
          style={{
            width: `${10 - index * 0.5}px`,
            height: `${10 - index * 0.5}px`,
            left: `${point.x}px`,
            top: `${point.y}px`,
            opacity: point.opacity * 0.7,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out',
            boxShadow: '0 0 8px rgba(150, 180, 255, 0.4)'
          }}
        />
      ))}

      <div className="relative z-20 absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/10">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            ✨ 星空记忆画廊
          </h1>
          <p className="text-white/70 text-center">
            在星空下回忆美好的时光
          </p>
        </div>
      </div>

      <div className="relative z-20 absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={handleImageUpload}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>上传照片</span>
        </button>

        <button
          onClick={handleReset}
          className="px-6 py-4 bg-white/10 backdrop-blur-xl text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 shadow-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>重置</span>
        </button>
      </div>

      <div className="relative z-20 absolute top-8 right-8">
        <div className="bg-black/30 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/10">
          <p className="text-white/80 text-sm font-medium mb-2">💡 操作提示</p>
          <ul className="text-white/60 text-xs space-y-1">
            <li>🖱️ 移动鼠标 - 星光跟随</li>
            <li>👆 点击屏幕 - 释放照片</li>
            <li>📤 上传照片 - 添加新回忆</li>
            <li>🔄 重置 - 重新开始</li>
          </ul>
        </div>
      </div>

      <div className="relative z-20 absolute bottom-8 right-8 text-white/40 text-sm">
        <p>已展示: {usedImagesRef.current.size} / {images.length} 张</p>
        <p>当前粒子: {particles.length}</p>
      </div>
    </div>
  )
}
