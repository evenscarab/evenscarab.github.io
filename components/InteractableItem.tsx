
import React, { useEffect, useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler } from 'three';
import { ItemData } from '../types';
import { GROUP_ITEMS, GROUP_SCENE } from '../constants';

interface InteractableItemProps {
  data: ItemData;
  isHeld: boolean;
  isHovered: boolean;
}

export const InteractableItem: React.FC<InteractableItemProps> = ({ data, isHeld, isHovered }) => {
  const { camera } = useThree();
  
  // Physics body
  const [ref, api] = useBox(() => ({
    mass: data.weight,
    position: data.position,
    rotation: data.rotation,
    args: data.scale,
    linearDamping: 0.5,
    angularDamping: 0.5,
    collisionFilterGroup: GROUP_ITEMS,
    collisionFilterMask: GROUP_SCENE | GROUP_ITEMS,
    userData: { id: data.id, interactable: true },
    name: `item-${data.id}`
  }), undefined, [data.position[0], data.position[1], data.position[2], data.weight]);

  // Track smoothed rotation for inertia
  const currentQuat = useRef(new Quaternion());
  
  // CRITICAL FIX: Toggle Mass to 0 when held to stop physics fighting
  useEffect(() => {
    if (isHeld) {
      api.mass.set(0); // Become kinematic (weightless)
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      
      // Initialize rotation tracker to current camera rotation to prevent snapping
      currentQuat.current.copy(camera.quaternion);
    } else {
      api.mass.set(data.weight); // Restore weight to fall
      api.wakeUp();
    }
  }, [isHeld, data.weight, api, camera.quaternion]);

  useFrame((state, delta) => {
    if (isHeld && ref.current) {
      const t = state.clock.getElapsedTime();

      // 1. SWAY (Breathing/Idle animation)
      // Gentle bobbing up/down and left/right
      const swayX = Math.cos(t * 1.5) * 0.015;
      const swayY = Math.sin(t * 3.0) * 0.015;

      // 2. RIGHT HAND OFFSET
      // Position the item slightly to the right (0.35) and down (-0.3) 
      // relative to the camera view, at a distance of 1.0m
      const handOffset = new Vector3(0.35 + swayX, -0.3 + swayY, -1.0);
      
      // Transform local offset to world space based on camera rotation
      handOffset.applyQuaternion(camera.quaternion);
      
      // Calculate final target position
      const targetPos = camera.position.clone().add(handOffset);

      // Apply position immediately (Kinematic)
      api.position.set(targetPos.x, targetPos.y, targetPos.z);
      
      // 3. ROTATIONAL INERTIA (Weight feel)
      // Slerp current rotation towards camera rotation with a factor
      // Lower factor = more "lag/weight" (e.g., 10 * delta)
      const targetQuat = camera.quaternion.clone();
      currentQuat.current.slerp(targetQuat, 12 * delta);

      // Convert Quaternion to Euler for Cannon.js
      const euler = new Euler().setFromQuaternion(currentQuat.current);
      api.rotation.set(euler.x, euler.y, euler.z);
      
      // Zero out physics forces just in case
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }
  });

  const showHighlight = isHovered && !isHeld;

  // --- CONDITIONAL RENDERING BASED ON ITEM VARIANT ---
  const renderVisuals = () => {
    const { variant, scale, color } = data;
    const [x, y, z] = scale;

    switch (variant) {
      // --- CLOTHING (Crumpled piles) ---
      case 'shirt':
      case 'sock':
        return (
          <group>
            {/* Main Pile (Base) */}
            <mesh castShadow receiveShadow position={[0, -y*0.3, 0]} scale={[x*0.85, y*0.5, z*0.85]}>
              <icosahedronGeometry args={[1, 1]} /> 
              <meshStandardMaterial 
                color={color} 
                roughness={1} 
                emissive={showHighlight ? "#444444" : "#000000"} 
                emissiveIntensity={showHighlight ? 0.3 : 0}
              />
            </mesh>

            {/* Fold/Sleeve 1 */}
            <mesh castShadow receiveShadow position={[x*0.35, 0, z*0.2]} rotation={[0.5, 0.5, 0]} scale={[x*0.5, y*0.4, z*0.5]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial 
                color={color} 
                roughness={1}
                emissive={showHighlight ? "#444444" : "#000000"} 
                emissiveIntensity={showHighlight ? 0.3 : 0}
              />
            </mesh>

             {/* Fold/Sleeve 2 */}
             <mesh castShadow receiveShadow position={[-x*0.25, y*0.2, -z*0.2]} rotation={[-0.5, 2, 0.5]} scale={[x*0.6, y*0.4, z*0.6]}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial 
                color={color} 
                roughness={1}
                emissive={showHighlight ? "#444444" : "#000000"} 
                emissiveIntensity={showHighlight ? 0.3 : 0}
              />
            </mesh>
          </group>
        );

      // --- KITCHEN (Geometric, smooth shapes) ---
      case 'cup':
        return (
          <group>
             <mesh castShadow receiveShadow position={[0, -y/4, 0]}>
              <cylinderGeometry args={[x*0.8, x*0.6, y, 16]} />
              <meshStandardMaterial 
                color={color} 
                roughness={0.2} 
                emissive={showHighlight ? "#444444" : "#000000"} 
                emissiveIntensity={showHighlight ? 0.4 : 0}
              />
            </mesh>
            {/* Handle */}
            <mesh position={[x*0.6, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <torusGeometry args={[x*0.3, x*0.05, 8, 16, Math.PI]} />
                <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      
      case 'plate':
        return (
          <mesh castShadow receiveShadow>
             <cylinderGeometry args={[x, x*0.8, y, 16]} />
             <meshStandardMaterial 
                color={color} 
                roughness={0.3}
                emissive={showHighlight ? "#444444" : "#000000"} 
                emissiveIntensity={showHighlight ? 0.4 : 0}
             />
          </mesh>
        );

      case 'bottle':
        return (
          <group>
             {/* Body */}
             <mesh castShadow receiveShadow position={[0, -y/4, 0]}>
               <cylinderGeometry args={[x*0.8, x*0.8, y*0.7, 12]} />
               <meshStandardMaterial color={color} roughness={0.1} transparent opacity={0.8} />
             </mesh>
             {/* Neck */}
             <mesh castShadow position={[0, y/3, 0]}>
               <cylinderGeometry args={[x*0.3, x*0.3, y*0.3, 12]} />
               <meshStandardMaterial color="white" />
             </mesh>
          </group>
        );

      // --- TRASH ---
      case 'paper':
        return (
           <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[x, 0]} />
            <meshStandardMaterial 
              color={color} 
              roughness={1}
              flatShading
              emissive={showHighlight ? "#444444" : "#000000"} 
              emissiveIntensity={showHighlight ? 0.4 : 0}
            />
          </mesh>
        );

      case 'box':
        return (
           <mesh castShadow receiveShadow>
             <boxGeometry args={scale} />
             <meshStandardMaterial 
               color={color} 
               roughness={1}
               emissive={showHighlight ? "#444444" : "#000000"} 
               emissiveIntensity={showHighlight ? 0.4 : 0}
             />
             <mesh position={[0, y/2 + 0.001, 0]} rotation={[0, 0, 0]}>
                <planeGeometry args={[x, z*0.2]} />
                <meshBasicMaterial color="#d1d5db" />
             </mesh>
           </mesh>
        );

      default:
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={scale} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
    }
  };

  return (
    <group ref={ref as any} userData={{ interactable: true, id: data.id }}>
      {renderVisuals()}
    </group>
  );
};
