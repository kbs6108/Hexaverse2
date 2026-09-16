'use client';

import { useEffect, useRef } from 'react';

// Extend window object to recognize THREE from the CDN
declare global {
  interface Window {
    THREE: any;
  }
}

const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float time;
  uniform vec2 resolution;

  // Pseudo-random noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main(void) {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Correct aspect ratio
    uv.x *= resolution.x / resolution.y;
    
    // Configurable parameters
    float columns = 60.0;
    
    // Create distinct vertical bands
    float x = floor(uv.x * columns);
    
    // Modulate speed uniquely per column
    float speed = 0.5 + random(vec2(x, 0.0)) * 1.5;
    float timeOffset = time * speed;
    
    // Create the vertical mosaic segments
    float y = floor(uv.y * columns * 2.0 - timeOffset * 5.0);
    
    // Generate block intensity based on its grid position
    float intensity = random(vec2(x, y));
    
    // Isolate only the brightest blocks to create sparse, raining lines
    float alpha = smoothstep(0.85, 1.0, intensity);
    
    // TENREC Color Palette mapping (#0E6B54)
    vec3 baseColor = vec3(0.05, 0.42, 0.33);
    vec3 glowColor = vec3(0.2, 0.8, 0.6);
    
    // Dark background with glowing lines
    vec3 bgColor = vec3(0.01, 0.02, 0.03);
    vec3 finalColor = mix(bgColor, baseColor * alpha + glowColor * (alpha * alpha), alpha * 0.7);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let frameId: number;
    let renderer: any;
    let geometry: any;
    let material: any;

    const initShader = () => {
      const THREE = window.THREE;
      if (!THREE || !containerRef.current) return;

      // 1. Initialize Scene and Camera
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // 2. Setup WebGL Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      
      const { clientWidth, clientHeight } = containerRef.current;
      renderer.setSize(clientWidth, clientHeight);
      containerRef.current.appendChild(renderer.domElement);

      // 3. Define Uniforms
      const uniforms = {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(clientWidth, clientHeight) }
      };

      // 4. Create Material & Geometry
      material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
      });

      geometry = new THREE.PlaneBufferGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // 5. Animation Loop
      let startTime = Date.now();
      const animate = () => {
        if (!isMounted) return;
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        uniforms.time.value = elapsedTime;
        
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      animate();

      // 6. Handle Resize
      const handleResize = () => {
        if (!containerRef.current || !renderer) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        renderer.setSize(width, height);
        uniforms.resolution.value.set(width, height);
      };

      window.addEventListener('resize', handleResize);
      
      // Cleanup resize listener internally
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    let cleanupResize: (() => void) | undefined;

    // Load Three.js v89 via CDN if not present
    if (window.THREE) {
      cleanupResize = initShader();
    } else {
      const scriptId = 'three-js-v89';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/89/three.min.js';
        script.async = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', () => {
        if (isMounted) {
          cleanupResize = initShader();
        }
      });
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (cleanupResize) cleanupResize();
      
      if (renderer) {
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full absolute inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}
