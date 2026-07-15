import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in .env file')
}

let genAI: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null

export const initializeGemini = (apiKey?: string): void => {
  const key = apiKey || API_KEY
  if (key) {
    genAI = new GoogleGenerativeAI(key)
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }
}

export const analyzeImage = async (
  imageData: string,
  prompt: string
): Promise<string> => {
  if (!model) {
    throw new Error('Gemini not initialized. Please provide an API key.')
  }

  const imagePart: Part = {
    inlineData: {
      data: imageData,
      mimeType: 'image/png'
    }
  }

  const result = await model.generateContent([prompt, imagePart])
  const response = await result.response
  const text = response.text()
  
  return text || '无法获取分析结果'
}

export const chatWithImage = async (
  imageData: string,
  messages: Array<{ role: 'user' | 'model'; content: string }>
): Promise<string> => {
  if (!model) {
    throw new Error('Gemini not initialized. Please provide an API key.')
  }

  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }))

  const lastMessage = messages[messages.length - 1]
  
  const imagePart: Part = {
    inlineData: {
      data: imageData,
      mimeType: 'image/png'
    }
  }

  const chat = model.startChat({ history })
  const result = await chat.sendMessage([lastMessage.content, imagePart])
  const response = await result.response
  const text = response.text()
  
  return text || '无法获取回复'
}
