import { useState, useRef, useEffect, useCallback } from 'react'

interface SphereImage {
  id: number
  url: string
  theta: number
  phi: number
  size: number
}

interface SphereGalleryProps {
  images: string[]
  onImageSelect: (imageUrl: string) => void
  resetKey?: number
}

export const SphereGallery = ({ images, onImageSelect, resetKey }: SphereGalleryProps) => {
  const [sphereImages, setSphereImages] = useState<SphereImage[]>([])
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'zooming' | 'preview' | 'closing'>('idle')
  const [isSlideshow, setIsSlideshow] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const imageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const starsRef = useRef<Array<{ width: number; height: number; left: string; top: string; animationDuration: number; animationDelay: number }>>([])
  const slideshowIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    const newImages: SphereImage[] = images.map((url, index) => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const size = 55 + Math.random() * 45
      
      return {
        id: index,
        url,
        theta,
        phi,
        size
      }
    })
    setSphereImages(newImages)
  }, [images])

  useEffect(() => {
    if (resetKey !== undefined) {
      setRotation({ x: 0, y: 0 })
    }
  }, [resetKey])

  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 200 }, () => ({
        width: Math.random() * 2 + 0.5,
        height: Math.random() * 2 + 0.5,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: 2.5 + Math.random() * 3.5,
        animationDelay: Math.random() * 2.5
      }))
    }
  }, [])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (animationPhase !== 'idle') return
      isDraggingRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || animationPhase !== 'idle') return

      const deltaX = e.clientX - lastMouseRef.current.x
      const deltaY = e.clientY - lastMouseRef.current.y

      setRotation(prev => ({
        x: Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev.x - deltaY * 0.003)),
        y: prev.y + deltaX * 0.003
      }))

      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (animationPhase !== 'idle') return
      isDraggingRef.current = true
      const touch = e.touches[0]
      lastMouseRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || animationPhase !== 'idle') return
      e.preventDefault()

      const touch = e.touches[0]
      const deltaX = touch.clientX - lastMouseRef.current.x
      const deltaY = touch.clientY - lastMouseRef.current.y

      setRotation(prev => ({
        x: Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev.x - deltaY * 0.003)),
        y: prev.y + deltaX * 0.003
      }))

      lastMouseRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewImage) {
        if (e.key === 'Escape') {
          closePreview()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          prevImage()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          nextImage()
        }
      } else if (e.key === 'Escape') {
        setShowPanel(!showPanel)
        setShowSettings(false)
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewImage, animationPhase])

  useEffect(() => {
    if (isSlideshow && previewImage) {
      slideshowIntervalRef.current = window.setInterval(() => {
        nextImage()
      }, 4000)
    } else {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current)
      }
    }

    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current)
      }
    }
  }, [isSlideshow, previewImage])

  const handleImageClick = useCallback((image: SphereImage) => {
    if (animationPhase !== 'idle') return
    
    setSelectedId(image.id)
    setPreviewImage(image.url)
    setPreviewIndex(image.id)
    setAnimationPhase('zooming')
    
    setTimeout(() => {
      setAnimationPhase('preview')
      onImageSelect(image.url)
    }, 400)
  }, [animationPhase, onImageSelect])

  const closePreview = useCallback(() => {
    if (animationPhase !== 'preview') return
    
    setAnimationPhase('closing')
    setIsSlideshow(false)
    
    setTimeout(() => {
      setPreviewImage(null)
      setSelectedId(null)
      setAnimationPhase('idle')
    }, 400)
  }, [animationPhase])

  const nextImage = useCallback(() => {
    if (images.length === 0 || animationPhase !== 'preview') return
    const nextIdx = (previewIndex + 1) % images.length
    setPreviewIndex(nextIdx)
    setPreviewImage(images[nextIdx])
    setSelectedId(nextIdx)
    onImageSelect(images[nextIdx])
  }, [images, previewIndex, animationPhase, onImageSelect])

  const prevImage = useCallback(() => {
    if (images.length === 0 || animationPhase !== 'preview') return
    const prevIdx = (previewIndex - 1 + images.length) % images.length
    setPreviewIndex(prevIdx)
    setPreviewImage(images[prevIdx])
    setSelectedId(prevIdx)
    onImageSelect(images[prevIdx])
  }, [images, previewIndex, animationPhase, onImageSelect])

  const getImageStyle = (image: SphereImage) => {
    const { theta, phi, size } = image
    const { x: rotX, y: rotY } = rotation
    
    const radius = 220
    
    const sinPhi = Math.sin(phi)
    const cosPhi = Math.cos(phi)
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    
    let x = radius * sinPhi * cosTheta
    let y = radius * cosPhi
    let z = radius * sinPhi * sinTheta
    
    const cosRotX = Math.cos(rotX)
    const sinRotX = Math.sin(rotX)
    const cosRotY = Math.cos(rotY)
    const sinRotY = Math.sin(rotY)
    
    const tempX = x
    const tempY = y
    const tempZ = z
    
    x = tempX * cosRotY - tempZ * sinRotY
    z = tempX * sinRotY + tempZ * cosRotY
    
    y = tempY * cosRotX - z * sinRotX
    z = tempY * sinRotX + z * cosRotX
    
    const perspective = 650
    const scaleFactor = perspective / (perspective + z)
    
    const screenX = x * scaleFactor
    const screenY = y * scaleFactor
    const finalSize = size * scaleFactor * 1.15
    
    const opacity = z > -120 ? Math.min(1, (z + 180) / 240) : 0.05
    
    let imageRotationY = Math.atan2(x, z)
    let imageRotationX = -Math.asin(y / radius)
    
    return {
      transform: `translate(${screenX}px, ${screenY}px) rotateY(${imageRotationY}rad) rotateX(${imageRotationX}rad)`,
      opacity,
      width: `${finalSize}px`,
      height: `${finalSize}px`,
      zIndex: Math.floor(z) + 100,
      display: z < -180 ? 'none' : 'block'
    }
  }

  const toggleSlideshow = () => {
    if (!previewImage && images.length > 0) {
      handleImageClick(sphereImages[0])
      setIsSlideshow(true)
    } else {
      setIsSlideshow(!isSlideshow)
    }
  }

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying)
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-screen h-screen overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'radial-gradient(circle at 50% 45%, #061328 0%, #010714 42%, #000105 100%)',
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {starsRef.current.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              left: star.left,
              top: star.top,
              background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(91,231,255,0.5) 50%, transparent 100%)',
              animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
              animationDelay: `${star.animationDelay}s`
            }}
          />
        ))}
      </div>

      <div className={`hud ${showPanel ? '' : 'hidden'}`}>
        <div className="hud-header">
          <button className="panel-close" onClick={() => setShowPanel(false)}>×</button>
          <h1>我的记忆宇宙</h1>
          <div className="status">
            <span className={`dot ${images.length > 0 ? 'ready' : ''}`}></span>
            <span>{images.length} 张照片</span>
          </div>
        </div>
        <div className="hud-controls">
          <div className="universe-stats">
            <div className="stat-card">
              <b>{images.length}</b>
              <span>照片总数</span>
            </div>
            <div className="stat-card">
              <b>{sphereImages.length}</b>
              <span>已加载</span>
            </div>
          </div>
          <div className="universe-tools">
            <button className="primary" onClick={toggleSlideshow}>
              {isSlideshow ? '⏸ 暂停播放' : '▶ 开始播放'}
            </button>
            <button onClick={() => setRotation({ x: 0, y: 0 })}>↻ 重置</button>
            <button onClick={() => setShowPanel(false)}>◉ 隐藏</button>
          </div>
        </div>
      </div>

      <button 
        className="panel-toggle"
        onClick={() => setShowPanel(!showPanel)}
      >
        ☰
      </button>

      <div className="quick-actions">
        <button className="quick-btn" title="用户">
          <span className="user-icon"></span>
        </button>
        <button 
          className={`quick-btn ${isMusicPlaying ? 'active' : ''}`} 
          title="音乐"
          onClick={toggleMusic}
        >
          {isMusicPlaying ? '♬' : '♪'}
        </button>
        <button 
          className={`quick-btn ${showSettings ? 'active' : ''}`} 
          title="设置"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙
        </button>
        <button 
          className="quick-btn" 
          title="全屏"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              document.documentElement.requestFullscreen()
            }
          }}
        >
          ⛶
        </button>
      </div>

      <div className={`floating-settings ${showSettings ? 'show' : ''}`}>
        <header>
          <h2>设置</h2>
          <button className="fs-close" onClick={() => setShowSettings(false)}>×</button>
        </header>
        <div className="settings-body">
          <div className="field">
            <label>自动播放</label>
            <input 
              type="checkbox" 
              checked={isSlideshow} 
              onChange={(e) => {
                if (e.target.checked) {
                  toggleSlideshow()
                } else {
                  setIsSlideshow(false)
                }
              }} 
            />
          </div>
          <div className="field">
            <label>音乐</label>
            <input 
              type="checkbox" 
              checked={isMusicPlaying} 
              onChange={(e) => setIsMusicPlaying(e.target.checked)} 
            />
          </div>
        </div>
      </div>

      <div className="layout-float">
        <button 
          className="layout-btn"
          onClick={() => setRotation({ x: 0, y: 0 })}
          title="重置视角"
        >
          ↻
        </button>
        <button 
          className={`layout-btn ${isSlideshow ? 'active' : ''}`}
          onClick={toggleSlideshow}
          title="幻灯片"
        >
          {isSlideshow ? '⏸' : '▶'}
        </button>
        <button 
          className="layout-btn"
          onClick={() => {
            if (images.length > 0) {
              handleImageClick(sphereImages[0])
            }
          }}
          title="查看第一张"
        >
          ◉
        </button>
      </div>

      <div className="gesture-card">
        <div className="gesture-grid">
          <button 
            className="gesture" 
            onClick={() => setRotation(prev => ({ ...prev, y: prev.y - 0.5 }))}
            title="向左旋转"
          >
            <strong>‹</strong>
          </button>
          <button 
            className="gesture" 
            onClick={() => setRotation(prev => ({ ...prev, y: prev.y + 0.5 }))}
            title="向右旋转"
          >
            <strong>›</strong>
          </button>
          <button 
            className="gesture" 
            onClick={() => setRotation(prev => ({ ...prev, x: Math.max(-Math.PI/2.1, prev.x - 0.3) }))}
            title="向上旋转"
          >
            <strong>↑</strong>
          </button>
          <button 
            className="gesture" 
            onClick={() => setRotation(prev => ({ ...prev, x: Math.min(Math.PI/2.1, prev.x + 0.3) }))}
            title="向下旋转"
          >
            <strong>↓</strong>
          </button>
        </div>
      </div>

      <div 
        className="absolute left-1/2 top-1/2"
        style={{
          width: '0px',
          height: '0px',
          transformStyle: 'preserve-3d',
          pointerEvents: animationPhase !== 'idle' ? 'none' : 'auto'
        }}
      >
        <div
          className="relative"
          style={{
            width: '500px',
            height: '500px',
            left: '-250px',
            top: '-250px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: '0px',
              height: '0px',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotation.x}rad) rotateY(${rotation.y}rad)`
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '440px',
                height: '440px',
                background: 'radial-gradient(circle at 30% 30%, rgba(91, 231, 255, 0.12) 0%, rgba(43, 115, 255, 0.06) 30%, rgba(30, 50, 100, 0.02) 60%, transparent 100%)',
                boxShadow: 'inset 0 0 120px rgba(91, 231, 255, 0.08), inset 0 0 200px rgba(91, 231, 255, 0.03), 0 0 40px rgba(91, 231, 255, 0.08)',
                pointerEvents: 'none',
                border: '1px solid rgba(91, 231, 255, 0.08)'
              }}
            />
            
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle at 35% 35%, rgba(184, 247, 255, 0.06) 0%, transparent 50%)',
                pointerEvents: 'none',
                border: '1px solid rgba(184, 247, 255, 0.04)'
              }}
            />
            
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '360px',
                height: '360px',
                background: 'radial-gradient(circle at 40% 40%, rgba(224, 255, 255, 0.04) 0%, transparent 40%)',
                pointerEvents: 'none',
                border: '1px solid rgba(224, 255, 255, 0.02)'
              }}
            />

            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: '440px',
                height: '440px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }}
            />

            {sphereImages.map(image => {
              const style = getImageStyle(image)
              
              if (style.display === 'none') return null

              return (
                <div
                  key={image.id}
                  ref={el => imageRefs.current[image.id] = el}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    hoveredId === image.id ? 'scale-110' : ''
                  }`}
                  style={{
                    ...style,
                    transform: `translate(-50%, -50%) ${style.transform}`,
                    opacity: selectedId === image.id && animationPhase !== 'idle' ? 0 : style.opacity
                  }}
                  onMouseEnter={() => setHoveredId(image.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleImageClick(image)}
                >
                  <div
                    className={`relative rounded-lg overflow-hidden ${
                      hoveredId === image.id ? 'ring-2 ring-[#5be7ff]' : ''
                    }`}
                    style={{
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'visible',
                      boxShadow: hoveredId === image.id 
                        ? '0 0 30px rgba(91, 231, 255, 0.6), 0 8px 30px rgba(0, 0, 0, 0.5)' 
                        : '0 6px 24px rgba(0, 0, 0, 0.5)',
                      transition: 'box-shadow 0.3s, ring 0.3s'
                    }}
                  >
                    <img
                      src={image.url}
                      alt={`Image ${image.id}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {hoveredId === image.id && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white/80 font-medium text-xs px-2 py-1 rounded-full bg-white/10">
                          点击查看
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {(animationPhase === 'zooming' || animationPhase === 'preview' || animationPhase === 'closing') && previewImage && (
        <div 
          className={`slideshow-player ${animationPhase === 'preview' ? 'show visible' : ''}`}
          onClick={closePreview}
        >
          <button 
            className="slideshow-nav prev"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            ‹
          </button>
          
          <div className="slideshow-stage" onClick={e => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Preview"
              className="ready"
              draggable={false}
            />
          </div>
          
          <button 
            className="slideshow-nav next"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            ›
          </button>
          
          <div className="slideshow-meta">
            <strong>照片 {previewIndex + 1}</strong>
            <span>{previewIndex + 1} / {images.length}</span>
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
            <button onClick={(e) => { e.stopPropagation(); toggleSlideshow(); }}>
              {isSlideshow ? '⏸' : '▶'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
            <button onClick={(e) => { e.stopPropagation(); closePreview(); }}>×</button>
          </div>
        </div>
      )}

      <style>{`
        :root {
          --ink: #eef8ff;
          --muted: #a8bed4;
          --panel: rgba(5, 13, 24, 0.5);
          --panel-control: rgba(5, 13, 24, 0.52);
          --panel-popover: rgba(5, 13, 24, 0.62);
          --panel-line: rgba(120, 216, 255, 0.22);
          --control-surface: rgba(255, 255, 255, 0.07);
          --control-hover: rgba(91, 231, 255, 0.13);
          --control-active: rgba(91, 231, 255, 0.18);
          --accent: #5be7ff;
          --accent-3: #b8f7ff;
          --ok: #8dffcf;
          --warn: #ffd166;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        .hud {
          position: fixed;
          top: max(16px, env(safe-area-inset-top));
          left: max(16px, env(safe-area-inset-left));
          z-index: 8;
          display: flex;
          flex-direction: column;
          width: min(372px, calc(100vw - 32px));
          max-height: calc(100vh - 32px);
          border: 1px solid var(--panel-line);
          border-radius: 8px;
          background: var(--panel);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.34);
          overflow: hidden;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .hud.hidden {
          transform: translateX(-120%);
          opacity: 0;
          pointer-events: none;
        }

        .panel-close {
          display: none;
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          min-height: 34px;
          padding: 0;
          border: 1px solid rgba(120, 216, 255, 0.22);
          border-radius: 6px;
          background: rgba(8, 25, 42, 0.74);
          color: var(--muted);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          transition: color 0.16s, border-color 0.16s, background 0.16s;
        }

        .panel-close:hover {
          color: var(--ink);
          border-color: rgba(91, 231, 255, 0.58);
          background: rgba(91, 231, 255, 0.1);
        }

        .hud-header {
          position: relative;
          padding: 15px 15px 11px;
          border-bottom: 1px solid var(--panel-line);
        }

        .hud-header h1 {
          margin: 0 0 7px;
          font-size: 18px;
          line-height: 1.2;
          color: var(--ink);
        }

        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 20px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--warn);
          box-shadow: 0 0 18px var(--warn);
        }

        .dot.ready {
          background: var(--ok);
          box-shadow: 0 0 18px var(--ok);
        }

        .hud-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 13px 15px 15px;
          overflow: auto;
        }

        .universe-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .stat-card {
          min-height: 58px;
          padding: 10px;
          border: 1px solid rgba(120, 216, 255, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.035);
        }

        .stat-card b {
          display: block;
          color: var(--ink);
          font-size: 18px;
          line-height: 1.1;
          margin-bottom: 3px;
        }

        .stat-card span {
          color: var(--muted);
          font-size: 12px;
        }

        .universe-tools {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 72px 72px;
          gap: 8px;
        }

        button {
          min-height: 34px;
          border: 1px solid var(--panel-line);
          border-radius: 6px;
          background: var(--control-surface);
          color: var(--ink);
          font: inherit;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease;
        }

        button:hover {
          border-color: rgba(91, 231, 255, 0.8);
          background: var(--control-hover);
        }

        .primary {
          background: linear-gradient(135deg, rgba(91, 231, 255, 0.22), rgba(43, 115, 255, 0.16));
        }

        .panel-toggle {
          position: fixed;
          top: max(16px, env(safe-area-inset-top));
          left: 16px;
          z-index: 10;
          width: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid color-mix(in srgb, var(--panel-line) 80%, transparent);
          border-radius: 999px;
          background: var(--panel-control);
          backdrop-filter: blur(16px);
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          transition: left 0.3s ease, color 0.16s;
        }

        body:not(.panel-hidden) .panel-toggle {
          left: 404px;
        }

        .panel-toggle:hover {
          color: var(--ink);
          border-color: rgba(91, 231, 255, 0.58);
        }

        .quick-actions {
          position: fixed;
          top: max(16px, env(safe-area-inset-top));
          right: max(20px, env(safe-area-inset-right));
          z-index: 10;
          display: grid;
          grid-template-columns: 44px;
          grid-template-rows: repeat(4, 44px);
          gap: 8px;
          align-items: start;
          justify-items: end;
        }

        body:not(.panel-hidden) .quick-actions {
          z-index: 7;
          opacity: 0.58;
        }

        .quick-btn {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid color-mix(in srgb, var(--panel-line) 80%, transparent);
          border-radius: 999px;
          background: var(--panel-control);
          backdrop-filter: blur(16px);
          font-size: 18px;
          line-height: 1;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: border-color 0.16s, background 0.16s, color 0.16s;
        }

        .quick-btn:hover,
        .quick-btn.active {
          border-color: rgba(91, 231, 255, 0.8);
          background: var(--control-active);
          color: var(--ink);
        }

        .user-icon {
          position: relative;
          display: block;
          width: 22px;
          height: 22px;
        }

        .user-icon::before,
        .user-icon::after {
          content: "";
          position: absolute;
          left: 50%;
          border: 2px solid currentColor;
          transform: translateX(-50%);
        }

        .user-icon::before {
          top: 2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .user-icon::after {
          bottom: 1px;
          width: 16px;
          height: 9px;
          border-radius: 10px 10px 4px 4px;
          border-bottom-width: 0;
        }

        .floating-settings {
          position: fixed;
          top: max(16px, env(safe-area-inset-top));
          right: 62px;
          z-index: 12;
          display: none;
          width: min(340px, calc(100vw - 92px));
          max-height: calc(100vh - 32px);
          border: 1px solid rgba(120, 216, 255, 0.18);
          border-radius: 8px;
          padding: 12px;
          background: var(--panel-popover);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.38);
          overflow: auto;
        }

        .floating-settings.show {
          display: grid;
          gap: 10px;
        }

        .floating-settings header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--panel-line);
        }

        .fs-close {
          appearance: none;
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
          line-height: 1;
          border-radius: 4px;
          transition: color 0.15s;
        }

        .fs-close:hover {
          color: var(--ink);
        }

        .floating-settings h2 {
          margin: 0;
          font-size: 14px;
          line-height: 1.2;
          color: var(--ink);
        }

        .settings-body {
          display: grid;
          gap: 10px;
        }

        .field {
          display: grid;
          gap: 5px;
          color: var(--muted);
          font-size: 12px;
        }

        .field input {
          width: 100%;
          min-height: 32px;
          border: 1px solid var(--panel-line);
          border-radius: 6px;
          padding: 6px 8px;
          background: var(--control-surface);
          color: var(--ink);
          font: inherit;
          font-size: 13px;
        }

        .layout-float {
          position: fixed;
          left: 50%;
          bottom: 132px;
          z-index: 6;
          display: flex;
          gap: 6px;
          padding: 8px;
          border: 1px solid var(--panel-line);
          border-radius: 999px;
          background: var(--panel-popover);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.38);
          transform: translateX(-50%);
          transition: transform 0.34s ease, opacity 0.24s ease;
        }

        .layout-btn {
          width: 44px;
          min-width: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid rgba(120, 216, 255, 0.18);
          border-radius: 999px;
          background: var(--control-surface);
          color: var(--muted);
          font-size: 19px;
          cursor: pointer;
          transition: border-color 0.16s, background 0.16s, color 0.16s;
        }

        .layout-btn:hover {
          border-color: rgba(91, 231, 255, 0.8);
          color: var(--ink);
          background: var(--control-hover);
        }

        .layout-btn.active {
          border-color: rgba(91, 231, 255, 0.8);
          background: var(--control-active);
          color: #ffffff;
        }

        .gesture-card {
          position: fixed;
          right: max(20px, env(safe-area-inset-right));
          bottom: max(18px, env(safe-area-inset-bottom));
          z-index: 5;
          width: 44px;
        }

        .gesture-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 8px;
        }

        .gesture {
          appearance: none;
          display: grid;
          place-items: center;
          width: 44px;
          min-height: 44px;
          padding: 0;
          border: 1px solid var(--panel-line);
          border-radius: 999px;
          background: var(--panel-control);
          backdrop-filter: blur(16px);
          color: var(--muted);
          font-size: 0;
          line-height: 1.35;
          cursor: pointer;
          transition: background 0.16s, color 0.16s;
        }

        .gesture:hover {
          background: var(--control-hover);
          color: #d9faff;
        }

        .gesture strong {
          display: block;
          margin: 0;
          color: var(--ink);
          font-size: 19px;
          line-height: 1;
        }

        .slideshow-player {
          position: fixed;
          inset: 0;
          z-index: 21;
          display: none;
          place-items: center;
          padding: clamp(18px, 4vw, 44px);
          background: #000;
          opacity: 0;
          transition: opacity 0.72s ease;
        }

        .slideshow-player.show {
          display: grid;
        }

        .slideshow-player.visible {
          opacity: 1;
        }

        .slideshow-stage {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .slideshow-stage img {
          display: block;
          width: auto;
          height: auto;
          max-width: calc(100vw - clamp(36px, 8vw, 88px));
          max-height: calc(100vh - clamp(36px, 8vw, 88px));
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.24s ease;
        }

        .slideshow-player.visible .slideshow-stage img.ready {
          opacity: 1;
        }

        .slideshow-nav {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: clamp(42px, 7vw, 62px);
          min-height: clamp(54px, 9vw, 82px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.34);
          color: rgba(255, 255, 255, 0.86);
          font-size: clamp(28px, 5vw, 46px);
          line-height: 1;
          transform: translateY(-50%);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: background 0.16s, color 0.16s;
        }

        .slideshow-nav:hover {
          background: rgba(91, 231, 255, 0.16);
          color: #ffffff;
        }

        .slideshow-nav.prev { left: clamp(10px, 3vw, 32px); }
        .slideshow-nav.next { right: clamp(10px, 3vw, 32px); }

        .slideshow-meta {
          position: absolute;
          left: clamp(14px, 4vw, 42px);
          right: clamp(14px, 4vw, 42px);
          bottom: clamp(12px, 3vw, 28px);
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(980px, 100%);
          margin: 0 auto;
          padding: 10px 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.68);
          backdrop-filter: blur(14px);
        }

        .slideshow-meta strong {
          color: var(--ink);
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .slideshow-meta span {
          color: var(--muted);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .slideshow-meta button {
          min-width: 38px;
          padding: 0 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.07);
          color: var(--ink);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.16s, border-color 0.16s;
        }

        .slideshow-meta button:hover {
          border-color: rgba(91, 231, 255, 0.8);
          background: rgba(91, 231, 255, 0.1);
        }

        @media (max-width: 720px) {
          .hud {
            width: min(360px, calc(100vw - 20px));
          }

          body:not(.panel-hidden) .panel-toggle {
            display: none;
          }

          body:not(.panel-hidden) .panel-close {
            display: grid;
            place-items: center;
          }

          .panel-toggle {
            left: max(10px, env(safe-area-inset-left));
            top: max(10px, env(safe-area-inset-top));
          }

          .quick-actions {
            right: max(10px, env(safe-area-inset-right));
            top: max(10px, env(safe-area-inset-top));
          }

          body:not(.panel-hidden) .quick-actions {
            display: grid;
          }

          .floating-settings {
            top: max(10px, env(safe-area-inset-top));
            left: max(10px, env(safe-area-inset-left));
            right: max(10px, env(safe-area-inset-right));
            width: auto;
          }

          .layout-float {
            bottom: 80px;
          }

          .slideshow-nav {
            display: none;
          }

          .slideshow-meta {
            grid-template-columns: minmax(72px, 1fr) auto 44px 44px 44px;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .hud {
            top: max(10px, env(safe-area-inset-top));
            left: max(10px, env(safe-area-inset-left));
            width: min(360px, calc(100vw - 20px));
          }
        }
      `}</style>
    </div>
  )
}