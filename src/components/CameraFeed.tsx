import { useRef, useEffect, useCallback } from 'react'

interface CameraFeedProps {
  onFrame: (canvas: HTMLCanvasElement) => void
  isActive: boolean
}

export const CameraFeed = ({ onFrame, isActive }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      onFrame(canvas)
    }

    animationRef.current = requestAnimationFrame(processFrame)
  }, [onFrame, isActive])

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            processFrame()
          }
        }
      } catch (error) {
        console.error('Failed to access camera:', error)
        alert('无法访问摄像头，请确保已授权')
      }
    }

    startCamera()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isActive, processFrame])

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video
        ref={videoRef}
        className="w-full rounded-xl shadow-lg"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  )
}
