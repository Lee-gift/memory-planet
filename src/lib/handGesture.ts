import { Hands, Results, NormalizedLandmark } from '@mediapipe/hands'

export interface HandGesture {
  type: 'none' | 'open' | 'closed' | 'point' | 'thumbs_up' | 'peace'
  position: { x: number; y: number }
}

export class HandGestureDetector {
  private hands: Hands | null = null
  private onGestureDetected: ((gesture: HandGesture) => void) | null = null

  initialize(callback: (gesture: HandGesture) => void) {
    this.onGestureDetected = callback

    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.10.0/${file}`
      }
    })

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    this.hands.onResults(this.onResults.bind(this))
  }

  private onResults(results: Results) {
    if (!this.onGestureDetected || !results.multiHandLandmarks.length) {
      this.onGestureDetected?.({
        type: 'none',
        position: { x: 0, y: 0 }
      })
      return
    }

    const landmarks = results.multiHandLandmarks[0]
    const gesture = this.recognizeGesture(landmarks)
    
    this.onGestureDetected(gesture)
  }

  private recognizeGesture(landmarks: NormalizedLandmark[]): HandGesture {
    const tipIds = [4, 8, 12, 16, 20]
    const pipIds = [2, 6, 10, 14, 18]

    const fingersExtended: boolean[] = tipIds.map((tipId, index) => {
      const tipY = landmarks[tipId].y
      const pipY = landmarks[pipIds[index]].y
      return tipY < pipY
    })

    const thumbExtended = fingersExtended[0]
    const indexExtended = fingersExtended[1]
    const middleExtended = fingersExtended[2]
    const ringExtended = fingersExtended[3]
    const pinkyExtended = fingersExtended[4]

    const allExtended = fingersExtended.every(f => f)
    const noneExtended = fingersExtended.every(f => !f)

    const wrist = landmarks[0]
    const position = {
      x: (wrist.x * 100),
      y: (wrist.y * 100)
    }

    if (allExtended) {
      return { type: 'open', position }
    }

    if (noneExtended) {
      return { type: 'closed', position }
    }

    if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'thumbs_up', position }
    }

    if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'peace', position }
    }

    if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return { type: 'point', position }
    }

    return { type: 'none', position }
  }

  send(canvas: HTMLCanvasElement) {
    if (this.hands) {
      this.hands.send({ image: canvas })
    }
  }

  close() {
    if (this.hands) {
      this.hands.close()
      this.hands = null
    }
  }
}
