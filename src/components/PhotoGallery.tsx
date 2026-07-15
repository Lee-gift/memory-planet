import { useState, useRef, useEffect, useCallback } from 'react'

interface PhotoGalleryProps {
  images: string[]
}

export const PhotoGallery = ({ images }: PhotoGalleryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeImages, setActiveImages] = useState<Set<number>>(new Set())
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!galleryRef.current) return
      
      const rect = galleryRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePos({ x, y })

      const maxDistance = 40

      images.forEach((_, index) => {
        const imgX = ((index % 10) + 0.5) * 10
        const imgY = (Math.floor(index / 10) + 0.5) * 10
        
        const distance = Math.sqrt(Math.pow(x - imgX, 2) + Math.pow(y - imgY, 2))
        
        if (distance < maxDistance) {
          setActiveImages(prev => new Set([...prev, index]))
        } else {
          setActiveImages(prev => {
            const next = new Set(prev)
            next.delete(index)
            return next
          })
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [images])

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl transition-all duration-500"
          style={{
            left: `${mousePos.x - 192}px`,
            top: `${mousePos.y - 192}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute w-64 h-64 bg-blue-500/20 rounded-full blur-3xl transition-all duration-700"
          style={{
            left: `${mousePos.x - 128}px`,
            top: `${mousePos.y - 128}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            📸 记忆画廊
          </h1>
          <p className="text-white/70 text-lg">
            移动鼠标探索你的美好回忆
          </p>
        </div>

        <div 
          ref={galleryRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3 p-8 rounded-3xl bg-white/5 backdrop-blur-xl"
        >
          {images.map((image, index) => {
            const isActive = activeImages.has(index)
            const isHovered = hoveredIndex === index
            
            return (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={image}
                  alt={`Photo ${index + 1}`}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isHovered 
                      ? 'scale-150 rotate-6' 
                      : isActive 
                        ? 'scale-110' 
                        : 'scale-100 opacity-70'
                  }`}
                  style={{
                    transitionDelay: `${index * 50}ms`
                  }}
                />
                
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">
                      照片 {index + 1}
                    </p>
                  </div>
                </div>

                {isHovered && (
                  <div className="absolute inset-0 border-4 border-white/50 rounded-xl animate-pulse" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full">
            <div 
              className="w-3 h-3 bg-green-400 rounded-full animate-pulse"
            />
            <span className="text-white/80 text-sm">
              已激活 {activeImages.size} 张图片
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
