


import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import { Vector3, CanvasTexture, RepeatWrapping, MathUtils, Color, Euler, Quaternion, Group } from 'three';
import { audioManager } from '../utils/audio';
import { Language } from '../types';

// --- TYPES ---
// Added 'SERVED' step for when the sandwich is back on the board ready to eat
type CookingStep = 'EMPTY' | 'BREAD_ON_BOARD' | 'SLICED' | 'CHEESE_ADDED' | 'HAM_ADDED' | 'TOP_BREAD_ADDED' | 'TOP_CHEESE_ADDED' | 'FINISHED' | 'SERVED';
type HeldItem = 'NONE' | 'INGREDIENT_BREAD' | 'INGREDIENT_CHEESE' | 'INGREDIENT_HAM' | 'TOOL_KNIFE' | 'RAW_SANDWICH' | 'COOKED_SANDWICH';

// --- TRANSLATIONS ---
const KITCHEN_TEXTS = {
    es: {
        intro: "¡VAMOS A COCINAR UN CROQUE MONSIEUR! CLICK EN EL PAN",
        bread_on_board: "CLICK EN LA TABLA PARA DEJAR EL PAN",
        cut_bread: "AHORA TOMA EL CUCHILLO Y CORTA EL PAN",
        cut_action: "CORTA EL PAN (CLICK EN LA TABLA)",
        leave_knife: "DEJA EL CUCHILLO Y TOMA EL QUESO",
        add_ham: "AHORA PONLE EL JAMÓN",
        add_top_bread: "PON LA OTRA TAPA DE PAN",
        add_top_cheese: "FALTA LO MÁS RICO: ¡QUESO ARRIBA!",
        finished_raw: "¡LISTO! AGÁRRALO Y LLÉVALO AL HORNO",
        oven_hint: "VE A LA IZQUIERDA Y MÉTELO AL HORNO",
        get_cheese: "AHORA TOMA EL QUESO",
        waiting: "¡ESPERA A QUE SE COCINE!",
        done: "¡YA ESTÁ! SÁCALO DEL HORNO",
        plate_it: "PONLO EN LA TABLA PARA COMER",
        eat_it: "¡SE VE DELICIOSO! CLICK PARA COMERLO",
        win_title: "mmm...",
        win_desc: "el croque monsieur estaba muy rico",
        replay: "VOLVER A COCINAR",
        exit_roam: "VOLVER A PASEAR",
        exit: "SALIR",
        supply_bread: "CLICK EN LA TABLA PARA DEJAR EL PAN",
        supply_cheese: "PONLO EN EL SANDWICH",
        supply_ham: "PONLO EN EL SANDWICH",
        supply_knife: "CORTA EL PAN (CLICK EN LA TABLA)",
    },
    fr: {
        intro: "CUISINONS UN CROQUE-MONSIEUR ! CLIQUE SUR LE PAIN",
        bread_on_board: "CLIQUE SUR LA PLANCHE POUR POSER LE PAIN",
        cut_bread: "PRENDS LE COUTEAU ET COUPE LE PAIN",
        cut_action: "COUPE LE PAIN (CLIQUE SUR LA PLANCHE)",
        leave_knife: "LAISSE LE COUTEAU ET PRENDS LE FROMAGE",
        add_ham: "MAINTENANT, AJOUTE LE JAMBON",
        add_top_bread: "METS L'AUTRE TRANCHE DE PAIN",
        add_top_cheese: "LE MEILLEUR POUR LA FIN : DU FROMAGE DESSUS !",
        finished_raw: "C'EST PRÊT ! PRENDS-LE ET METS-LE AU FOUR",
        oven_hint: "VA À GAUCHE ET METS-LE AU FOUR",
        get_cheese: "MAINTENANT, PRENDS LE FROMAGE",
        waiting: "ATTENDS QU'IL CUISE !",
        done: "C'EST CUIT ! SORS-LE DU FOUR",
        plate_it: "METS-LE SUR LA PLANCHE POUR MANGER",
        eat_it: "ÇA A L'AIR DÉLICIEUX ! CLIQUE POUR MANGER",
        win_title: "miam...",
        win_desc: "le croque-monsieur était délicieux",
        replay: "CUISINER ENCORE",
        exit_roam: "RETOURNER SE PROMENER",
        exit: "QUITTER",
        supply_bread: "CLIQUE SUR LA PLANCHE POUR POSER LE PAIN",
        supply_cheese: "METS-LE SUR LE SANDWICH",
        supply_ham: "METS-LE SUR LE SANDWICH",
        supply_knife: "COUPE LE PAIN (CLIQUE SUR LA PLANCHE)",
    }
}

// --- TEXTURE GENERATION ---
const generateKitchenTextures = () => {
  const width = 512;
  const height = 512;

  // --- 1. FLOOR TILES (Ivory/Bone/White) ---
  const canvasFloor = document.createElement('canvas');
  canvasFloor.width = width;
  canvasFloor.height = height;
  const ctxFloor = canvasFloor.getContext('2d')!;

  // Grout
  ctxFloor.fillStyle = '#e5e5e5'; 
  ctxFloor.fillRect(0, 0, width, height);

  const tileSize = 64; 
  const gap = 3; 
  
  for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
          const rand = Math.random();
          ctxFloor.fillStyle = rand > 0.5 ? '#faf9f6' : '#f5f5f0'; 
          ctxFloor.fillRect(x + gap/2, y + gap/2, tileSize - gap, tileSize - gap);
      }
  }

  const floorTexture = new CanvasTexture(canvasFloor);
  floorTexture.wrapS = RepeatWrapping;
  floorTexture.wrapT = RepeatWrapping;
  floorTexture.repeat.set(4, 4);

  // --- 2. WALL TILES (Soft Vanilla) ---
  const canvasWall = document.createElement('canvas');
  canvasWall.width = width;
  canvasWall.height = height;
  const ctxWall = canvasWall.getContext('2d')!;

  // Grout
  ctxWall.fillStyle = '#ffffff'; 
  ctxWall.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
          const rand = Math.random();
          ctxWall.fillStyle = rand > 0.6 ? '#fff9c4' : '#fffde7'; 
          ctxWall.fillRect(x + gap/2, y + gap/2, tileSize - gap, tileSize - gap);
          
          ctxWall.fillStyle = 'rgba(255,255,255,0.2)';
          ctxWall.fillRect(x + gap/2, y + gap/2, (tileSize-gap)*0.8, 4);
      }
  }

  const wallTexture = new CanvasTexture(canvasWall);
  wallTexture.wrapS = RepeatWrapping;
  wallTexture.wrapT = RepeatWrapping;
  wallTexture.repeat.set(4, 4);

  return { floorTexture, wallTexture };
};

// --- CONFETTI SYSTEM ---
const ConfettiParticles = ({ trigger }: { trigger: number }) => {
  const groupRef = useRef<Group>(null);
  const particlesRef = useRef<{ pos: Vector3; vel: Vector3; rot: Vector3; rotVel: Vector3; color: Color; active: boolean }[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    // Create 30 particles
    particlesRef.current = new Array(30).fill(0).map(() => ({
      pos: new Vector3(0, 0.1, 0),
      vel: new Vector3((Math.random() - 0.5) * 2, Math.random() * 2 + 1, (Math.random() - 0.5) * 2),
      rot: new Vector3(Math.random(), Math.random(), Math.random()),
      rotVel: new Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      color: new Color().setHSL(Math.random(), 0.8, 0.6),
      active: true
    }));

    if (groupRef.current) {
        groupRef.current.children.forEach(child => child.scale.setScalar(1));
    }
  }, [trigger]);

  useFrame((state, delta) => {
      if (!groupRef.current) return;
      groupRef.current.children.forEach((child, i) => {
          const p = particlesRef.current[i];
          if (p && p.active) {
              p.vel.y -= 5 * delta; // Gravity
              p.pos.add(p.vel.clone().multiplyScalar(delta));
              p.rot.x += p.rotVel.x * delta;
              
              child.position.copy(p.pos);
              child.rotation.set(p.rot.x, p.rot.y, p.rot.z);
              
              if (child.scale.x > 0) child.scale.subScalar(delta * 0.5);
              else p.active = false;
          }
      });
  });

  return (
      <group ref={groupRef} position={[0, 0.95, -1.4]}>
          {new Array(30).fill(0).map((_, i) => (
              <mesh key={i} scale={[0,0,0]}>
                  <planeGeometry args={[0.05, 0.05]} />
                  <meshBasicMaterial side={2} color={particlesRef.current[i]?.color || 'white'} />
              </mesh>
          ))}
      </group>
  )
}

// --- COMPONENTS ---

// FIXED CAMERA CONTROLLER
const KitchenCamera = ({ viewIndex }: { viewIndex: number }) => {
    const { camera } = useThree();
    
    // 0 = MAIN CENTER, 1 = STOVE LEFT
    const TARGETS = useMemo(() => [
        { 
            // MAIN VIEW
            pos: new Vector3(0, 1.5, -0.7), 
            rot: new Euler(-0.55, 0, 0, 'YXZ')      
        },
        { 
            // STOVE VIEW
            pos: new Vector3(-0.6, 1.45, -0.5), 
            rot: new Euler(-0.3, Math.PI / 2, 0, 'YXZ') 
        }
    ], []);

    useFrame((state, delta) => {
        const target = TARGETS[viewIndex];
        camera.position.lerp(target.pos, delta * 3);
        const targetQuat = new Quaternion().setFromEuler(target.rot);
        camera.quaternion.slerp(targetQuat, delta * 3);
    });

    return null;
}

// --- FIRST PERSON HAND (Items attached to camera) ---
const FirstPersonHand = ({ heldItem }: { heldItem: HeldItem }) => {
    const ref = useRef<any>(null);
    const { camera } = useThree();

    useFrame((state) => {
        if (ref.current) {
            // Bobbing animation (breathing)
            const t = state.clock.getElapsedTime();
            const swayY = Math.sin(t * 2) * 0.015;
            const swayX = Math.cos(t * 1.5) * 0.005;

            // Position relative to camera (Left Hand: negative X, negative Y, negative Z)
            // Z = -0.4 places it very close to camera (like FPS view)
            // UPDATED Y from -0.25 to -0.14 to raise the hand
            const offset = new Vector3(-0.25 + swayX, -0.14 + swayY, -0.4);
            
            // Apply camera rotation to the offset vector
            offset.applyQuaternion(camera.quaternion);
            
            // Set position: Camera Pos + Rotated Offset
            ref.current.position.copy(camera.position).add(offset);
            
            // Lock rotation to camera
            ref.current.rotation.copy(camera.rotation);
            
            // Add a slight tilt to the item so we see the top/side better
            ref.current.rotateX(0.2); 
            ref.current.rotateY(0.2);
        }
    });

    if (heldItem === 'NONE') return null;

    // We scale down the held items slightly because they are very close to the camera
    const HAND_SCALE = 0.6; 

    return (
        <group ref={ref}>
            <group scale={[HAND_SCALE, HAND_SCALE, HAND_SCALE]}>
                {/* Visuals based on held item */}
                {heldItem === 'INGREDIENT_BREAD' && (
                    <mesh rotation={[0.2, 0.5, 0]}>
                        <boxGeometry args={[0.2, 0.08, 0.15]} />
                        <meshStandardMaterial color="#8d6e63" />
                    </mesh>
                )}
                {heldItem === 'INGREDIENT_CHEESE' && (
                    <mesh rotation={[0.2, 0, 0]}>
                        <boxGeometry args={[0.16, 0.01, 0.16]} />
                        <meshStandardMaterial color="#fff176" />
                    </mesh>
                )}
                {heldItem === 'INGREDIENT_HAM' && (
                    <mesh rotation={[0.2, 0, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 0.01]} />
                        <meshStandardMaterial color="#f48fb1" />
                    </mesh>
                )}
                {heldItem === 'TOOL_KNIFE' && (
                    <group rotation={[1.2, 0, -0.5]}>
                        <mesh>
                            <boxGeometry args={[0.04, 0.02, 0.15]} />
                            <meshStandardMaterial color="#5d4037" />
                        </mesh>
                        <mesh position={[0, 0, -0.15]}>
                            <boxGeometry args={[0.02, 0.005, 0.2]} />
                            <meshStandardMaterial color="#cfd8dc" />
                        </mesh>
                    </group>
                )}
                {(heldItem === 'RAW_SANDWICH' || heldItem === 'COOKED_SANDWICH') && (
                    <group rotation={[0.2, 0, 0]}>
                        {/* Bread */}
                        <mesh>
                            <boxGeometry args={[0.18, 0.06, 0.18]} />
                            <meshStandardMaterial color={heldItem === 'COOKED_SANDWICH' ? "#e6a15c" : "#fff8e1"} />
                        </mesh>
                        {/* Toasted Top Cheese */}
                        <mesh position={[0, 0.035, 0]}>
                            <boxGeometry args={[0.16, 0.01, 0.16]} />
                            <meshStandardMaterial color={heldItem === 'COOKED_SANDWICH' ? "#d2691e" : "#fff176"} />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};


// --- INTERACTIVE STOVE ---
const InteractiveStove = ({ 
  heldItem, 
  setHeldItem, 
  ovenState, 
  setOvenState,
  setInstruction,
  texts
}: any) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    // COLORS
    const BODY_COLOR = "#b0bec5"; 
    const METAL_COLOR = "#78909c"; 
    const KNOB_COLOR = "#263238"; 
    
    const handleOvenClick = (e: any) => {
        e.stopPropagation();
        
        if (ovenState === 'IDLE' && heldItem === 'RAW_SANDWICH') {
            // Put sandwich in
            setHeldItem('NONE');
            setOvenState('COOKING');
            setInstruction(texts.waiting);
            audioManager.play('door_close'); 
            audioManager.play('sizzle'); // Sound effect for cooking start
            
            setTimeout(() => {
                audioManager.stop('sizzle'); // Stop sizzle sound
                audioManager.play('oven_ding'); // Ding sound when ready
                setOvenState('DONE');
                setInstruction(texts.done);
            }, 5000);
        } else if (ovenState === 'DONE') {
            // Take sandwich out
            setHeldItem('COOKED_SANDWICH');
            setOvenState('IDLE');
            setInstruction(texts.plate_it); // Updated Instruction
            audioManager.play('pickup');
        }
    };

    // Toasted Sandwich Mesh (Inside Oven)
    const SandwichInOven = ({ cooked }: { cooked: boolean }) => (
        <group position={[0, 0.05, 0]}>
            {/* Bread */}
            <mesh>
                <boxGeometry args={[0.18, 0.06, 0.18]} />
                <meshStandardMaterial color={cooked ? "#e6a15c" : "#fff8e1"} />
            </mesh>
            {/* Top Cheese - Changes color dramatically */}
            <mesh position={[0, 0.035, 0]}>
                <boxGeometry args={[0.16, 0.01, 0.16]} />
                <meshStandardMaterial 
                    color={cooked ? "#d2691e" : "#fff176"} 
                    roughness={cooked ? 0.8 : 0.4}
                />
            </mesh>
        </group>
    );

    return (
        <group position={[-2.05, 0.0, -0.5]} rotation={[0, Math.PI/2, 0]}>
            {/* Clickable Zone for Oven */}
            <mesh 
                position={[0, 0.45, 0.4]} 
                visible={false} 
                onClick={handleOvenClick}
                onPointerOver={() => {
                    if (heldItem === 'RAW_SANDWICH' || ovenState === 'DONE') setHover(true);
                }}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[0.7, 0.8, 0.1]} />
            </mesh>

            {/* Main Body */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[0.74, 0.9, 0.7]} /> 
                <meshStandardMaterial color={BODY_COLOR} roughness={0.4} metalness={0.2} />
            </mesh>
            
            {/* Kick Plate */}
            <mesh position={[0, 0.05, 0.36]}>
                 <boxGeometry args={[0.7, 0.1, 0.02]} />
                 <meshStandardMaterial color={METAL_COLOR} />
            </mesh>

            {/* Oven Door */}
            <group position={[0, 0.45, 0.36]}>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.63, 0.55, 0.04]} />
                    <meshStandardMaterial color={BODY_COLOR} roughness={0.4} />
                </mesh>
                
                {/* Window */}
                <mesh position={[0, 0.05, 0.025]}>
                    <planeGeometry args={[0.45, 0.35]} />
                    <meshPhysicalMaterial 
                        color={ovenState === 'COOKING' ? "#ffab91" : "#111"} 
                        emissive={ovenState === 'COOKING' ? "#ff5722" : "#000"}
                        emissiveIntensity={ovenState === 'COOKING' ? 0.5 : 0}
                        roughness={0.1} 
                        metalness={0.5} 
                    />
                </mesh>
                
                {/* Visual Feedback for Hover */}
                {hovered && (
                     <mesh position={[0, 0.05, 0.03]}>
                        <ringGeometry args={[0.22, 0.25, 32]} /> 
                        <meshBasicMaterial color="#4ade80" />
                     </mesh>
                )}

                {/* Handle */}
                <mesh position={[0, 0.22, 0.06]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.55]} />
                    <meshStandardMaterial color="#eceff1" metalness={0.6} roughness={0.3} />
                </mesh>
            </group>

            {/* SANDWICH INSIDE OVEN */}
            {(ovenState === 'COOKING' || ovenState === 'DONE') && (
                <group position={[0, 0.3, 0]}>
                    <SandwichInOven cooked={ovenState === 'DONE'} />
                </group>
            )}

            {/* Control Panel with LED */}
            <group position={[0, 0.82, 0.36]}>
                <mesh>
                    <boxGeometry args={[0.74, 0.16, 0.03]} />
                    <meshStandardMaterial color={BODY_COLOR} />
                </mesh>
                
                {/* Knobs */}
                {[-0.2, -0.07, 0.07, 0.2].map((x, i) => (
                    <group key={i} position={[x, 0, 0.02]} rotation={[Math.PI/2, 0, 0]}>
                        <mesh>
                            <cylinderGeometry args={[0.03, 0.035, 0.02]} />
                            <meshStandardMaterial color={KNOB_COLOR} metalness={0.3} roughness={0.6} />
                        </mesh>
                    </group>
                ))}

                {/* Status Light */}
                <mesh position={[0, 0.05, 0.02]}>
                     <circleGeometry args={[0.02]} />
                     <meshBasicMaterial color={ovenState === 'COOKING' ? "red" : (ovenState === 'DONE' ? "#4ade80" : "#333")} />
                </mesh>
            </group>

            {/* Burners */}
            <group position={[0, 0.91, 0]}>
                <mesh position={[0, -0.01, 0]}>
                    <boxGeometry args={[0.74, 0.02, 0.7]} />
                    <meshStandardMaterial color="#455a64" roughness={0.6} />
                </mesh>
                {[
                    { x: -0.18, z: -0.18, s: 0.1 }, 
                    { x: -0.18, z: 0.18, s: 0.08 },
                    { x: 0.18, z: -0.18, s: 0.08 },
                    { x: 0.18, z: 0.18, s: 0.12 }
                ].map((b, i) => (
                    <group key={i} position={[b.x, 0, b.z]}>
                         <mesh position={[0, 0.015, 0]}>
                            <cylinderGeometry args={[b.s, b.s, 0.02]} />
                            <meshStandardMaterial color="#212121" roughness={0.9} />
                         </mesh>
                    </group>
                ))}
            </group>
            
            {/* Hood */}
             <group position={[0, 2.0, 0]}>
                 <mesh position={[0, -0.2, 0]} castShadow>
                     <boxGeometry args={[0.76, 0.15, 0.7]} />
                     <meshStandardMaterial color={BODY_COLOR} />
                 </mesh>
             </group>
        </group>
    )
}

// --- DECORATIVE PROPS ---
const CornerProps = () => (
    <>
        <group position={[1.2, 0.92, -1.4]} rotation={[0, -0.5, 0]}>
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.35]} />
                <meshStandardMaterial color="#8d6e63" />
            </mesh>
            <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI/4, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.28, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
            </mesh>
        </group>

        <group position={[-2.3, 0.92, -1.8]} rotation={[0, 0.5, 0]}>
             <mesh position={[0, 0.12, 0]} rotation={[0.4, 0, 0]} castShadow>
                 <boxGeometry args={[0.15, 0.25, 0.1]} />
                 <meshStandardMaterial color="#5d4037" />
             </mesh>
             {[0.04, 0, -0.04].map((x, i) => (
                 <group key={i} position={[x, 0.25, -0.05]} rotation={[0.4, 0, 0]}>
                     <mesh><boxGeometry args={[0.02, 0.12, 0.01]} /><meshStandardMaterial color="#212121" /></mesh>
                 </group>
             ))}
        </group>

        <group position={[-0.4, 0.92, -1.8]}>
             <mesh position={[0, 0.05, 0]} castShadow>
                 <cylinderGeometry args={[0.25, 0.15, 0.1, 16, 1, true]} />
                 <meshStandardMaterial color="#f0f4c3" side={2} />
             </mesh>
             <mesh position={[0, 0.08, 0]}><sphereGeometry args={[0.07]} /><meshStandardMaterial color="#ef5350" /></mesh>
             <mesh position={[0.08, 0.1, 0.05]}><sphereGeometry args={[0.065]} /><meshStandardMaterial color="#66bb6a" /></mesh>
        </group>
    </>
);

// --- WORKSTATION & INGREDIENTS ---
const Workstation = ({ 
    step, 
    setStep, 
    heldItem,
    setHeldItem,
    setInstruction,
    onEat,
    texts
}: any) => {
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);
    useCursor(!!hoveredPart);

    // --- STRICT VALIDATION LOGIC ---
    // Returns TRUE only if this item is the exact one needed for the current step
    const isAllowed = (item: HeldItem) => {
        if (heldItem !== 'NONE') return false; // Hand is full, can't pick up
        
        switch (step) {
            case 'EMPTY': return item === 'INGREDIENT_BREAD';
            case 'BREAD_ON_BOARD': return item === 'TOOL_KNIFE';
            case 'SLICED': return item === 'INGREDIENT_CHEESE';
            case 'CHEESE_ADDED': return item === 'INGREDIENT_HAM';
            case 'HAM_ADDED': return item === 'INGREDIENT_BREAD';
            case 'TOP_BREAD_ADDED': return item === 'INGREDIENT_CHEESE';
            default: return false; 
        }
    };

    // BOARD CLICK HANDLER (DROP ZONE)
    const handleBoardClick = (e: any) => {
        e.stopPropagation();

        // 1. Placing Bread
        if (step === 'EMPTY' && heldItem === 'INGREDIENT_BREAD') {
            setHeldItem('NONE');
            setStep('BREAD_ON_BOARD');
            setInstruction(texts.cut_bread);
            audioManager.play('place'); // Updated sound
        } 
        // 2. Slicing with Knife
        else if (step === 'BREAD_ON_BOARD' && heldItem === 'TOOL_KNIFE') {
            setStep('SLICED');
            setInstruction(texts.leave_knife);
            audioManager.play('chop'); // Chop sound
        }
        // 3. Adding Cheese
        else if (step === 'SLICED' && heldItem === 'INGREDIENT_CHEESE') {
            setHeldItem('NONE');
            setStep('CHEESE_ADDED');
            setInstruction(texts.add_ham);
            audioManager.play('place'); // Updated sound
        }
        // 4. Adding Ham
        else if (step === 'CHEESE_ADDED' && heldItem === 'INGREDIENT_HAM') {
            setHeldItem('NONE');
            setStep('HAM_ADDED');
            setInstruction(texts.add_top_bread);
            audioManager.play('place'); // Updated sound
        }
        // 5. Adding Top Bread
        else if (step === 'HAM_ADDED' && heldItem === 'INGREDIENT_BREAD') {
            setHeldItem('NONE');
            setStep('TOP_BREAD_ADDED');
            setInstruction(texts.add_top_cheese);
            audioManager.play('place'); // Updated sound
        }
        // 6. Adding Top Cheese (Croque Monsieur Style)
        else if (step === 'TOP_BREAD_ADDED' && heldItem === 'INGREDIENT_CHEESE') {
            setHeldItem('NONE');
            setStep('FINISHED'); // RAW_SANDWICH READY
            setInstruction(texts.finished_raw);
            audioManager.play('place'); // Updated sound
        }
        // 7. Picking up Finished Raw Sandwich
        else if (step === 'FINISHED' && heldItem === 'NONE') {
            setStep('EMPTY');
            setHeldItem('RAW_SANDWICH');
            setInstruction(texts.oven_hint);
            audioManager.play('pickup');
        }
        // 8. Dropping Knife Back
        else if (heldItem === 'TOOL_KNIFE') {
            setHeldItem('NONE');
            // If we just dropped the knife after cutting
            if(step === 'SLICED') setInstruction(texts.get_cheese);
            audioManager.play('drop');
        }
        // 9. Placing Cooked Sandwich (Serving)
        else if (heldItem === 'COOKED_SANDWICH') {
            setHeldItem('NONE');
            setStep('SERVED');
            setInstruction(texts.eat_it);
            audioManager.play('place'); // Updated sound
        }
        // 10. Eating the Served Sandwich
        else if (step === 'SERVED') {
            onEat();
        }
    };

    // SUPPLY CLICK HANDLERS (PICKUP)
    const handleSupplyClick = (item: HeldItem, nextInstruction: string) => {
        // STRICT VALIDATION
        if (!isAllowed(item)) return; 

        setHeldItem(item);
        setInstruction(nextInstruction);
        audioManager.play('pickup');
    };

    return (
        <group position={[0, 0.91, -1.4]}>
            {/* Cutting Board (Main Drop Zone) */}
            <mesh 
                // Z-FIGHTING FIX: Raised Y to 0.03
                position={[0, 0.03, 0]} 
                rotation={[0, 0.05, 0]} 
                receiveShadow
                onClick={handleBoardClick}
                onPointerOver={() => setHoveredPart('BOARD')}
                onPointerOut={() => setHoveredPart(null)}
            >
                <boxGeometry args={[0.6, 0.02, 0.4]} />
                <meshStandardMaterial color="#d7ccc8" />
                
                {/* Visual Cue for Drop Zone */}
                {hoveredPart === 'BOARD' && (heldItem !== 'NONE' || step === 'SERVED') && (
                    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
                        <planeGeometry args={[0.5, 0.3]} />
                        <meshBasicMaterial color="#4ade80" transparent opacity={0.3} />
                    </mesh>
                )}
            </mesh>

            {/* --- INGREDIENT SUPPLY --- */}
            
            {/* Bread Loaf (Left) - RECTANGULAR SIMPLIFIED & REORIENTED */}
            <group 
                position={[-0.6, 0, 0]} 
                onClick={(e) => { e.stopPropagation(); handleSupplyClick('INGREDIENT_BREAD', texts.bread_on_board); }}
                onPointerOver={() => isAllowed('INGREDIENT_BREAD') && setHoveredPart('LOAF')}
                onPointerOut={() => setHoveredPart(null)}
            >
                <group position={[0, 0.07, 0]}>
                    {/* Main Crust Body (Length along Z axis now) */}
                    <mesh castShadow>
                        <boxGeometry args={[0.22, 0.14, 0.35]} />
                        <meshStandardMaterial color="#cd853f" roughness={0.6} />
                    </mesh>

                    {/* The "Cut" Face - Now on +Z Face (Front) */}
                    <mesh position={[0, 0, 0.176]}>
                         <boxGeometry args={[0.20, 0.12, 0.01]} />
                         <meshStandardMaterial color="#fff3e0" roughness={0.9} />
                    </mesh>

                    {/* Scoring/Cuts on top - Run horizontally (X axis) */}
                    {[-0.08, 0, 0.08].map((z, i) => (
                        <mesh key={i} position={[0, 0.071, z]} rotation={[0, 0, 0]}>
                             <boxGeometry args={[0.16, 0.01, 0.02]} />
                             <meshStandardMaterial color="#8d6e63" />
                        </mesh>
                    ))}
                </group>

                {hoveredPart === 'LOAF' && <mesh position={[0,0.3,0]}><sphereGeometry args={[0.03]} /><meshBasicMaterial color="#4ade80" /></mesh>}
            </group>

            {/* Ingredients Stack (Right) */}
            <group position={[0.5, 0, 0]}>
                {/* Cheese Stack */}
                <group 
                    position={[0, 0, -0.1]} 
                    onClick={(e) => { e.stopPropagation(); handleSupplyClick('INGREDIENT_CHEESE', texts.supply_cheese); }}
                    onPointerOver={() => isAllowed('INGREDIENT_CHEESE') && setHoveredPart('CHEESE_STACK')}
                    onPointerOut={() => setHoveredPart(null)}
                >
                    <mesh position={[0, 0.02, 0]} castShadow>
                        <boxGeometry args={[0.15, 0.04, 0.15]} />
                        <meshStandardMaterial color="#fff176" />
                    </mesh>
                    {hoveredPart === 'CHEESE_STACK' && <mesh position={[0,0.1,0]}><sphereGeometry args={[0.02]} /><meshBasicMaterial color="#4ade80" /></mesh>}
                </group>

                {/* Ham Stack */}
                <group 
                    position={[0, 0, 0.1]}
                    onClick={(e) => { e.stopPropagation(); handleSupplyClick('INGREDIENT_HAM', texts.supply_ham); }}
                    onPointerOver={() => isAllowed('INGREDIENT_HAM') && setHoveredPart('HAM_STACK')}
                    onPointerOut={() => setHoveredPart(null)}
                >
                    <mesh position={[0, 0.02, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.04]} />
                        <meshStandardMaterial color="#f48fb1" />
                    </mesh>
                    {hoveredPart === 'HAM_STACK' && <mesh position={[0,0.1,0]}><sphereGeometry args={[0.02]} /><meshBasicMaterial color="#4ade80" /></mesh>}
                </group>
            </group>

            {/* --- KNIFE --- */}
            {heldItem !== 'TOOL_KNIFE' && (
                <group 
                    position={[0.4, 0.02, 0.2]} 
                    rotation={[0, 0.5, 0]}
                    onClick={(e) => { e.stopPropagation(); handleSupplyClick('TOOL_KNIFE', texts.cut_action); }}
                    onPointerOver={() => isAllowed('TOOL_KNIFE') && setHoveredPart('KNIFE')}
                    onPointerOut={() => setHoveredPart(null)}
                >
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[0.04, 0.02, 0.15]} />
                        <meshStandardMaterial color="#5d4037" />
                    </mesh>
                    <mesh position={[0, 0, -0.15]} castShadow>
                        <boxGeometry args={[0.02, 0.005, 0.2]} />
                        <meshStandardMaterial color="#cfd8dc" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {hoveredPart === 'KNIFE' && <mesh position={[0,0.1,0]}><sphereGeometry args={[0.02]} /><meshBasicMaterial color="#4ade80" /></mesh>}
                </group>
            )}

            {/* --- SANDWICH ASSEMBLY ON BOARD --- */}
            <group position={[0, 0.05, 0]} rotation={[0, 0.05, 0]}>
                {/* 1. Base Bread */}
                {(step !== 'EMPTY') && (
                    <mesh position={[0, 0.015, 0]}>
                        <boxGeometry args={step === 'BREAD_ON_BOARD' ? [0.2, 0.08, 0.15] : [0.18, 0.02, 0.18]} />
                        {/* Check if SERVED to show toasted color */}
                        {/* UPDATED: Match slice color (#cd853f) to loaf crust color */}
                        <meshStandardMaterial color={step === 'SERVED' ? "#e6a15c" : (step === 'BREAD_ON_BOARD' ? "#cd853f" : "#fff8e1")} />
                         {step !== 'BREAD_ON_BOARD' && (
                             <mesh position={[0, -0.011, 0]}>
                                <boxGeometry args={[0.19, 0.005, 0.19]} />
                                <meshStandardMaterial color={step === 'SERVED' ? "#e6a15c" : "#cd853f"} />
                             </mesh>
                         )}
                    </mesh>
                )}

                {/* 2. Cheese */}
                {(step === 'CHEESE_ADDED' || step === 'HAM_ADDED' || step === 'TOP_BREAD_ADDED' || step === 'TOP_CHEESE_ADDED' || step === 'FINISHED' || step === 'SERVED') && (
                    <mesh position={[0, 0.03, 0]}>
                        <boxGeometry args={[0.16, 0.01, 0.16]} />
                        <meshStandardMaterial color={step === 'SERVED' ? "#fdd835" : "#fff176"} />
                    </mesh>
                )}

                {/* 3. Ham */}
                {(step === 'HAM_ADDED' || step === 'TOP_BREAD_ADDED' || step === 'TOP_CHEESE_ADDED' || step === 'FINISHED' || step === 'SERVED') && (
                    <mesh position={[0, 0.04, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 0.01]} />
                        <meshStandardMaterial color="#f48fb1" />
                    </mesh>
                )}

                {/* 4. Top Bread */}
                {(step === 'TOP_BREAD_ADDED' || step === 'TOP_CHEESE_ADDED' || step === 'FINISHED' || step === 'SERVED') && (
                     <mesh position={[0, 0.055, 0]}>
                        <boxGeometry args={[0.18, 0.02, 0.18]} />
                        <meshStandardMaterial color={step === 'SERVED' ? "#e6a15c" : "#fff8e1"} />
                         <mesh position={[0, 0.011, 0]}>
                                <boxGeometry args={[0.19, 0.005, 0.19]} />
                                <meshStandardMaterial color="#cd853f" />
                        </mesh>
                    </mesh>
                )}

                {/* 5. Top Cheese (Croque Monsieur) */}
                {(step === 'TOP_CHEESE_ADDED' || step === 'FINISHED' || step === 'SERVED') && (
                    <mesh position={[0, 0.07, 0]}>
                        <boxGeometry args={[0.16, 0.01, 0.16]} />
                        <meshStandardMaterial 
                            color={step === 'SERVED' ? "#d2691e" : "#fff176"} 
                            roughness={step === 'SERVED' ? 0.8 : 0.4}
                        />
                    </mesh>
                )}

                {/* Click area to pick up finished */}
                {step === 'FINISHED' && (
                     <mesh position={[0,0.1,0]} onClick={handleBoardClick} onPointerOver={() => setHoveredPart('BOARD')} onPointerOut={() => setHoveredPart(null)}>
                         <sphereGeometry args={[0.05]} />
                         <meshBasicMaterial color="#4ade80" transparent opacity={0.3} />
                     </mesh>
                )}
            </group>
        </group>
    );
};

// --- MAIN ENVIRONMENT ---
const KitchenEnvironment = ({ 
    heldItem, 
    setHeldItem,
    ovenState, 
    setOvenState,
    step,
    setStep,
    setInstruction,
    onEat,
    texts
}: any) => {
    const { floorTexture, wallTexture } = useMemo(() => generateKitchenTextures(), []);

    // --- MEMORY OPTIMIZATION: DISPOSE TEXTURES ON UNMOUNT ---
    useEffect(() => {
        return () => {
             // Clean up GPU memory when leaving the kitchen
             floorTexture.dispose();
             wallTexture.dispose();
        }
    }, [floorTexture, wallTexture]);
    
    // COLORS
    const CABINET_COLOR = "#f5f5dc"; 
    const COUNTER_COLOR = "#aa7444"; 
    const FLOOR_COLOR = "#ffffff"; 
    const WALL_COLOR = "#ffffff"; 

    // Layout math
    const BACK_COUNTER_Z_START = -2;
    const BACK_COUNTER_Z_END = -0.9;
    const BACK_LEN = Math.abs(BACK_COUNTER_Z_END - BACK_COUNTER_Z_START);
    const BACK_Z_POS = (BACK_COUNTER_Z_START + BACK_COUNTER_Z_END) / 2;

    const FRONT_COUNTER_Z_START = -0.1;
    const FRONT_COUNTER_Z_END = 2; 
    const FRONT_LEN = Math.abs(FRONT_COUNTER_Z_END - FRONT_COUNTER_Z_START);
    const FRONT_Z_POS = (FRONT_COUNTER_Z_START + FRONT_COUNTER_Z_END) / 2;

    return (
        <group>
            {/* === COUNTERS === */}
            <group position={[-2.1, 0.0, BACK_Z_POS]}> 
                <mesh position={[0, 0.45, 0]} receiveShadow>
                    <boxGeometry args={[0.8, 0.9, BACK_LEN]} />
                    <meshStandardMaterial color={CABINET_COLOR} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.91, 0]} receiveShadow>
                     <boxGeometry args={[0.82, 0.04, BACK_LEN + 0.02]} />
                     <meshStandardMaterial color={COUNTER_COLOR} roughness={0.7} />
                </mesh>
            </group>
            <group position={[-2.1, 0.0, FRONT_Z_POS]}> 
                <mesh position={[0, 0.45, 0]} receiveShadow>
                    <boxGeometry args={[0.8, 0.9, FRONT_LEN]} />
                    <meshStandardMaterial color={CABINET_COLOR} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.91, 0]} receiveShadow>
                     <boxGeometry args={[0.82, 0.04, FRONT_LEN + 0.02]} />
                     <meshStandardMaterial color={COUNTER_COLOR} roughness={0.7} />
                </mesh>
            </group>
            <group position={[-0.2, 0.0, -1.6]}>
                 <mesh position={[0, 0.45, 0]} receiveShadow>
                    <boxGeometry args={[3.0, 0.9, 0.8]} /> 
                    <meshStandardMaterial color={CABINET_COLOR} roughness={0.6} />
                 </mesh>
                 <mesh position={[0, 0.91, 0]} receiveShadow>
                    <boxGeometry args={[3.02, 0.04, 0.82]} /> 
                    <meshStandardMaterial color={COUNTER_COLOR} roughness={0.7} />
                 </mesh>
            </group>

            {/* === ROOM === */}
            <mesh position={[-1, 0, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial map={floorTexture} color={FLOOR_COLOR} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2, -2]} receiveShadow>
                <planeGeometry args={[12, 5]} />
                <meshStandardMaterial map={wallTexture} color={WALL_COLOR} roughness={0.4} />
            </mesh>
             <mesh position={[-2.5, 2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
                <planeGeometry args={[12, 5]} />
                <meshStandardMaterial map={wallTexture} color={WALL_COLOR} roughness={0.4} />
            </mesh>

            {/* === OBJECTS === */}
            <InteractiveStove 
                heldItem={heldItem} 
                setHeldItem={setHeldItem}
                ovenState={ovenState}
                setOvenState={setOvenState}
                setInstruction={setInstruction}
                texts={texts}
            />
            
            <CornerProps />

            {/* === GAMEPLAY AREA === */}
            <Workstation 
                step={step} 
                setStep={setStep} 
                heldItem={heldItem}
                setHeldItem={setHeldItem}
                setInstruction={setInstruction}
                onEat={onEat}
                texts={texts}
            />
        </group>
    );
}

export const KitchenScene = ({ onExit, onWinStateChange, language }: { onExit: () => void; onWinStateChange?: (isWin: boolean) => void; language: Language }) => {
  const [viewIndex, setViewIndex] = useState(0); 
  const texts = KITCHEN_TEXTS[language] || KITCHEN_TEXTS['es'];
  
  // GAME STATE
  const [cookingStep, setCookingStep] = useState<CookingStep>('EMPTY');
  const [heldItem, setHeldItem] = useState<HeldItem>('NONE');
  const [ovenState, setOvenState] = useState<'IDLE'|'COOKING'|'DONE'>('IDLE');
  const [showWin, setShowWin] = useState(false);
  const [instruction, setInstruction] = useState(texts.intro);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Update instruction if language changes while idle
  useEffect(() => {
     if (cookingStep === 'EMPTY' && heldItem === 'NONE' && ovenState === 'IDLE') {
         setInstruction(texts.intro);
     }
  }, [language, texts, cookingStep, heldItem, ovenState]);

  const handleEat = () => {
      audioManager.play('eat'); // Eating sound
      // Stop eat sound after 2 seconds to keep it short
      setTimeout(() => {
          audioManager.stop('eat');
      }, 2000);

      audioManager.play('win');
      setConfettiTrigger(Date.now()); // Trigger particles
      setCookingStep('EMPTY'); // Clear board visually so we don't see sandwich behind modal
      setTimeout(() => {
          setShowWin(true);
          onWinStateChange?.(true); // Call prop to duck volume
      }, 500);
  };

  const handleRestart = () => {
      setShowWin(false);
      onWinStateChange?.(false); // Call prop to reset volume
      setCookingStep('EMPTY');
      setHeldItem('NONE');
      setOvenState('IDLE');
      setInstruction(texts.intro);
      setConfettiTrigger(0);
      setViewIndex(0);
  };

  return (
    <div className="w-full h-full relative bg-[#3e2723]"> 
      <Canvas shadows camera={{ position: [0, 1.45, -0.1], fov: 65 }}>
        {/* COZY LIGHTING SETUP - UPDATED */}
        
        {/* 1. Neutral Warm Ambient (Less Yellow) */}
        <ambientLight intensity={0.5} color="#fff8e1" /> 

        {/* 2. Light above Stove/Hood (Point Light hidden in hood) */}
        <pointLight 
            position={[-2.05, 1.9, -0.5]} 
            intensity={1.2} 
            color="#ffcc80" 
            distance={3}
            decay={2}
            castShadow
        />

        {/* 3. Light above Cutting Board (Workstation SpotLight) - BRIGHTER & CLOSER TO WALL */}
        <spotLight 
            position={[0, 2.5, -1.8]} // Moved closer to wall (was -1.4)
            target-position={[0, 0.9, -1.8]}
            angle={0.6} // Slightly wider
            penumbra={0.4} 
            intensity={2.5} // Brighter
            color="#fff3e0" 
            castShadow 
        />
        
        {/* Fill light kept low */}
        <pointLight position={[1, 1.5, 0]} intensity={0.3} color="#ffffff" distance={5} />

        <KitchenEnvironment 
            heldItem={heldItem}
            setHeldItem={setHeldItem}
            ovenState={ovenState}
            setOvenState={setOvenState}
            step={cookingStep}
            setStep={setCookingStep}
            setInstruction={setInstruction}
            onEat={handleEat}
            texts={texts}
        />
        
        <FirstPersonHand heldItem={heldItem} />
        <ConfettiParticles trigger={confettiTrigger} />
        
        <KitchenCamera viewIndex={viewIndex} />
      </Canvas>
      
      {/* --- INSTRUCTION BANNER (Dynamic Guide) --- */}
      {!showWin && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-[#fff8e1] px-8 py-4 rounded-full border-4 border-[#5d4037] shadow-xl transform rotate-1 flex items-center gap-3">
                  <span className="text-[#5d4037] font-black text-lg tracking-wide uppercase">{instruction}</span>
              </div>
          </div>
      )}

      {/* --- UI OVERLAYS --- */}
      
      {/* 2. WIN MODAL */}
      {showWin && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#fff8e1] p-10 rounded-[3rem] border-8 border-[#d7ccc8] text-center shadow-2xl max-w-md transform rotate-1">
                  {/* REMOVED EMOJI AS REQUESTED */}
                  <h2 className="text-3xl font-black text-[#5d4037] mb-2 leading-tight">{texts.win_title}</h2>
                  <p className="text-xl font-bold text-[#8d6e63] mb-8">{texts.win_desc}</p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleRestart}
                        className="px-8 py-3 bg-[#fff176] text-[#f57f17] font-black rounded-xl border-b-4 border-[#fbc02d] active:border-b-0 active:translate-y-1 transition-all"
                      >
                          {texts.replay}
                      </button>
                      <button 
                        onClick={onExit}
                        className="px-8 py-3 bg-[#b5ead7] text-[#4a7c68] font-black rounded-xl border-b-4 border-[#88bba6] active:border-b-0 active:translate-y-1 transition-all"
                      >
                          {texts.exit_roam}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. STANDARD UI (Exit, Arrows) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8">
          <div className="flex justify-between items-start pointer-events-auto">
             <button 
               onClick={onExit}
               className="bg-[#ffebee] hover:bg-white text-[#5d4037] font-black py-2 px-6 rounded-full shadow-lg border-4 border-[#5d4037] transition-transform hover:scale-105 flex items-center gap-2"
             >
                {texts.exit}
             </button>
          </div>

          {!showWin && (
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between pointer-events-auto px-4">
                {viewIndex === 0 ? (
                    <button 
                        onClick={() => setViewIndex(1)}
                        className={`w-16 h-16 bg-white/80 rounded-full border-4 border-[#5d4037] flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-xl ${heldItem === 'RAW_SANDWICH' ? 'animate-bounce bg-green-100' : ''}`}
                    >
                        <span className="text-4xl text-[#5d4037]">⬅️</span>
                    </button>
                ) : <div />}

                {viewIndex === 1 ? (
                    <button 
                        onClick={() => setViewIndex(0)}
                        className={`w-16 h-16 bg-white/80 rounded-full border-4 border-[#5d4037] flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-xl ${heldItem === 'NONE' && ovenState === 'IDLE' ? 'animate-bounce bg-green-100' : ''}`}
                    >
                        <span className="text-4xl text-[#5d4037]">➡️</span>
                    </button>
                ) : <div />}
              </div>
          )}
      </div>
    </div>
  );
};
