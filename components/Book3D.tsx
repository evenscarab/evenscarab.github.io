
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, useCursor, Text } from '@react-three/drei';
import { Vector3, MathUtils, Color, DoubleSide } from 'three';
import { audioManager } from '../utils/audio';

// --- CONSTANTS ---
const PAGE_WIDTH = 3.5;
const PAGE_HEIGHT = 5;
const PAGE_DEPTH = 0.02; // Thickness of paper
const COVER_DEPTH = 0.15;
const SPINE_WIDTH = 0.6;
const Z_GAP = 0.01; // Spacing between pages to prevent Z-fighting

interface SheetProps {
  index: number;
  frontContent: { img?: string; text?: string; pageNum: number };
  backContent: { img?: string; text?: string; pageNum: number };
  isOpen: boolean; // Is this sheet flipped to the left?
  onFlip: () => void;
  totalSheets: number;
}

const Sheet: React.FC<SheetProps> = ({ index, frontContent, backContent, isOpen, onFlip, totalSheets }) => {
  const group = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  useCursor(hovered);

  // Target Rotation: 0 = Right (Closed), -PI = Left (Open)
  // We add a tiny angle offset based on index to make them fan out slightly nicely
  const targetRotation = isOpen ? -Math.PI + 0.05 : 0;

  useFrame((state, delta) => {
    if (group.current) {
      // Smooth flip animation
      const rot = group.current.rotation.y;
      group.current.rotation.y = MathUtils.lerp(rot, targetRotation, delta * 5);
      
      // DYNAMIC Z-INDEXING (The Physics Fix)
      // When on Right (rot > -PI/2): Lower index is on TOP (Higher Z)
      // When on Left (rot < -PI/2): Higher index is on TOP (Higher Z)
      const isFlipped = group.current.rotation.y < -Math.PI / 2;
      
      let targetZ = 0;
      if (!isFlipped) {
        // Right Stack: 0 is top, N is bottom
        targetZ = (totalSheets - index) * Z_GAP;
      } else {
        // Left Stack: 0 is bottom, N is top
        targetZ = index * Z_GAP;
      }
      
      group.current.position.z = MathUtils.lerp(group.current.position.z, targetZ, delta * 10);
    }
  });

  return (
    <group 
      ref={group} 
      position={[0, 0, 0]} // Z is animated
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => { e.stopPropagation(); onFlip(); }}
    >
      {/* Pivot is at 0,0,0. We shift mesh to the right so it swings like a door. */}
      
      {/* THE PAPER MESH */}
      <mesh position={[PAGE_WIDTH / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH]} />
        <meshStandardMaterial color="#fffbf0" roughness={0.9} />
      </mesh>

      {/* FRONT CONTENT (Visible when on Right) */}
      <Html 
        transform 
        occlude="blending"
        position={[PAGE_WIDTH / 2, 0, PAGE_DEPTH / 2 + 0.01]} 
        style={{ width: '340px', height: '480px', pointerEvents: 'none' }}
      >
        <div className="w-full h-full flex flex-col items-center justify-start p-6 select-none bg-orange-50/10">
           {frontContent.img ? (
             <div className="bg-white p-2 shadow-sm transform rotate-1 mt-4">
               <img src={frontContent.img} alt="memory" className="w-full h-40 object-cover grayscale-[10%] sepia-[30%] contrast-110" />
             </div>
           ) : <div className="h-40"></div>}
           
           <div className="mt-6 font-serif text-[#5d4037] text-lg text-center leading-relaxed">
               {frontContent.text || ""}
           </div>
           
           <div className="absolute bottom-4 right-6 text-[#8d6e63] text-sm font-bold font-mono tracking-widest opacity-50">
             {frontContent.pageNum}
           </div>
        </div>
      </Html>

      {/* BACK CONTENT (Visible when on Left) */}
      <Html 
        transform 
        occlude="blending"
        position={[PAGE_WIDTH / 2, 0, -PAGE_DEPTH / 2 - 0.01]} 
        rotation={[0, Math.PI, 0]} // Flip text for back side
        style={{ width: '340px', height: '480px', pointerEvents: 'none' }}
      >
        <div className="w-full h-full flex flex-col items-center justify-start p-6 select-none bg-orange-50/10">
           {backContent.img ? (
             <div className="bg-white p-2 shadow-sm transform -rotate-1 mt-4">
               <img src={backContent.img} alt="memory" className="w-full h-40 object-cover grayscale-[10%] sepia-[30%] contrast-110" />
             </div>
           ) : <div className="h-40"></div>}
           
           <div className="mt-6 font-serif text-[#5d4037] text-lg text-center leading-relaxed">
               {backContent.text || ""}
           </div>
           
           <div className="absolute bottom-4 left-6 text-[#8d6e63] text-sm font-bold font-mono tracking-widest opacity-50">
             {backContent.pageNum}
           </div>
        </div>
      </Html>
    </group>
  );
};

export const Book3D = ({ pages, onClose }: { pages: any[], onClose: () => void }) => {
  // Logic: pages array contains raw content. We group them into sheets.
  // Sheet 0: Front=Page 0, Back=Page 1
  // Sheet 1: Front=Page 2, Back=Page 3
  
  const sheets = useMemo(() => {
    const s = [];
    for (let i = 0; i < pages.length; i += 2) {
      s.push({
        front: { ...pages[i], pageNum: i + 1 },
        back: pages[i+1] ? { ...pages[i+1], pageNum: i + 2 } : { text: "", pageNum: i + 2 }
      });
    }
    return s;
  }, [pages]);

  const [activeSheetIndex, setActiveSheetIndex] = useState(-1); // -1 means all closed (Cover visible)

  const handleFlip = (index: number) => {
    audioManager.play('pickup'); // Paper sound
    // If clicking a sheet that is open (index <= active), close it (set active to index - 1)
    // If clicking a sheet that is closed (index > active), open it (set active to index)
    if (index <= activeSheetIndex) {
      setActiveSheetIndex(index - 1);
    } else {
      setActiveSheetIndex(index);
    }
  };

  return (
    <group rotation={[0.4, 0, 0]} position={[0, -0.5, 0]}> {/* Tilt book to face camera */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        
        {/* LIGHTING FOR BOOK */}
        <pointLight position={[0, 5, 8]} intensity={1.5} color="#fff8e1" />
        <ambientLight intensity={0.5} />

        {/* --- BOOK STRUCTURE --- */}
        
        {/* BACK COVER (Static) */}
        <mesh position={[PAGE_WIDTH / 2, 0, -0.1]} receiveShadow>
           <boxGeometry args={[PAGE_WIDTH + 0.2, PAGE_HEIGHT + 0.2, COVER_DEPTH]} />
           <meshStandardMaterial color="#4e342e" roughness={0.6} />
        </mesh>

        {/* SPINE */}
        <mesh position={[-0.1, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.25, 0.25, PAGE_HEIGHT + 0.2, 32, 1, false, Math.PI/2, Math.PI]} />
           <meshStandardMaterial color="#3e2723" roughness={0.5} />
        </mesh>

        {/* SHEETS */}
        {sheets.map((sheet, i) => (
          <Sheet 
            key={i}
            index={i}
            frontContent={sheet.front}
            backContent={sheet.back}
            isOpen={i <= activeSheetIndex} // If index is less than or equal to active, it is flipped left
            onFlip={() => handleFlip(i)}
            totalSheets={sheets.length}
          />
        ))}

        {/* FRONT COVER (Dynamic) */}
        {/* We treat the front cover like a special sheet at index -1 */}
        <group 
          onClick={(e) => { e.stopPropagation(); handleFlip(-1); }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <CoverMesh isOpen={-1 <= activeSheetIndex} />
        </group>

        {/* CLOSE BUTTON */}
        <Html position={[6, 3, 0]} center>
          <button 
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-xl transform hover:scale-110 transition-all border-4 border-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </Html>

      </Float>
    </group>
  );
};

// Separate component for the Front Cover to handle its own animation
const CoverMesh = ({ isOpen }: { isOpen: boolean }) => {
    const group = useRef<any>(null);
    const targetRotation = isOpen ? -Math.PI * 0.95 : 0; // Don't open full 180, looks better

    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetRotation, delta * 4);
        }
    });

    return (
        <group ref={group} position={[0, 0, 0.05]}>
             <mesh position={[PAGE_WIDTH / 2, 0, 0]} castShadow>
                <boxGeometry args={[PAGE_WIDTH + 0.2, PAGE_HEIGHT + 0.2, COVER_DEPTH]} />
                <meshStandardMaterial color="#5d4037" roughness={0.5} />
            </mesh>
            
            {/* GOLD TEXT & DECORATION */}
            {!isOpen && (
                <group position={[PAGE_WIDTH / 2, 0, COVER_DEPTH / 2 + 0.01]}>
                    <Text 
                        position={[0, 1.2, 0]} 
                        fontSize={0.5} 
                        font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk6.woff" // Elegant serif font
                        color="#ffecb3"
                        anchorX="center" 
                        anchorY="middle"
                    >
                        DIARIO
                    </Text>
                     <Text 
                        position={[0, 0.5, 0]} 
                        fontSize={0.25} 
                        font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk6.woff"
                        color="#ffecb3"
                        anchorX="center" 
                        anchorY="middle"
                    >
                        DE
                    </Text>
                    <Text 
                        position={[0, -0.2, 0]} 
                        fontSize={0.8} 
                        font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk6.woff"
                        color="#ffecb3"
                        anchorX="center" 
                        anchorY="middle"
                    >
                        CECI
                    </Text>
                    
                    {/* Golden Border */}
                    <mesh position={[0, 0, 0]}>
                        <ringGeometry args={[1.5, 1.55, 32]} />
                        <meshStandardMaterial color="#ffecb3" emissive="#ffc107" emissiveIntensity={0.2} />
                    </mesh>
                </group>
            )}
        </group>
    )
}
