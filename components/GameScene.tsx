


/// <reference lib="dom" />
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useSphere } from '@react-three/cannon';
import { PointerLockControls, Sky, Stars, Html } from '@react-three/drei';
import { Vector3, Raycaster, Vector2, Euler, MathUtils } from 'three';
import { RoomEnvironment } from './Room';
import { InteractableItem } from './InteractableItem';
import { CleaningBasket } from './CleaningBasket';
import { GameState, ItemData } from '../types';
import { GROUP_PLAYER, GROUP_SCENE, BASKET_POSITION, CLOSET_ZONES } from '../constants';
import { audioManager } from '../utils/audio';

// --- INTERACTION MANAGER ---
const InteractionManager = ({ 
  items, 
  onItemCleaned,
  onCleanSuccess,
  dropZone,
  gameState,
  triggerInteract, // New prop to trigger interaction externally (from mobile button or gamepad)
  isActive
}: { 
  items: ItemData[], 
  onItemCleaned: (id: string) => void,
  onCleanSuccess: () => void,
  dropZone: 'basket' | 'closet',
  gameState: GameState,
  triggerInteract: boolean,
  isActive: boolean
}) => {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [heldId, setHeldId] = useState<string | null>(null);
  const hoveredObjectRef = useRef<any>(null);
  
  // Ref to track previous trigger state to detect "fresh" presses
  const prevTriggerRef = useRef(false);
  const prevGamepadInteractRef = useRef(false);

  // Helper function to perform interaction logic
  const performInteraction = () => {
      if (hoveredObjectRef.current && hoveredObjectRef.current.userData.onInteract) {
        hoveredObjectRef.current.userData.onInteract();
        return;
      }

      if (hoveredId && !heldId) {
        setHeldId(hoveredId);
        audioManager.play('pickup', true);
      } else if (heldId) {
        const direction = new Vector3();
        camera.getWorldDirection(direction);
        const dropPosition = camera.position.clone().add(direction.multiplyScalar(1.5));
        
        let success = false;

        if (dropZone === 'basket') {
           const basketPos = new Vector3(...BASKET_POSITION);
           if (dropPosition.distanceTo(basketPos) < 1.2) {
             success = true;
           }
        } else if (dropZone === 'closet') {
           for (const zone of CLOSET_ZONES) {
              const dx = Math.abs(dropPosition.x - zone.x);
              const dz = Math.abs(dropPosition.z - zone.z);
              if (dx < zone.width / 2 && dz < zone.depth / 2) {
                success = true;
                break;
              }
           }
        }
        
        if (success) {
          onItemCleaned(heldId);
          onCleanSuccess(); 
          audioManager.play('basket_success');
        } else {
          audioManager.play('drop', true);
        }
        setHeldId(null); 
      }
  };

  useFrame(() => {
    // Only raycast/interact if active
    if (!isActive) {
      setHoveredId(null);
      hoveredObjectRef.current = null;
      return;
    }

    // Determine if we should raycast
    // On Desktop: only if pointerLocked
    // On Mobile/Gamepad: Always raycast (center of screen) if playing
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const gamepads = navigator.getGamepads();
    const isGamepadConnected = !!gamepads[0];
    const shouldRaycast = (isMobile || isGamepadConnected) ? (gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) : document.pointerLockElement;

    if (!shouldRaycast) {
      setHoveredId(null);
      hoveredObjectRef.current = null;
      return;
    }

    raycaster.current.setFromCamera(new Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    let foundId = null;
    let foundObj = null;

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].distance > 3) break;
      
      let obj: any = intersects[i].object;
      while (obj) {
        if (obj.userData && obj.userData.interactable) {
          foundId = obj.userData.id;
          foundObj = obj;
          break;
        }
        obj = obj.parent;
      }

      if (foundId || foundObj) break;
    }
    
    setHoveredId(foundId);
    hoveredObjectRef.current = foundObj;

    // Handle External Trigger (Mobile Button)
    if (triggerInteract && !prevTriggerRef.current) {
        performInteraction();
    }
    prevTriggerRef.current = triggerInteract;

    // Handle Gamepad Trigger (Updated to R2 (Index 7) or R1 (Index 5))
    if (gamepads[0]) {
        const gp = gamepads[0];
        // Check both R1 and R2 for compatibility
        // R2 (Trigger) is usually an analog button, so check pressed property or value > 0.5
        const isR2Pressed = gp.buttons[7] && (gp.buttons[7].pressed || gp.buttons[7].value > 0.5);
        const isR1Pressed = gp.buttons[5] && gp.buttons[5].pressed;

        const isPressed = isR2Pressed || isR1Pressed;
        
        if (isPressed && !prevGamepadInteractRef.current) {
            performInteraction();
        }
        prevGamepadInteractRef.current = isPressed;
    }
  });

  useEffect(() => {
    const handleMouseDown = () => {
      // Desktop interaction check
      if (!document.pointerLockElement) return;
      performInteraction();
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [hoveredId, heldId, camera, onItemCleaned, onCleanSuccess, dropZone, isActive]);

  return (
    <>
       {items.map((item) => (
        (!item.isCleaned) && (
          <InteractableItem 
            key={item.id} 
            data={item} 
            isHeld={heldId === item.id}
            isHovered={hoveredId === item.id}
          />
        )
      ))}
      {/* Tooltips */}
      {hoveredId === 'nightstand-drawer' && gameState === GameState.FREE_ROAM && isActive && (
        <Html position={[-2.5, 1.0, 1.0]} center distanceFactor={6}>
            <div className="pointer-events-none flex flex-col items-center">
              <div className="bg-white/90 text-[#5d4037] font-black px-3 py-1 rounded-full border-2 border-[#5d4037] shadow-lg animate-bounce whitespace-nowrap text-sm">
                 ✨ ABRIR
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#5d4037]"></div>
            </div>
        </Html>
      )}
      {hoveredId === 'radio' && gameState === GameState.FREE_ROAM && isActive && (
        <Html position={[2.6, 1.2, 0.5]} center distanceFactor={6}>
            <div className="pointer-events-none flex flex-col items-center">
              <div className="bg-white/90 text-[#5d4037] font-black px-3 py-1 rounded-full border-2 border-[#5d4037] shadow-lg animate-bounce whitespace-nowrap text-sm">
                 🎵 RADIO
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#5d4037]"></div>
            </div>
        </Html>
      )}
    </>
  );
};

// --- PLAYER CONTROLLER ---
const Player = ({ 
  moveRef, 
  lookRef,
  isActive
}: { 
  moveRef: React.MutableRefObject<{x: number, y: number}>, 
  lookRef: React.MutableRefObject<{x: number, y: number}>,
  isActive: boolean
}) => {
  const { camera } = useThree();
  const SPAWN_POS: [number, number, number] = [1.5, 1, -1.5]; // Safe spawn

  const [ref, api] = useSphere(() => ({
    mass: 80, 
    type: 'Dynamic',
    position: SPAWN_POS, 
    args: [0.4],
    fixedRotation: true, 
    linearDamping: 0, 
    material: { friction: 0, restitution: 0 },
    collisionFilterGroup: GROUP_PLAYER,
    collisionFilterMask: GROUP_SCENE 
  }));

  const keys = useRef({ w: false, s: false, a: false, d: false, shift: false, space: false });
  
  // Track Camera Rotation (Used for Mobile & Gamepad)
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'));
  
  useEffect(() => {
    // Init rotation
    euler.current.setFromQuaternion(camera.quaternion);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'KeyW' || key === 'ArrowUp') keys.current.w = true;
      if (key === 'KeyS' || key === 'ArrowDown') keys.current.s = true;
      if (key === 'KeyA' || key === 'ArrowLeft') keys.current.a = true;
      if (key === 'KeyD' || key === 'ArrowRight') keys.current.d = true;
      if (key === 'ShiftLeft' || key === 'ShiftRight') keys.current.shift = true;
      if (key === 'Space') keys.current.space = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'KeyW' || key === 'ArrowUp') keys.current.w = false;
      if (key === 'KeyS' || key === 'ArrowDown') keys.current.s = false;
      if (key === 'KeyA' || key === 'ArrowLeft') keys.current.a = false;
      if (key === 'KeyD' || key === 'ArrowRight') keys.current.d = false;
      if (key === 'ShiftLeft' || key === 'ShiftRight') keys.current.shift = false;
      if (key === 'Space') keys.current.space = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera]);

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const position = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (position.current = p)), [api.position]);

  const moveTowards = (current: number, target: number, maxChange: number) => {
    if (Math.abs(target - current) <= maxChange) return target;
    return current + Math.sign(target - current) * maxChange;
  };

  const footstepTimer = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // --- STOP MOVEMENT IF NOT ACTIVE (UI OPEN OR PAUSED) ---
    if (!isActive) {
      api.velocity.set(0, 0, 0); // Force stop
      return;
    }

    // --- INPUT HANDLING ---
    // Merge Keyboard, Mobile Touch, and Gamepad
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Primary controller

    // --- LOOK (Camera Rotation) ---
    // If PointerLockControls is active, it handles rotation automatically via mouse.
    // If NOT active (Mobile or Gamepad Mode), we handle rotation manually.
    if (!document.pointerLockElement) {
        let lookX = lookRef.current.x; // Mobile Touch X
        let lookY = lookRef.current.y; // Mobile Touch Y

        // Add Gamepad Right Stick (Axes 2 and 3)
        if (gp) {
            // Apply deadzone of 0.15
            const axis2 = Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0;
            const axis3 = Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0;
            
            // Add to look value
            // CHANGED: Reduced Sensitivity from 1.5 to 1.0 as requested
            const lookSensitivity = 1.0;
            lookX += axis2 * lookSensitivity; 
            lookY += axis3 * lookSensitivity;
        }
        
        if (lookX !== 0 || lookY !== 0) {
            const SENSITIVITY = 2.0 * delta;
            euler.current.y -= lookX * SENSITIVITY; // Yaw (Left/Right)
            euler.current.x -= lookY * SENSITIVITY; // Pitch (Up/Down)
            
            // Clamp pitch
            euler.current.x = MathUtils.clamp(euler.current.x, -Math.PI / 2.2, Math.PI / 2.2);
            
            camera.quaternion.setFromEuler(euler.current);
        }
    } else {
        // Keep euler synced so when we unlock, we don't snap back
        euler.current.setFromQuaternion(camera.quaternion);
    }

    // Update camera position to follow player body
    camera.position.set(position.current[0], position.current[1] + 1.2, position.current[2]);

    if (position.current[1] < -5) {
      api.velocity.set(0, 0, 0);
      api.position.set(...SPAWN_POS);
      return;
    }

    // --- MOVEMENT LOGIC ---
    // Calculate Forward/Side vectors relative to camera look direction
    const frontVector = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    frontVector.y = 0;
    frontVector.normalize();

    const sideVector = new Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
    sideVector.y = 0;
    sideVector.normalize();

    const direction = new Vector3();
    
    // 1. Keyboard Input
    if (keys.current.w) direction.add(frontVector);
    if (keys.current.s) direction.sub(frontVector);
    if (keys.current.a) direction.add(sideVector);
    if (keys.current.d) direction.sub(sideVector);

    // 2. Mobile Joystick Input
    let joyMoveX = moveRef.current.x; // Left/Right
    let joyMoveY = moveRef.current.y; // Up/Down (Forward/Back)

    // 3. Gamepad Left Stick Input (Axes 0 and 1)
    if (gp) {
        // Deadzone 0.15
        const axis0 = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
        const axis1 = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
        
        // Add gamepad stick to "joystick" values
        // Note: Gamepad Axis 1 is usually inverted relative to our Touch logic (-1 is up on touch, -1 is up on gamepad usually)
        // Adjusting signs to match direction logic below:
        // Logic below: Y < 0 adds FrontVector (Forward). Gamepad Up is usually -1. So negative matches.
        
        joyMoveX += -axis0; // Inverting X to match logic below
        joyMoveY += axis1;
    }
    
    // Apply Merged Joystick/Gamepad Movement
    if (joyMoveY < 0) direction.add(frontVector.clone().multiplyScalar(Math.abs(joyMoveY)));
    if (joyMoveY > 0) direction.sub(frontVector.clone().multiplyScalar(Math.abs(joyMoveY)));
    if (joyMoveX < 0) direction.add(sideVector.clone().multiplyScalar(Math.abs(joyMoveX)));
    if (joyMoveX > 0) direction.sub(sideVector.clone().multiplyScalar(Math.abs(joyMoveX)));


    const BASE_SPEED = 5.0; 
    const RUN_SPEED = 9.0;
    // Check Keyboard Shift OR Gamepad Button (e.g., L2/R2 or Click Stick)
    // Often Button 10 is L3 (Left Stick Click) or use trigger. Let's stick to simple run.
    const isRunning = keys.current.shift || (gp && (gp.buttons[10]?.pressed || Math.abs(joyMoveY) > 0.9)); // Run if pushing stick full tilt
    const currentSpeed = isRunning ? RUN_SPEED : BASE_SPEED;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(currentSpeed);
    }

    let vy = velocity.current[1];
    // Jump: Space OR Gamepad Button 0 (South/A/Cross)
    // Only check jump if Active (handled by early return at top, but nice to be explicit)
    const gpJump = gp && gp.buttons[0].pressed;
    
    if ((keys.current.space || gpJump) && Math.abs(vy) < 0.1 && position.current[1] < 1.0) {
      vy = 6; 
    }

    const accel = 40.0 * delta; 
    const smoothX = moveTowards(velocity.current[0], direction.x, accel);
    const smoothZ = moveTowards(velocity.current[2], direction.z, accel);

    api.velocity.set(smoothX, vy, smoothZ);

    const horizontalSpeed = Math.sqrt(smoothX*smoothX + smoothZ*smoothZ);
    
    if (horizontalSpeed > 0.5 && position.current[1] < 1.2) {
      // Faster footsteps for snappier feel
      const interval = isRunning ? 0.25 : 0.35;
      footstepTimer.current += delta;
      if (footstepTimer.current > interval) {
        audioManager.play('footstep', true);
        footstepTimer.current = 0;
      }
    } else {
      footstepTimer.current = 0.4;
    }
  });

  return <mesh ref={ref as any} />;
};

interface GameSceneProps {
  gameState: GameState;
  items: ItemData[];
  onItemCleaned: (id: string) => void;
  timeOfDay?: 'day' | 'night' | 'sunset';
  dropZone: 'basket' | 'closet';
  onOpenDrawer?: () => void;
  onOpenRadio?: () => void;
  onDoorInteract?: () => void; // NEW PROP
  controlsEnabled?: boolean;
  mobileInputs?: {
      move: React.MutableRefObject<{x: number, y: number}>,
      look: React.MutableRefObject<{x: number, y: number}>,
      interact: boolean
  };
  isMobile?: boolean;
  isUIOpen?: boolean; // New prop to block inputs
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  gameState, 
  items, 
  onItemCleaned, 
  timeOfDay = 'day', 
  dropZone, 
  onOpenDrawer,
  onOpenRadio,
  onDoorInteract,
  controlsEnabled = true,
  mobileInputs,
  isMobile = false,
  isUIOpen = false
}) => {
  const [cleanEffectTime, setCleanEffectTime] = useState(0);

  // Fallback refs if not provided (Desktop mode)
  const defaultMoveRef = useRef({x:0, y:0});
  const defaultLookRef = useRef({x:0, y:0});

  const moveRef = mobileInputs ? mobileInputs.move : defaultMoveRef;
  const lookRef = mobileInputs ? mobileInputs.look : defaultLookRef;
  const interactTrigger = mobileInputs ? mobileInputs.interact : false;

  // Determine if gameplay is truly active (not paused, not in menu, not in UI overlay)
  const isGameplayActive = (gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) && !isUIOpen;

  // Lighting Logic based on Time of Day
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const skyConfig = isSunset 
    ? { sunPos: [50, 0.5, 10], turbidity: 12, rayleigh: 5.0, mieCoeff: 0.05, mieDir: 0.6 } // Sunset
    : { sunPos: [10, 10, 10], turbidity: 6, rayleigh: 0.8, mieCoeff: 0.005, mieDir: 0.8 }; // Day

  const fogColor = isNight ? '#0f172a' : (isSunset ? '#ffccbc' : '#fffbf0');
  const ambientIntensity = isNight ? 0.4 : (isSunset ? 0.6 : 0.6);
  const ambientColor = isNight ? "#3b82f6" : (isSunset ? "#ffcc80" : "#fff3e0");

  return (
    <Canvas 
      shadows 
      camera={{ fov: 75, near: 0.1, far: 100 }}
      dpr={[1, 2]} 
      gl={{ stencil: false, powerPreference: "high-performance" }} 
    >
      {isNight ? (
        <>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <color attach="background" args={['#0f172a']} /> 
        </>
      ) : (
        <Sky 
          sunPosition={skyConfig.sunPos as [number, number, number]} 
          turbidity={skyConfig.turbidity} 
          rayleigh={skyConfig.rayleigh} 
          mieCoefficient={skyConfig.mieCoeff} 
          mieDirectionalG={skyConfig.mieDir} 
        />
      )}
      
      <fog attach="fog" args={[fogColor, 0, 25]} />

      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <hemisphereLight args={[
        isNight ? '#60a5fa' : (isSunset ? '#ffb74d' : '#fff3e0'),
        isNight ? '#1e293b' : (isSunset ? '#8d6e63' : '#ffe0b2'), 
        isNight ? 0.4 : 0.7
      ]} />

      <pointLight 
        position={[0, 2.6, 0]} 
        intensity={isNight ? 1.0 : (isSunset ? 1.0 : 0.9)} 
        color={isNight ? "#ffcc80" : (isSunset ? "#ffb74d" : "#ffecb3")} 
        distance={12} 
        decay={2} 
        castShadow 
        shadow-bias={-0.0005} 
        shadow-mapSize={[2048, 2048]} 
      />

      <pointLight 
        position={[-2.5, 0.8, 1.0]} 
        intensity={isNight ? 2.0 : 0.6}
        color="#ffb74d" 
        distance={isNight ? 20 : 8} 
        decay={2} 
      />

      {(!isNight) && (
        <spotLight 
          position={[6, 4, 1]} 
          target-position={[0, 0, 0]} 
          angle={0.6} 
          penumbra={0.8} 
          intensity={isSunset ? 2.5 : 1.5} 
          color={isSunset ? "#ffc107" : "#fff8e1"} 
          castShadow 
          shadow-bias={-0.0005} 
          shadow-mapSize={[2048, 2048]} 
        />
      )}

      <Physics gravity={[0, -15, 0]}>
        <Player moveRef={moveRef} lookRef={lookRef} isActive={isGameplayActive} />
        <RoomEnvironment 
           cleanTrigger={cleanEffectTime} 
           onOpenDrawer={onOpenDrawer} 
           onOpenRadio={onOpenRadio}
           onDoorInteract={onDoorInteract}
           timeOfDay={timeOfDay} 
        />
        <CleaningBasket trigger={cleanEffectTime} />
        <InteractionManager 
          items={items} 
          onItemCleaned={onItemCleaned} 
          onCleanSuccess={() => setCleanEffectTime(Date.now())} 
          dropZone={dropZone}
          gameState={gameState}
          triggerInteract={interactTrigger}
          isActive={isGameplayActive}
        />
      </Physics>
      
      {/* 
          CONDITIONAL CONTROLS 
          Only mount PointerLockControls if controlsEnabled is TRUE AND NOT on mobile.
      */}
      {controlsEnabled && !isMobile && (gameState === GameState.PLAYING || gameState === GameState.PAUSED || gameState === GameState.WON || gameState === GameState.LOST || gameState === GameState.FREE_ROAM) && (
        <PointerLockControls makeDefault />
      )}
    </Canvas>
  );
};
