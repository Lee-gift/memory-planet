import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface PhotoData {
  id: string;
  url: string;
  title?: string;
  date?: string;
  location?: string;
  description?: string;
}

interface PlanetGalleryProps {
  photos: PhotoData[];
  onPhotoSelect?: (photo: PhotoData) => void;
}

export default function PlanetGallery({ photos, onPhotoSelect }: PlanetGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const photoSpritesRef = useRef<THREE.Sprite[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPhoto, setHoveredPhoto] = useState<number>(-1);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoData | null>(null);
  
  const angularVelocityRef = useRef({ x: 0.002, y: 0.003 });
  const autoSpinRef = useRef(1);
  const zoomRef = useRef(7.3);

  const createStarField = useCallback((scene: THREE.Scene) => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 200;
      positions[i3 + 1] = (Math.random() - 0.5) * 200;
      positions[i3 + 2] = (Math.random() - 0.5) * 200;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      } else if (colorChoice < 0.85) {
        colors[i3] = 0.8;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1;
      } else {
        colors[i3] = 0.9;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 1;
      }
      
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float pixelRatio;
        uniform float time;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 0.5 + position.x * 0.1 + position.y * 0.1 + position.z * 0.1) * 0.3 + 0.7;
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * twinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - dist * 2.0;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;
  }, []);

  const createPhotoSphere = useCallback((scene: THREE.Scene) => {
    const globe = new THREE.Group();
    
    const shellGeometry = new THREE.SphereGeometry(2.02, 64, 64);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x0c87ff,
      transparent: true,
      opacity: 0.065,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    globe.add(shell);

    const innerGlowGeometry = new THREE.SphereGeometry(1.98, 64, 64);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x5be7ff,
      transparent: true,
      opacity: 0.03,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    globe.add(innerGlow);

    photoSpritesRef.current.forEach(sprite => globe.remove(sprite));
    photoSpritesRef.current = [];

    photos.forEach((photo, index) => {
      const theta = (index / photos.length) * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const radius = 2.2;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const loader = new THREE.TextureLoader();
      loader.load(photo.url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        
        const scale = 0.45 + Math.random() * 0.15;
        sprite.scale.set(scale, scale, scale);
        
        sprite.lookAt(0, 0, 0);
        
        sprite.userData = { photo, index };
        photoSpritesRef.current.push(sprite);
        globe.add(sprite);
      });
    });

    scene.add(globe);
    globeRef.current = globe;
  }, [photos]);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000105, 0.032);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0, zoomRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000105, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x5be7ff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 6, 7);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x5be7ff, 1.1, 18);
    fillLight.position.set(-4, -1.5, 5);
    scene.add(fillLight);

    createStarField(scene);
    createPhotoSphere(scene);
  }, [createStarField, createPhotoSphere]);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const updateHoveredPhoto = useCallback((clientX: number, clientY: number) => {
    if (!cameraRef.current || !sceneRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    
    const intersects = raycaster.intersectObjects(photoSpritesRef.current);
    
    if (intersects.length > 0) {
      const index = intersects[0].object.userData.index;
      if (index !== hoveredPhoto) {
        setHoveredPhoto(index);
      }
    } else {
      setHoveredPhoto(-1);
    }
  }, [hoveredPhoto]);

  const onMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    autoSpinRef.current = 0;
    updateHoveredPhoto(e.clientX, e.clientY);
  }, [updateHoveredPhoto]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setRotation(prev => ({
        x: Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev.x - deltaY * 0.005)),
        y: prev.y + deltaX * 0.005
      }));
      
      angularVelocityRef.current = {
        x: -deltaY * 0.003,
        y: deltaX * 0.003
      };
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
    updateHoveredPhoto(e.clientX, e.clientY);
  }, [isDragging, lastMousePos, updateHoveredPhoto]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    autoSpinRef.current = 1;
  }, []);

  const onMouseClick = useCallback((e: MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(photoSpritesRef.current);
    
    if (intersects.length > 0) {
      const photo = intersects[0].object.userData.photo;
      setFullscreenPhoto(photo);
      setShowFullscreen(true);
      onPhotoSelect?.(photo);
    }
  }, [onPhotoSelect]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    zoomRef.current = Math.max(4.5, Math.min(15, zoomRef.current + e.deltaY * 0.005));
    if (cameraRef.current) {
      cameraRef.current.position.z = zoomRef.current;
    }
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      autoSpinRef.current = 0;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const deltaX = e.touches[0].clientX - lastMousePos.x;
      const deltaY = e.touches[0].clientY - lastMousePos.y;
      
      setRotation(prev => ({
        x: Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev.x - deltaY * 0.005)),
        y: prev.y + deltaX * 0.005
      }));
      
      angularVelocityRef.current = {
        x: -deltaY * 0.003,
        y: deltaX * 0.003
      };
      
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [isDragging, lastMousePos]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    autoSpinRef.current = 1;
  }, []);

  const onResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  useEffect(() => {
    initScene();
    
    window.addEventListener('resize', onResize);
    
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, onResize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('click', onMouseClick);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('click', onMouseClick);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseDown, onMouseMove, onMouseUp, onMouseClick, onWheel, onTouchStart, onTouchMove, onTouchEnd]);

  useEffect(() => {
    let time = 0;
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      if (starsRef.current && starsRef.current.material instanceof THREE.ShaderMaterial) {
        starsRef.current.material.uniforms.time.value = time;
      }

      if (!isDragging && autoSpinRef.current > 0) {
        angularVelocityRef.current.x *= 0.98;
        angularVelocityRef.current.y *= 0.98;
        
        setRotation(prev => ({
          x: Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, prev.x + angularVelocityRef.current.x * autoSpinRef.current)),
          y: prev.y + angularVelocityRef.current.y * autoSpinRef.current
        }));
      }

      if (globeRef.current) {
        globeRef.current.rotation.x = rotation.x;
        globeRef.current.rotation.y = rotation.y;
      }

      if (cameraRef.current && rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [rotation, isDragging]);

  useEffect(() => {
    if (!isSlideshow) return;
    
    const interval = setInterval(() => {
      setSlideshowIndex(prev => (prev + 1) % photos.length);
      const photo = photos[slideshowIndex];
      setFullscreenPhoto(photo);
      onPhotoSelect?.(photo);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isSlideshow, slideshowIndex, photos, onPhotoSelect]);

  const handlePrevPhoto = useCallback(() => {
    if (!fullscreenPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === fullscreenPhoto.id);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    const newPhoto = photos[newIndex];
    setFullscreenPhoto(newPhoto);
    setSlideshowIndex(newIndex);
  }, [fullscreenPhoto, photos]);

  const handleNextPhoto = useCallback(() => {
    if (!fullscreenPhoto || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === fullscreenPhoto.id);
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    const newPhoto = photos[newIndex];
    setFullscreenPhoto(newPhoto);
    setSlideshowIndex(newIndex);
  }, [fullscreenPhoto, photos]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#000105]">
      <div ref={containerRef} className="absolute inset-0" />
      
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-white text-xl font-bold tracking-wide">我的记忆宇宙</h1>
        <p className="text-cyan-400 text-sm mt-1">拖动旋转 · 滚轮缩放 · 点击查看</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setIsSlideshow(!isSlideshow)}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
            isSlideshow 
              ? 'bg-cyan-500/20 border border-cyan-500/50' 
              : 'bg-white/10 border border-white/20 hover:bg-white/20'
          }`}
        >
          {isSlideshow ? '⏸ 暂停' : '▶ 播放'}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        <button
          onClick={() => setRotation(prev => ({ ...prev, y: prev.y - 0.5 }))}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-all"
        >
          ‹
        </button>
        <button
          onClick={() => setRotation(prev => ({ ...prev, x: Math.max(-Math.PI/2.1, prev.x - 0.3) }))}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-all"
        >
          ↑
        </button>
        <button
          onClick={() => setRotation(prev => ({ ...prev, x: Math.min(Math.PI/2.1, prev.x + 0.3) }))}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-all"
        >
          ↓
        </button>
        <button
          onClick={() => setRotation(prev => ({ ...prev, y: prev.y + 0.5 }))}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-all"
        >
          ›
        </button>
      </div>

      {showFullscreen && fullscreenPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all"
          >
            ×
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all"
          >
            ‹
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-all"
          >
            ›
          </button>
          
          <img
            src={fullscreenPhoto.url}
            alt={fullscreenPhoto.title || '照片'}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          
          {fullscreenPhoto.title && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <h3 className="text-white text-lg font-medium">{fullscreenPhoto.title}</h3>
              {fullscreenPhoto.date && (
                <p className="text-gray-400 text-sm mt-1">{fullscreenPhoto.date}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}