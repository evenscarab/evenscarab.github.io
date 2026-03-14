

import React, { useRef, useEffect, useState } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  color?: string;
  side: 'left' | 'right';
}

const Joystick: React.FC<JoystickProps> = ({ onMove, color = "white", side }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });
  const maxRadius = 50; // Max distance the stick can move

  const handleStart = (e: React.TouchEvent) => {
    // Prevent default to stop scrolling
    // e.preventDefault(); // Note: handled by CSS touch-action usually, but good to be safe
    
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    setActive(true);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      center.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    updateStick(touch.clientX, touch.clientY);
  };

  const handleMove = (e: React.TouchEvent) => {
    if (!active) return;
    const touch = Array.from(e.changedTouches).find((t: any) => t.identifier === touchId.current) as any;
    if (touch) {
      updateStick(touch.clientX, touch.clientY);
    }
  };

  const handleEnd = (e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find((t: any) => t.identifier === touchId.current) as any;
    if (touch) {
      setActive(false);
      touchId.current = null;
      if (stickRef.current) {
        stickRef.current.style.transform = `translate(0px, 0px)`;
      }
      onMove(0, 0);
    }
  };

  const updateStick = (clientX: number, clientY: number) => {
    const dx = clientX - center.current.x;
    const dy = clientY - center.current.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Normalize output -1 to 1
    const normalizedX = x / maxRadius;
    const normalizedY = y / maxRadius;
    onMove(normalizedX, normalizedY);
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute bottom-8 ${side === 'left' ? 'left-8' : 'right-8'} w-32 h-32 rounded-full bg-black/20 backdrop-blur-sm border-2 border-white/10 touch-none flex items-center justify-center z-50`}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{ touchAction: 'none' }} // Critical for preventing scroll
    >
      <div 
        ref={stickRef}
        className="w-12 h-12 rounded-full shadow-lg absolute pointer-events-none transition-transform duration-75 ease-linear"
        style={{ backgroundColor: active ? `${color}` : 'rgba(255,255,255,0.5)' }}
      />
    </div>
  );
};

interface MobileControlsProps {
  onMoveChange: (x: number, y: number) => void;
  onLookChange: (x: number, y: number) => void;
  onInteract: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMoveChange, onLookChange, onInteract }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[60]">
      {/* Left Joystick - Movement */}
      <div className="pointer-events-auto">
        <Joystick side="left" onMove={onMoveChange} color="#b5ead7" />
      </div>

      {/* Right Joystick - Look */}
      <div className="pointer-events-auto">
        <Joystick side="right" onMove={onLookChange} color="#ff9aa2" />
      </div>

      {/* Interaction Button (Hand) */}
      <button 
        className="absolute bottom-40 right-8 w-20 h-20 bg-white/80 rounded-full border-4 border-[#5d4037] shadow-xl flex items-center justify-center active:scale-95 transition-transform pointer-events-auto z-50"
        onTouchStart={(e) => { e.preventDefault(); onInteract(); }}
        onClick={(e) => { e.preventDefault(); onInteract(); }}
      >
        <span className="text-4xl">🖐️</span>
      </button>

      {/* Instructions Overlay for Mobile */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
         <span className="text-white text-xs font-bold tracking-widest uppercase opacity-80">Modo Táctil Activado</span>
      </div>
    </div>
  );
};
