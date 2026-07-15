import { useState, useEffect, useCallback } from 'react'
import { CameraFeed } from './CameraFeed'
import { HandGestureDetector, type HandGesture } from '../lib/handGesture'

interface GestureControlProps {
  images: string[]
  onImageSelect: (image: string) => void
}

export const GestureControl = ({ images, onImageSelect }: GestureControlProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [currentGesture, setCurrentGesture] = useState<HandGesture>({
    type: 'none',
    position: { x: 0, y: 0 }
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const detectorRef = useCallback(() => {
    const detector = new HandGestureDetector()
    return detector
  }, [])

  useEffect(() => {
    if (!isCameraActive) return

    const detector = detectorRef()
    
    detector.initialize((gesture) => {
      setCurrentGesture(gesture)

      if (gesture.type === 'point' && !isAnimating) {
        setIsAnimating(true)
        
        if (gesture.position.x < 33) {
          setSelectedIndex(prev => Math.max(0, prev - 1))
        } else if (gesture.position.x > 66) {
          setSelectedIndex(prev => Math.min(images.length - 1, prev + 1))
        }
        
        setTimeout(() => setIsAnimating(false), 500)
      }

      if (gesture.type === 'open') {
        if (images[selectedIndex]) {
          onImageSelect(images[selectedIndex])
        }
      }
    })

    return () => {
      detector.close()
    }
  }, [isCameraActive, images, selectedIndex, isAnimating, onImageSelect, detectorRef])

  const handleFrame = useCallback((canvas: HTMLCanvasElement) => {
    const detector = detectorRef()
    detector.send(canvas)
  }, [detectorRef])

  const gestureNames: Record<string, string> = {
    none: '无手势',
    open: '张开手掌',
    closed: '握拳',
    point: '一指指向',
    thumbs_up: '点赞',
    peace: '剪刀手'
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          🎮 手势控制图片选择
        </h3>

        <div className="flex justify-center gap-2 mb-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                index === selectedIndex
                  ? 'border-blue-500 scale-110 shadow-lg'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <img
                src={img}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === selectedIndex && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
              isCameraActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isCameraActive ? '关闭摄像头' : '开启摄像头'}
          </button>
        </div>

        {isCameraActive && (
          <div className="space-y-4">
            <CameraFeed onFrame={handleFrame} isActive={isCameraActive} />
            
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">当前手势:</span>
                <span className="font-semibold text-blue-600">
                  {gestureNames[currentGesture.type]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">手势位置:</span>
                <span className="text-gray-600">
                  ({currentGesture.position.x.toFixed(0)}%, {currentGesture.position.y.toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 手势说明</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>👆 <strong>一指指向</strong>: 左右移动选择图片</li>
                <li>🖐️ <strong>张开手掌</strong>: 确认选择当前图片</li>
                <li>✌️ <strong>剪刀手</strong>: 返回上一页</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
