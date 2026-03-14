


import React, { useMemo, useState, useRef, useEffect } from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { CanvasTexture, RepeatWrapping, NearestFilter, Group, Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { GROUP_SCENE, ROOM_LAYOUT } from '../constants';
import '../types';
import { audioManager } from '../utils/audio';

// --- PHYSICS COMPONENTS ---
const PhysicsWall = ({ position, args }: { position: [number, number, number], args: [number, number, number] }) => {
  // CRITICAL FIX: Added dependencies to useBox to ensure physics update when props change
  useBox(() => ({
    type: 'Static',
    position,
    args,
    collisionFilterGroup: GROUP_SCENE,
    material: { friction: 0, restitution: 0 }
  }), undefined, [position[0], position[1], position[2], args[0], args[1], args[2]]);
  return null;
};

const PhysicsFurniture = ({ layoutData, id }: { layoutData: any, id: string }) => {
  useBox(() => ({
    type: 'Static',
    position: layoutData.pos,
    args: layoutData.size,
    rotation: layoutData.rot,
    collisionFilterGroup: GROUP_SCENE,
    material: { friction: 0, restitution: 0 }
  }), undefined, [
    id, 
    layoutData.pos[0], layoutData.pos[1], layoutData.pos[2], 
    layoutData.size[0], layoutData.size[1], layoutData.size[2],
    layoutData.rot[0], layoutData.rot[1], layoutData.rot[2]
  ]); 
  return null;
};

// Physics Component for Hollow Closets with Shelves
const PhysicsClosetShell = ({ layoutData }: { layoutData: any }) => {
  const { pos, size } = layoutData;
  // CRITICAL FIX: Deconstruct global position to apply manually to children
  // useBox does NOT inherit parent group position, so we must use absolute coordinates.
  const [cx, cy, cz] = pos;
  
  const width = size[0];
  const height = size[1];
  const depth = size[2];

  // Thickness of walls
  const t = 0.05;

  return (
    <>
      {/* Back Panel */}
      <PhysicsWall position={[cx, cy, cz - depth/2 + t/2]} args={[width, height, t]} />
      {/* Left Panel */}
      <PhysicsWall position={[cx - width/2 + t/2, cy, cz]} args={[t, height, depth]} />
      {/* Right Panel */}
      <PhysicsWall position={[cx + width/2 - t/2, cy, cz]} args={[t, height, depth]} />
      {/* Top Panel */}
      <PhysicsWall position={[cx, cy + height/2 - t/2, cz]} args={[width, t, depth]} />
      {/* Bottom Panel */}
      <PhysicsWall position={[cx, cy - height/2 + t/2, cz]} args={[width, t, depth]} />
      
      {/* SHELVES PHYSICS */}
      {/* Top Shelf */}
      <PhysicsWall position={[cx, cy + 0.6, cz]} args={[width - t*2, t, depth - t]} />
      {/* Middle Shelf */}
      <PhysicsWall position={[cx, cy - 0.1, cz]} args={[width - t*2, t, depth - t]} />
       {/* Bottom Divider/Shelf */}
      <PhysicsWall position={[cx, cy - 0.8, cz]} args={[width - t*2, t, depth - t]} />
    </>
  );
};

const RoomPhysics = () => {
  const { WIDTH, DEPTH, HEIGHT, WALL_THICKNESS } = ROOM_LAYOUT;

  usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0],
    collisionFilterGroup: GROUP_SCENE,
    material: { friction: 0, restitution: 0 }
  }));

  usePlane(() => ({ 
    rotation: [Math.PI / 2, 0, 0], 
    position: [0, HEIGHT, 0],
    collisionFilterGroup: GROUP_SCENE 
  }));

  return (
    <>
      {/* Back Wall */}
      <PhysicsWall position={[0, HEIGHT / 2, -DEPTH / 2]} args={[WIDTH, HEIGHT, WALL_THICKNESS]} />
      {/* Left Wall */}
      <PhysicsWall position={[-WIDTH / 2, HEIGHT / 2, 0]} args={[WALL_THICKNESS, HEIGHT, DEPTH]} />
      
      {/* Right Wall (with Window Gap) */}
      <PhysicsWall position={[WIDTH / 2, 1.5, -1.375]} args={[WALL_THICKNESS, 3, 3.25]} />
      <PhysicsWall position={[WIDTH / 2, 1.5, 2.375]} args={[WALL_THICKNESS, 3, 1.25]} />
      <PhysicsWall position={[WIDTH / 2, 0.4, 1.0]} args={[WALL_THICKNESS, 0.8, 1.5]} />
      <PhysicsWall position={[WIDTH / 2, 2.6, 1.0]} args={[WALL_THICKNESS, 0.8, 1.5]} />
      
      {/* INVISIBLE WINDOW BLOCKER (Prevents jumping out) */}
      {/* Positioned at the window center [3.0, 1.5, 1.0] */}
      <PhysicsWall position={[3.0, 1.5, 1.0]} args={[WALL_THICKNESS, 1.4, 1.4]} />

      {/* Front Wall (with Door Gap) */}
      <PhysicsWall position={[-0.95, 1.5, DEPTH / 2]} args={[4.1, 3, WALL_THICKNESS]} />
      <PhysicsWall position={[2.75, 1.5, DEPTH / 2]} args={[0.5, 3, WALL_THICKNESS]} />
      <PhysicsWall position={[1.8, 2.5, DEPTH / 2]} args={[1.4, 1.0, WALL_THICKNESS]} />

      {/* Solid Furniture */}
      <PhysicsFurniture id="bed-phys" layoutData={ROOM_LAYOUT.BED} />
      <PhysicsFurniture id="nightstand-phys" layoutData={ROOM_LAYOUT.NIGHTSTAND} />
      <PhysicsFurniture id="desk-phys" layoutData={ROOM_LAYOUT.DESK} />
      <PhysicsFurniture id="chair-phys" layoutData={ROOM_LAYOUT.CHAIR} />
      
      {/* Hollow Closets - Now using correct Global Physics Coordinates */}
      <PhysicsClosetShell layoutData={ROOM_LAYOUT.CLOSET_LEFT} />
      <PhysicsClosetShell layoutData={ROOM_LAYOUT.CLOSET_MIDDLE} />
      <PhysicsClosetShell layoutData={ROOM_LAYOUT.CLOSET_RIGHT} />

      {/* Door Filler */}
      <PhysicsWall position={[1.8, 1.0, 3.0]} args={[1.4, 2.0, 0.1]} />
    </>
  );
};

// --- PROCEDURAL TEXTURE GENERATOR ---
const generateProceduralTextures = () => {
  const width = 512;
  const height = 512;

  // 1. Wood Grain Texture
  const canvasWood = document.createElement('canvas');
  canvasWood.width = width;
  canvasWood.height = height;
  const ctxWood = canvasWood.getContext('2d')!;
  
  // Base
  ctxWood.fillStyle = '#ffffff';
  ctxWood.fillRect(0, 0, width, height);
  
  // Grain lines
  for (let i = 0; i < 400; i++) {
    ctxWood.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    const y = Math.random() * height;
    const h = Math.random() * 2 + 1;
    ctxWood.fillRect(0, y, width, h);
  }
  // Noise overlay
  for (let i = 0; i < 5000; i++) {
     ctxWood.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
     ctxWood.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }

  const woodTexture = new CanvasTexture(canvasWood);
  woodTexture.wrapS = RepeatWrapping;
  woodTexture.wrapT = RepeatWrapping;

  // 2. Plaster Texture
  const canvasPlaster = document.createElement('canvas');
  canvasPlaster.width = width;
  canvasPlaster.height = height;
  const ctxPlaster = canvasPlaster.getContext('2d')!;
  
  ctxPlaster.fillStyle = '#ffffff';
  ctxPlaster.fillRect(0, 0, width, height);
  
  // Stucco bumps
  for (let i = 0; i < 30000; i++) {
    const val = Math.random();
    ctxPlaster.fillStyle = val > 0.5 ? `rgba(255,255,255,0.1)` : `rgba(0,0,0,0.05)`;
    ctxPlaster.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }

  const plasterTexture = new CanvasTexture(canvasPlaster);
  plasterTexture.wrapS = RepeatWrapping;
  plasterTexture.wrapT = RepeatWrapping;

  // 3. Moon Texture (Cartoonish Craters)
  const canvasMoon = document.createElement('canvas');
  canvasMoon.width = 512;
  canvasMoon.height = 512;
  const ctxMoon = canvasMoon.getContext('2d')!;
  
  // Base Moon Color (Bright but not pure white to show contrast)
  ctxMoon.fillStyle = '#f8f9fa'; 
  ctxMoon.fillRect(0, 0, 512, 512);
  
  // Draw Craters (Darker Grey for visibility)
  const craters = [
    { x: 256, y: 256, r: 90 }, // Big center
    { x: 120, y: 150, r: 60 },
    { x: 390, y: 110, r: 50 },
    { x: 360, y: 390, r: 70 },
    { x: 100, y: 380, r: 55 },
    { x: 420, y: 240, r: 40 },
    { x: 70, y: 260, r: 35 }
  ];

  craters.forEach(c => {
    ctxMoon.beginPath();
    ctxMoon.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    // MUCH DARKER GREY for craters
    ctxMoon.fillStyle = '#080b0f'; // Slate-700
    ctxMoon.fill();
    // Add subtle border
    ctxMoon.lineWidth = 5;
    ctxMoon.strokeStyle = '#1e293b'; // Slate-800
    ctxMoon.stroke();
  });
  
  // Add some smaller random spots
  for (let i = 0; i < 25; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const r = Math.random() * 15 + 5;
    ctxMoon.beginPath();
    ctxMoon.arc(cx, cy, r, 0, Math.PI * 2);
    ctxMoon.fillStyle = '#64748b'; // Slate-500
    ctxMoon.fill();
  }

  const moonTexture = new CanvasTexture(canvasMoon);

  return { woodTexture, plasterTexture, moonTexture };
};

// --- VISUAL COMPONENTS ---

const VisualBox = ({ 
  args, 
  color, 
  position, 
  rotation = [0, 0, 0], 
  opacity = 1, 
  transparent = false, 
  texture = null, 
  bumpMap = null,
  roughness = 0.7
}: any) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow userData={{ interactable: false }}>
    <boxGeometry args={args} />
    <meshStandardMaterial 
      color={color} 
      opacity={opacity} 
      transparent={transparent} 
      roughness={roughness}
      map={texture}
      bumpMap={bumpMap}
      bumpScale={0.02}
    />
  </mesh>
);

const Moon = ({ texture }: { texture: any }) => (
    // Positioned at Z=-0.5 to be visible on the left side of the window
    <group position={[8, 2, -0.5]} rotation={[0, -Math.PI/2, 0]}>
        <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial 
                map={texture} 
                emissive="#ffffff" 
                emissiveIntensity={0.6} // Reduced intensity so texture is visible
                color="#ffffff"
            />
        </mesh>
        {/* Glow Halo - Increased opacity to compensate for lower emissive */}
        <mesh scale={[1.2, 1.2, 1.2]}>
             <sphereGeometry args={[1.5, 16, 16]} />
             <meshBasicMaterial color="#fffff0" transparent opacity={0.3} side={1} />
        </mesh>
    </group>
  );

// --- RADIO COMPONENT ---
const Radio = ({ onInteract }: { onInteract?: () => void }) => {
  const { RADIO } = ROOM_LAYOUT;
  const [hovered, setHovered] = useState(false);

  return (
    <group position={RADIO.pos} rotation={RADIO.rot} 
      onPointerOver={() => setHovered(true)} 
      onPointerOut={() => setHovered(false)}
      userData={{ interactable: true, onInteract: onInteract, id: 'radio' }}
    >
        {/* Main Body */}
        <VisualBox args={[0.35, 0.2, 0.15]} color="#5d4037" />
        <VisualBox position={[0, 0, 0.08]} args={[0.33, 0.18, 0.02]} color="#d7ccc8" />
        
        {/* Speaker Grill */}
        <VisualBox position={[-0.08, 0, 0.09]} args={[0.12, 0.12, 0.01]} color="#3e2723" />
        
        {/* Dial Display */}
        <VisualBox position={[0.08, 0.04, 0.09]} args={[0.12, 0.04, 0.01]} color="#1f2937" />
        
        {/* Knobs */}
        <mesh position={[0.05, -0.04, 0.1]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0.11, -0.04, 0.1]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>

        {/* Antenna */}
        <mesh position={[-0.15, 0.15, -0.05]} rotation={[0, 0, -0.2]}>
           <cylinderGeometry args={[0.005, 0.005, 0.3]} />
           <meshStandardMaterial color="#9ca3af" />
        </mesh>

        {/* Hover Effect */}
        {hovered && (
          <mesh position={[0, 0.15, 0]}>
             <sphereGeometry args={[0.02]} />
             <meshBasicMaterial color="#ef4444" />
          </mesh>
        )}
    </group>
  );
};


// COLORS
const COLORS = {
  WOOD_DARK: "#5d4037",
  WOOD_MEDIUM: "#907761", 
  WOOD_LIGHT: "#ab9680",  
  WALL: "#fffbf0",
  CEILING: "#fff8e1",
  GOLD: "#ffe082",
  BLANKET: "#81d4fa",
  PILLOW: "#ffffff",
  GLASS_BLUE: "#b3e5fc",
  GLASS_EMISSIVE: "#e1f5fe",
  WINDOW_FRAME: "#b0bec5",
  LAMP_BASE: "#d4a373",
  LAMP_SHADE: "#fefae0"
};

// --- CONFETTI EXPLOSION EFFECT ---
const ConfettiExplosion = ({ trigger }: { trigger: number }) => {
  const groupRef = useRef<Group>(null);
  const particlesRef = useRef<{ pos: Vector3; vel: Vector3; rot: Vector3; rotVel: Vector3; active: boolean }[]>([]);

  // Colors for confetti
  const colors = useMemo(() => 
    new Array(20).fill(0).map(() => new Color().setHSL(Math.random(), 0.8, 0.6)), 
  []);

  useEffect(() => {
    if (trigger === 0) return;

    // Reset particles
    particlesRef.current = new Array(20).fill(0).map(() => ({
      pos: new Vector3(0, 0, 0),
      vel: new Vector3(
        (Math.random() - 0.5) * 3,   
        Math.random() * 2 + 1,       
        (Math.random() - 0.5) * 3    
      ),
      rot: new Vector3(Math.random(), Math.random(), Math.random()),
      rotVel: new Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      active: true
    }));

    // Reset scales visually
    if (groupRef.current) {
      groupRef.current.children.forEach(child => child.scale.setScalar(1));
    }

  }, [trigger]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, i) => {
      const p = particlesRef.current[i];
      if (p && p.active) {
        // Physics
        p.vel.y -= 9.8 * delta; // Gravity
        p.pos.add(p.vel.clone().multiplyScalar(delta));
        
        // Rotation
        p.rot.x += p.rotVel.x * delta;
        p.rot.y += p.rotVel.y * delta;

        // Update Mesh
        child.position.copy(p.pos);
        child.rotation.set(p.rot.x, p.rot.y, p.rot.z);
        
        // Shrink over time
        if (child.scale.x > 0) {
           child.scale.subScalar(delta * 0.8);
        } else {
           p.active = false;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {colors.map((c, i) => (
        <mesh key={i} scale={[0, 0, 0]}>
          <planeGeometry args={[0.08, 0.04]} />
          <meshStandardMaterial color={c} side={2} emissive={c} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// --- INTERACTIVE DOOR COMPONENT ---
const AnimatedDoor = ({ 
  pivot, 
  meshOffset, 
  args, 
  color, 
  texture, 
  handlePos, 
  rotationDir = 1,
  locked = false,
  onInteract // NEW PROP to handle special interaction (cooking)
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const groupRef = useRef<any>(null);
  
  const toggleOpen = () => {
    if (!locked) {
      setIsOpen(prev => {
        const newState = !prev;
        audioManager.play(newState ? 'door_open' : 'door_close');
        return newState;
      }); 
    }
  };

  const handleInteraction = () => {
    // If a custom interaction handler is provided (e.g., go to kitchen), use it
    if (onInteract) {
        onInteract();
    } else {
        // Otherwise do normal open/close behavior
        toggleOpen();
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Animate rotation
    const targetRotation = isOpen ? rotationDir * (Math.PI / 2.0) : 0;
    // Smooth interpolation
    groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * delta * 4;
  });

  return (
    <group position={pivot} ref={groupRef}>
      <group position={meshOffset} userData={{ interactable: true, onInteract: handleInteraction }}>
         <VisualBox args={args} color={color} bumpMap={texture} />
         <VisualBox position={handlePos} args={[0.02, 0.2, 0.02]} color={COLORS.GOLD} />
      </group>
    </group>
  );
};

// Moved RenderCloset outside to prevent re-creation on every render (which was resetting state)
const RenderCloset = ({ layout, locked = false, woodTexture, trigger = 0 }: { layout: any, locked?: boolean, woodTexture: any, trigger?: number }) => {
  const width = 1.8;
  const height = 2.5;
  const depth = 0.8;
  const t = 0.05; // Thickness

  return (
    <group position={layout.pos}>
      {/* HOLLOW FRAME CONSTRUCTION */}
      
      {/* Back Panel */}
      <VisualBox position={[0, 0, -depth/2 + t/2]} args={[width, height, t]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
      
      {/* Side Panels */}
      <VisualBox position={[-width/2 + t/2, 0, 0]} args={[t, height, depth]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
      <VisualBox position={[width/2 - t/2, 0, 0]} args={[t, height, depth]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
      
      {/* Top/Bottom Panels */}
      <VisualBox position={[0, height/2 - t/2, 0]} args={[width, t, depth]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
      <VisualBox position={[0, -height/2 + t/2, 0]} args={[width, t, depth]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />

      {/* SHELVES (Wooden Boards) */}
      {/* Top Shelf */}
      <VisualBox position={[0, 0.6, 0]} args={[width - t*2, t, depth - t]} color={COLORS.WOOD_LIGHT} bumpMap={woodTexture} />
      {/* Middle Shelf */}
      <VisualBox position={[0, -0.1, 0]} args={[width - t*2, t, depth - t]} color={COLORS.WOOD_LIGHT} bumpMap={woodTexture} />
      {/* Bottom Divider */}
      <VisualBox position={[0, -0.8, 0]} args={[width - t*2, t, depth - t]} color={COLORS.WOOD_LIGHT} bumpMap={woodTexture} />

      {/* DOORS */}
      {/* Left Door */}
      <AnimatedDoor 
        pivot={[-width/2 + t/2, 0, depth/2 + 0.02]} 
        meshOffset={[width/4, 0, 0]} 
        args={[width/2 - 0.02, height - 0.1, t]}
        color={COLORS.WOOD_MEDIUM}
        texture={woodTexture}
        handlePos={[0.35, 0, t + 0.02]} 
        rotationDir={-1.5} 
        locked={locked}
      />

      {/* Right Door */}
      <AnimatedDoor 
        pivot={[width/2 - t/2, 0, depth/2 + 0.02]} 
        meshOffset={[-width/4, 0, 0]}
        args={[width/2 - 0.02, height - 0.1, t]}
        color={COLORS.WOOD_MEDIUM}
        texture={woodTexture}
        handlePos={[-0.35, 0, t + 0.02]} 
        rotationDir={1.5} 
        locked={locked}
      />

      {/* Confetti - Only shows if this closet is targeted via trigger */}
      {!locked && <ConfettiExplosion trigger={trigger} />}
    </group>
  );
};

const FurnitureVisuals = ({ woodTexture, cleanTrigger = 0, onOpenDrawer, onOpenRadio, onDoorInteract }: { woodTexture: any, cleanTrigger?: number, onOpenDrawer?: () => void, onOpenRadio?: () => void, onDoorInteract?: () => void }) => {
  const { BED, NIGHTSTAND, CLOSET_LEFT, CLOSET_MIDDLE, CLOSET_RIGHT, DESK, CHAIR } = ROOM_LAYOUT;
  const USE_MODEL = false;

  return (
    <group>
      {/* --- BED --- */}
      {!USE_MODEL && (
        <group position={BED.pos} rotation={BED.rot}>
           <VisualBox position={[0, -0.2, 0]} args={[1.5, 0.2, 2.7]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[-0.65, -0.2, -1.25]} args={[0.1, 0.2, 0.1]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[0.65, -0.2, -1.25]} args={[0.1, 0.2, 0.1]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[-0.65, -0.2, 1.25]} args={[0.1, 0.2, 0.1]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[0.65, -0.2, 1.25]} args={[0.1, 0.2, 0.1]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[0, 0.05, 0]} args={[1.4, 0.3, 2.6]} color="white" />
           <VisualBox position={[0, 0.06, 0.6]} args={[1.45, 0.31, 1.5]} color={COLORS.BLANKET} roughness={1} />
           <VisualBox position={[0, 0.3, -1.3]} args={[1.6, 1.0, 0.1]} color={COLORS.WOOD_MEDIUM} bumpMap={woodTexture} />
           <group position={[-0.35, 0.25, -1.0]} rotation={[0.2, 0, 0]}>
              <VisualBox args={[0.6, 0.15, 0.4]} color={COLORS.PILLOW} roughness={1} />
           </group>
           <group position={[0.35, 0.25, -1.0]} rotation={[0.2, 0, 0]}>
              <VisualBox args={[0.6, 0.15, 0.4]} color={COLORS.PILLOW} roughness={1} />
           </group>
        </group>
      )}

      {/* --- NIGHTSTAND --- */}
      {!USE_MODEL && (
        <group 
           position={NIGHTSTAND.pos} 
           rotation={NIGHTSTAND.rot}
           // MAKE INTERACTIVE FOR DRAWER OPENING
           userData={{ interactable: true, onInteract: onOpenDrawer, id: 'nightstand-drawer' }}
        >
           <VisualBox position={[0, 0, 0]} args={[0.5, 0.4, 0.4]} color={COLORS.WOOD_MEDIUM} bumpMap={woodTexture} />
           <VisualBox position={[-0.2, -0.2, -0.15]} args={[0.05, 0.2, 0.05]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0.2, -0.2, -0.15]} args={[0.05, 0.2, 0.05]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[-0.2, -0.2, 0.15]} args={[0.05, 0.2, 0.05]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0.2, -0.2, 0.15]} args={[0.05, 0.2, 0.05]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0, 0.05, 0.21]} args={[0.4, 0.15, 0.02]} color={COLORS.WOOD_LIGHT} bumpMap={woodTexture} />
           <mesh position={[0, 0.05, 0.23]}><sphereGeometry args={[0.025]} /><meshStandardMaterial color={COLORS.GOLD} /></mesh>
           
           <group position={[0, 0.4, 0]}>
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.2, 16]} />
                <meshStandardMaterial color={COLORS.LAMP_BASE} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <coneGeometry args={[0.2, 0.25, 16, 1, true]} />
                <meshStandardMaterial color={COLORS.LAMP_SHADE} side={2} emissive={COLORS.LAMP_SHADE} emissiveIntensity={0.2} />
              </mesh>
           </group>
        </group>
      )}

      {!USE_MODEL && (
        <>
          {/* Left and Middle Closets Open - Pass trigger for confetti */}
          <RenderCloset layout={CLOSET_LEFT} locked={false} woodTexture={woodTexture} trigger={cleanTrigger} />
          <RenderCloset layout={CLOSET_MIDDLE} locked={false} woodTexture={woodTexture} trigger={cleanTrigger} />
          {/* Right Closet Locked - No trigger needed */}
          <RenderCloset layout={CLOSET_RIGHT} locked={true} woodTexture={woodTexture} />
        </>
      )}

      {!USE_MODEL && (
        <group position={DESK.pos}>
           <VisualBox position={[0, 0.355, 0]} args={[1.2, 0.05, 1.8]} color={COLORS.WOOD_MEDIUM} bumpMap={woodTexture} />
           <VisualBox position={[-0.4, 0.025, 0]} args={[0.05, 0.6, 1.6]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0.4, -0.025, -0.8]} args={[0.8, 0.7, 0.1]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0.2, -0.025, 0.5]} args={[0.8, 0.7, 0.6]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
        </group>
      )}

      {!USE_MODEL && (
         <group position={CHAIR.pos}>
           <VisualBox position={[0, 0.05, 0]} args={[0.45, 0.05, 0.45]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
           <VisualBox position={[0, 0.08, 0]} args={[0.4, 0.04, 0.4]} color={COLORS.BLANKET} roughness={1} />
           <VisualBox position={[-0.18, -0.18, -0.18]} args={[0.05, 0.45, 0.05]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[0.18, -0.18, -0.18]} args={[0.05, 0.45, 0.05]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[-0.18, -0.18, 0.18]} args={[0.05, 0.45, 0.05]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[-0.18, -0.18, 0.18]} args={[0.05, 0.45, 0.05]} color={COLORS.WOOD_DARK} />
           <VisualBox position={[-0.2, 0.35, 0]} args={[0.05, 0.6, 0.4]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
        </group>
      )}

      {/* RADIO COMPONENT */}
      <Radio onInteract={onOpenRadio} />

      {/* MAIN DOOR (Exit to Hallway) */}
      <group position={[1.8, 0, 3.0]}>
         <VisualBox position={[0, 1.0, 0]} args={[1.4, 2.0, 0.15]} color={COLORS.WOOD_DARK} bumpMap={woodTexture} />
         <VisualBox position={[0, 1.0, 0.02]} args={[1.1, 1.9, 0.08]} color={COLORS.WOOD_LIGHT} bumpMap={woodTexture} />
         
         {/* THE ACTUAL INTERACTIVE DOOR */}
         <AnimatedDoor 
            pivot={[-0.55, 1.0, 0.06]} 
            meshOffset={[0.55, 0, 0]} 
            args={[1.0, 1.85, 0.06]}
            color={COLORS.WOOD_MEDIUM}
            texture={woodTexture}
            handlePos={[0.4, 0, 0.06]} 
            rotationDir={-1.8} 
            locked={false}
            onInteract={onDoorInteract} // Pass the handler
          />
      </group>

      <group position={[3.0, 1.5, 1.0]}>
       <VisualBox position={[-0.02, 0.7, 0]} args={[0.25, 0.1, 1.5]} color={COLORS.WINDOW_FRAME} />
       <VisualBox position={[-0.02, -0.7, 0]} args={[0.25, 0.1, 1.5]} color={COLORS.WINDOW_FRAME} />
       <VisualBox position={[-0.02, 0, -0.7]} args={[0.25, 1.3, 0.1]} color={COLORS.WINDOW_FRAME} />
       <VisualBox position={[-0.02, 0, 0.7]} args={[0.25, 1.3, 0.1]} color={COLORS.WINDOW_FRAME} />
       <VisualBox position={[-0.1, -0.65, 0]} args={[0.35, 0.08, 1.7]} color={COLORS.WINDOW_FRAME} />
       <mesh position={[0, 0, 0]} userData={{ interactable: false }}>
          <boxGeometry args={[0.02, 1.2, 1.3]} />
          <meshPhysicalMaterial 
            color={COLORS.GLASS_BLUE} 
            transparent 
            opacity={0.2} 
            emissive={COLORS.GLASS_EMISSIVE} 
            emissiveIntensity={0.5} 
            roughness={0} 
            metalness={0.1}
          />
       </mesh>
      </group>
    </group>
  );
}

export const RoomEnvironment: React.FC<{ cleanTrigger?: number, onOpenDrawer?: () => void, onOpenRadio?: () => void, timeOfDay: string, onDoorInteract?: () => void }> = ({ cleanTrigger = 0, onOpenDrawer, onOpenRadio, timeOfDay, onDoorInteract }) => {
  // GENERATE PROCEDURAL TEXTURES
  const { woodTexture, plasterTexture, moonTexture } = useMemo(() => generateProceduralTextures(), []);

  // --- MEMORY OPTIMIZATION: DISPOSE TEXTURES ON UNMOUNT ---
  useEffect(() => {
    return () => {
      // Clean up GPU memory when leaving the room
      woodTexture.dispose();
      plasterTexture.dispose();
      moonTexture.dispose();
    }
  }, [woodTexture, plasterTexture, moonTexture]);

  // Visual plank floor
  const floorVisuals = useMemo(() => {
    const p = [];
    for(let i=0; i<30; i++) {
       p.push(
         <VisualBox 
           key={i} 
           position={[0, -0.05, -3 + (i*0.2) + 0.1]} 
           args={[6, 0.1, 0.19]} 
           color={Math.random() > 0.5 ? COLORS.WOOD_LIGHT : COLORS.WOOD_MEDIUM} 
           bumpMap={woodTexture}
           roughness={0.8}
         />
       );
    }
    return <group>{p}</group>;
  }, [woodTexture]);

  const subFloor = (
     <mesh position={[0, -0.15, 0]} rotation={[-Math.PI/2, 0, 0]} userData={{ interactable: false }}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#5d4037" />
     </mesh>
  );

  return (
    <group>
      {/* VISUALS */}
      {floorVisuals}
      {subFloor}
      
      {/* Walls with Plaster Texture */}
      <VisualBox position={[0, 1.5, -3]} args={[6, 3, 0.2]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[-3, 1.5, 0]} args={[0.2, 3, 6]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[3, 1.5, -1.375]} args={[0.2, 3, 3.25]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[3, 1.5, 2.375]} args={[0.2, 3, 1.25]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[3, 0.4, 1.0]} args={[0.2, 0.8, 1.5]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[3, 2.6, 1.0]} args={[0.2, 0.8, 1.5]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      
      <VisualBox position={[-0.95, 1.5, 3]} args={[4.1, 3, 0.2]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[2.75, 1.5, 3]} args={[0.5, 3, 0.2]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      <VisualBox position={[1.8, 2.5, 3]} args={[1.4, 1.0, 0.2]} color={COLORS.WALL} bumpMap={plasterTexture} roughness={1} />
      
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color={COLORS.CEILING} side={2} bumpMap={plasterTexture} bumpScale={0.01} />
      </mesh>

      {/* MOON - Only in Night Mode */}
      {timeOfDay === 'night' && <Moon texture={moonTexture} />}

      <FurnitureVisuals woodTexture={woodTexture} cleanTrigger={cleanTrigger} onOpenDrawer={onOpenDrawer} onOpenRadio={onOpenRadio} onDoorInteract={onDoorInteract} />
      <RoomPhysics />
    </group>
  );
};