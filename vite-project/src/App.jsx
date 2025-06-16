import React, { useEffect, useRef, useState } from 'react';

const InteractiveParticleField = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const particlesRef = useRef([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mode, setMode] = useState('attraction');
  const [intensity, setIntensity] = useState(50);

  class Particle {
    constructor(canvas) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.radius = Math.random() * 4 + 2;
      this.opacity = Math.random() * 0.8 + 0.2;
      this.hue = Math.random() * 360;
      this.originalRadius = this.radius;
      this.trail = [];
      this.maxTrailLength = 8;
    }

    update(canvas, mouse, mode, intensity) {
      if (!mouse.isActive) return;

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = intensity * 4;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);

        switch (mode) {
          case 'attraction':
            this.vx += Math.cos(angle) * force * 0.8;
            this.vy += Math.sin(angle) * force * 0.8;
            this.hue = (this.hue + 2) % 360;
            this.radius = this.originalRadius + force * 3;
            break;

          case 'repulsion':
            this.vx -= Math.cos(angle) * force * 1.2;
            this.vy -= Math.sin(angle) * force * 1.2;
            this.hue = (this.hue + 5) % 360;
            this.radius = this.originalRadius + force * 2;
            break;

          case 'orbital':
            const orbitalAngle = angle + Math.PI / 2;
            this.vx += Math.cos(orbitalAngle) * force * 0.6;
            this.vy += Math.sin(orbitalAngle) * force * 0.6;
            this.vx += Math.cos(angle) * force * 0.2;
            this.vy += Math.sin(angle) * force * 0.2;
            this.hue = (distance / maxDistance) * 240;
            this.radius = this.originalRadius + Math.sin(Date.now() * 0.01 + this.x * 0.01) * 2;
            break;

          case 'vortex':
            const vortexAngle = angle + Math.PI / 2 + force * Math.PI;
            this.vx += Math.cos(vortexAngle) * force * 0.8;
            this.vy += Math.sin(vortexAngle) * force * 0.8;
            this.vx += Math.cos(angle) * force * 0.3;
            this.vy += Math.sin(angle) * force * 0.3;
            this.hue = (Date.now() * 0.1 + distance * 2) % 360;
            this.radius = this.originalRadius + Math.sin(force * Math.PI) * 3;
            break;

          case 'wave':
            const waveForce = Math.sin(distance * 0.05 + Date.now() * 0.01) * force;
            this.vx += Math.cos(angle) * waveForce * 0.5;
            this.vy += Math.sin(angle) * waveForce * 0.5;
            this.hue = (distance * 3 + Date.now() * 0.1) % 360;
            this.radius = this.originalRadius + Math.abs(waveForce) * 2;
            break;
        }
      }

      // Apply friction
      this.vx *= 0.95;
      this.vy *= 0.95;

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Add to trail
      this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }

      // Bounce off edges
      if (this.x < 0 || this.x > canvas.width) {
        this.vx *= -0.8;
        this.x = Math.max(0, Math.min(canvas.width, this.x));
      }
      if (this.y < 0 || this.y > canvas.height) {
        this.vy *= -0.8;
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }

      // Gradually return to original radius
      this.radius = this.radius * 0.95 + this.originalRadius * 0.05;
    }

    draw(ctx) {
      // Draw trail
      this.trail.forEach((point, index) => {
        const trailOpacity = (index / this.trail.length) * this.opacity * 0.3;
        const trailRadius = this.originalRadius * (index / this.trail.length) * 0.5;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${trailOpacity})`;
        ctx.fill();
      });

      // Draw main particle
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      // Create gradient
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      gradient.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${this.opacity})`);
      gradient.addColorStop(1, `hsla(${this.hue}, 80%, 40%, ${this.opacity * 0.3})`);
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
      ctx.shadowBlur = this.radius * 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const initParticles = (canvas) => {
    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push(new Particle(canvas));
    }
    return particles;
  };

  const drawMouseEffect = (ctx, mouse, mode) => {
    if (!mouse.isActive) return;

    const radius = intensity * 2;
    
    // Draw mouse influence area
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
    
    let gradient;
    switch (mode) {
      case 'attraction':
        gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        break;
      case 'repulsion':
        gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
        break;
      case 'orbital':
        gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        break;
      case 'vortex':
        gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        gradient.addColorStop(0, 'rgba(200, 100, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(200, 100, 255, 0)');
        break;
      case 'wave':
        gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
        gradient.addColorStop(0, 'rgba(100, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 255, 200, 0)');
        break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw cursor indicator
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(5, 5, 15, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.update(canvas, mouseRef.current, mode, intensity);
      particle.draw(ctx);
    });

    // Draw mouse effect
    drawMouseEffect(ctx, mouseRef.current, mode);

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.isActive = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current.isActive = false;
  };

  const resetParticles = () => {
    const canvas = canvasRef.current;
    particlesRef.current = initParticles(canvas);
  };

  const modes = [
    { value: 'attraction', label: 'Attraction', color: 'bg-blue-600' },
    { value: 'repulsion', label: 'Repulsion', color: 'bg-red-600' },
    { value: 'orbital', label: 'Orbital', color: 'bg-yellow-600' },
    { value: 'vortex', label: 'Vortex', color: 'bg-purple-600' },
    { value: 'wave', label: 'Wave', color: 'bg-green-600' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = 'rgb(5, 5, 15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = initParticles(canvas);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      resetParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mode, intensity]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="absolute inset-0 cursor-none"
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-60 backdrop-blur-md rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Particle Field
        </h2>
        
        <div className="space-y-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all transform hover:scale-105"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <div>
            <label className="block text-sm mb-2 font-semibold">Interaction Mode:</label>
            <div className="grid grid-cols-1 gap-2">
              {modes.map((modeOption) => (
                <button
                  key={modeOption.value}
                  onClick={() => setMode(modeOption.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all transform hover:scale-105 ${
                    mode === modeOption.value 
                      ? `${modeOption.color} shadow-lg` 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {modeOption.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-2 font-semibold">
              Intensity: {intensity}
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          
          <button
            onClick={resetParticles}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all transform hover:scale-105"
          >
            🔄 Reset Particles
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-60 backdrop-blur-md rounded-xl p-4 text-white max-w-sm">
        <h3 className="font-bold mb-2 text-lg">🎮 How to Use:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Move mouse</strong> to interact with particles</li>
          <li>• <strong>Try different modes</strong> for unique effects</li>
          <li>• <strong>Adjust intensity</strong> for stronger interactions</li>
          <li>• <strong>Leave mouse area</strong> to see particles settle</li>
        </ul>
        <p className="text-xs mt-3 text-gray-300">
          Current: <span className="text-blue-300 font-semibold">{modes.find(m => m.value === mode)?.label}</span>
        </p>
      </div>
    </div>
  );
};

export default InteractiveParticleField;