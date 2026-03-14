
import React, { useRef, useEffect, useMemo } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, Group } from 'three';
import { GROUP_SCENE, BASKET_POSITION } from '../constants';
import '../types';

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
      pos: new Vector3(0, 0.2, 0), // Start at basket top
      vel: new Vector3(
        (Math.random() - 0.5) * 2,   // Spread X
        Math.random() * 3 + 2,       // Upward force Y
        (Math.random() - 0.5) * 2    // Spread Z
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
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {colors.map((c, i) => (
        <mesh key={i} scale={[0, 0, 0]}>
          <planeGeometry args={[0.08, 0.04]} />
          <meshStandardMaterial color={c} side={2} emissive={c} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

export const CleaningBasket = ({ trigger = 0 }: { trigger?: number }) => {
  // Updated physics body to match the new basket shape roughly
  const [ref] = useBox(() => ({
    type: 'Static',
    args: [0.8, 0.6, 0.8],
    position: BASKET_POSITION, 
    collisionFilterGroup: GROUP_SCENE
  }), undefined, [BASKET_POSITION[0], BASKET_POSITION[1], BASKET_POSITION[2]]);

  return (
    <group position={BASKET_POSITION}>
       <group position={[0, -0.1, 0]}>
           {/* Basket Body */}
           <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.3, 0.6, 32]} />
              <meshStandardMaterial color="#e5e7eb" roughness={0.8} />
           </mesh>
           
           {/* Basket Rim */}
           <mesh position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.4, 0.04, 8, 32]} />
              <meshStandardMaterial color="#9ca3af" roughness={0.5} />
           </mesh>

           {/* Fake Dark Inside to simulate depth */}
           <mesh position={[0, 0.305, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <circleGeometry args={[0.35, 32]} />
             <meshBasicMaterial color="#374151" />
           </mesh>
       </group>
       
       {/* Particle Effect */}
       <ConfettiExplosion trigger={trigger} />
    </group>
  );
};
