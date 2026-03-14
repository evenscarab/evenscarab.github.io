
/// <reference lib="dom" />
import React, { useState, useEffect, Suspense, useRef } from 'react';
// REMOVED STATIC IMPORTS to enable Lazy Loading
// import { GameScene } from './components/GameScene';
// import { KitchenScene } from './components/KitchenScene'; 
import { GameState, ItemData, Language } from './types';
import { LEVELS } from './constants';
import { audioManager } from './utils/audio';
import { MobileControls } from './components/MobileControls';
import { Loader } from '@react-three/drei';

// --- LAZY LOADING SCENES ---
// This ensures that the heavy 3D code for a scene is only loaded when needed,
// and helps the browser Garbage Collect the previous scene more effectively.
const GameScene = React.lazy(() => import('./components/GameScene').then(module => ({ default: module.GameScene })));
const KitchenScene = React.lazy(() => import('./components/KitchenScene').then(module => ({ default: module.KitchenScene })));

// --- CONFIGURACIÓN DEL DIARIO (EDITA AQUÍ TUS FOTOS Y TEXTOS) ---
// 1. Guarda tus fotos en la carpeta 'public/images/'
// 2. Cambia la propiedad 'img' por: "/images/nombre_de_tu_foto.jpg"
const BOOK_PAGES = [
  { 
    text: "Bonjour… me llamo Ceci. Llegué a Chile de intercambio y, mon Dieu, Juan me cae un poquito mal… pero solo un poquito. Soy bien petit y medio feíto, pero avec beaucoup de charme, ¿oui?",
    img: "/images/foto1.jpg",
    date: "12 de Enero"
  },
  { 
    text: "Salut, estoy con Juan y fuimos a ver Perfect Blue. No entendí nada, je suis trop bête a veces… pero al menos intento ordenar mi pieza, aunque me queda très difícil.",
    img: "/images/foto2.jpg",
    date: "14 de Febrero"
  },
  { 
    text: "Coucou, soy básicamente un pequeño desastre francés. Mi pieza está un poco… comment dire… catastrophique. Nunca la ordeno y no tengo tiempo de rien. Pero bueno, tengo que ir a robar chocolates al Líder, comme un petit voleur.",
    img: "/images/foto3.jpg",
    date: "20 de Marzo"
  },
  { 
    text: "Bonsooooir, estoy comiendo shawarma después de haber salido a la disco. Soy un loquito très adorable. Y, eh… le robé el polerón a Juan, porque soy un diablotin francés con mucho estilo.",
    img: "/images/foto4.jpg",
    date: "05 de Abril"
  },
  { 
  text: `Hoy fui a la Chismoteka y, honestamente, no sé en qué momento me puse tan zorrita. Yo feliz igual. Uno tiene que quererse, aunque me pasé medio rato intentando quitarle la camiseta a Juan como si fuera degenerado jsjsjsj. De pronto aparecen los amigos de Juan. Y yo ahí, con las piernas al aire, zero shame, bonjour mis niños, siendo la criatura que soy. No me arrepiento. Ni un poquito. Buen día. Poca ropa. Mucho descaro. C’est la vie.`,
  img: "/images/foto5.jpg",
  date: "01 de Noviembre"
},
{ 
  text: `Hoy amanecí en la playa del sur y hace un frío que parece que la naturaleza me odia personalmente (como los perros). Pero yo con mi chaqueta del Persa Bio-Bío, preciosa, digna, casi más abrigadora que mis decisiones de vida, mon dieu. Estoy feliz. Juan no está aquí. Bendición. Milagro. Aleluya versión playera. Me puse a caminar por la arena como si fuera protagonista. Pensé: “Qué rico estar sin Juan. Qué rico respirar. Qué rico que la Clelia sabe mucho”. Buen día. Buena chaqueta. Mejor ausencia.`,
  img: "/images/foto6.jpg",
  date: "28 de noviembre"
}
];

// --- TRANSLATIONS CONFIGURATION ---
const TRANSLATIONS = {
  es: {
    bubble: "LIMPIA LA",
    main_title: "PIEZA",
    subtitle: "DE CECI",
    intro: "¡La pieza es un desastre! \nAyuda a recoger la ropa y la basura antes de que se acabe el tiempo.",
    start_btn: "¡A LIMPIAR!",
    story_continue_btn: "CONTINUAR",
    tap_to_play_title: "TOCA PARA JUGAR",
    tap_to_play_desc: "Mouse para Mirar • WASD para Moverse",
    tap_to_play_desc_mobile: "Usa los controles táctiles para moverte y jugar",
    controls_hint: "WASD Mover • Click Agarrar",
    controls_hint_basket: " • Cesta Gris",
    controls_hint_closet: " • Guardar en Closet",
    hud_sec: "Seg",
    hud_cleaned: "Limpiado",
    hud_basket_label: "Cesta Gris",
    win_title: "¡NIVEL COMPLETADO!",
    win_game_title: "¡JUEGO COMPLETADO!",
    lose_title: "¡SE ACABÓ!",
    score_label: "Tu Puntuación",
    retry_win: "Siguiente Nivel",
    retry_game_win: "Jugar de Nuevo",
    retry_lose: "Intentar de Nuevo",
    music_on: "Música: ON",
    music_off: "Música: OFF",
    pause_title: "PAUSA",
    pause_resume: "Reanudar",
    pause_restart: "Reiniciar Nivel",
    pause_levels: "Niveles",
    pause_menu: "Volver al Menú",
    pause_roam: "Ir a Pasear", 
    level_select_title: "SELECCIONAR NIVEL",
    back: "Volver",
    roam_btn: "PASEAR",
    roam_title: "ELIGE EL MOMENTO",
    roam_day: "Día",
    roam_sunset: "Atardecer",
    roam_night: "Noche",
    book_title: "Diario de Ceci",
    book_close: "Cerrar Diario",
    book_prev: "Anterior",
    book_next: "Siguiente",
    radio_title: "RADIO CECI",
    radio_playing: "REPRODUCIENDO",
    radio_stop: "DETENER",
    audio_warning: "⚠️ TOCA LA PANTALLA PARA ACTIVAR SONIDO",
    // COOKING PROMPTS
    cooking_prompt_title: "¿TIENES HAMBRE?",
    cooking_prompt_yes: "¡SÍ, VAMOS!",
    cooking_prompt_no: "AHORA NO",
    cooking_loading: "PREPARANDO LA COCINA...",
    // STORIES
    title_l1: "Nivel 1",
    story_l1: "¡La pieza es un desastre! \nAyuda a recoger la ropa y la basura antes de que se acabe el tiempo.",
    title_l2: "Nivel 2",
    story_l2: "¡Oh no! Juan vino a la casa y Ceci dejó lleno de papeles con leche toda la pieza... \n\n¡Ayúdalo para que se vaya a dormir rápido!",
    title_l3: "Nivel 3",
    story_l3: "Oh, está atardeciendo... Tienes que ayudar a Ceci a ordenar su ropa porque se va a ir de viaje al sur, y va a dejar a Juan solo, muy solo.\n\nGuarda la ropa dentro de los closets (ábrelos primero)."
  },
  fr: {
    bubble: "NETTOIE LA",
    main_title: "PIÈCE",
    subtitle: "DE CÉCI",
    intro: "La chambre est en désordre ! \nAidez à ramasser les vêtements et les ordures avant la fin du temps imparti.",
    start_btn: "NETTOYER !",
    story_continue_btn: "CONTINUER",
    tap_to_play_title: "CLIQUER POUR JOUER",
    tap_to_play_desc: "Souris pour Regarder • WASD pour Bouger",
    tap_to_play_desc_mobile: "Utilisez les commandes tactiles",
    controls_hint: "WASD Bouger • Clic Prendre",
    controls_hint_basket: " • Panier Gris",
    controls_hint_closet: " • Mettre au Placard",
    hud_sec: "Sec",
    hud_cleaned: "Nettoyé",
    hud_basket_label: "Panier Gris",
    win_title: "NIVEAU TERMINÉ !",
    win_game_title: "JEU TERMINÉ !",
    lose_title: "TEMPS ÉCOULÉ !",
    score_label: "Ton Score",
    retry_win: "Niveau Suivant",
    retry_game_win: "Rejouer",
    retry_lose: "Réessayer",
    music_on: "Musique: ON",
    music_off: "Musique: OFF",
    pause_title: "PAUSE",
    pause_resume: "Reprendre",
    pause_restart: "Recommencer",
    pause_levels: "Niveaux",
    pause_menu: "Menu Principal",
    pause_roam: "Se Promener",
    level_select_title: "SÉLECTIONNER NIVEAU",
    back: "Retour",
    roam_btn: "PROMENER",
    roam_title: "CHOISIR LE MOMENT",
    roam_day: "Jour",
    roam_sunset: "Coucher du soleil",
    roam_night: "Nuit",
    book_title: "Journal de Céci",
    book_close: "Fermer",
    book_prev: "Précédent",
    book_next: "Suivant",
    radio_title: "RADIO CÉCI",
    radio_playing: "LECTURE",
    radio_stop: "ARRÊTER",
    audio_warning: "⚠️ TOUCHEZ L'ÉCRAN POUR ACTIVER LE SON",
    // COOKING PROMPTS
    cooking_prompt_title: "TU AS FAIM ?",
    cooking_prompt_yes: "OUI, ALLONS-Y !",
    cooking_prompt_no: "PAS MAINTENANT",
    cooking_loading: "PRÉPARATION DE LA CUISINE...",
    // STORIES
    title_l1: "Niveau 1",
    story_l1: "La chambre est en désordre ! \nAidez à ramasser les vêtements et les ordures avant la fin du temps imparti.",
    title_l2: "Niveau 2",
    story_l2: "Oh non ! Juan est venu à la maison et Céci a laissé des papiers et du lait partout dans la chambre... \n\nAidez-le pour qu'il puisse aller dormir vite !",
    title_l3: "Niveau 3",
    story_l3: "Oh, le soleil se couche... Vous devez aider Céci à ranger ses vêtements car elle part en voyage dans le sud, et elle va laisser Juan tout seul.\n\nRanger les vêtements dans les placards."
  }
};

// --- CONFIGURACIÓN DE LA RADIO (EDITA AQUÍ TUS CANCIONES) ---
// 1. Pon tus mp3 en: public/sounds/radio/
// 2. Pon tus portadas jpg/png en: public/images/radio/
const RADIO_TRACKS = {
    track1: { 
        id: "track1",
        title: "la liberté guidant le peuple", // <--- EDITA EL TÍTULO
        artist: "Clelia y Ceci",    // <--- EDITA EL ARTISTA
        icon: "",                   // Icono decorativo
        src: "/sounds/radio/ceci_podcast_sound.mp3", // Nombre de tu archivo de audio
        cover: "/images/radio/ceci_podcast_image.png", // Nombre de tu archivo de imagen
        colorFrom: "from-sky-300",    // Color de fondo 1
        colorTo: "to-blue-600"        // Color de fondo 2
    },
    track2: { 
        id: "track2",
        title: "Ce qu’on devient",
        artist: "Feu! Chatterton", 
        icon: "", 
        src: "/sounds/radio/Ce quon devient.mp3",
        cover: "/images/radio/FeuCover.png",
        colorFrom: "from-orange-300", 
        colorTo: "to-pink-600"
    },
    track3: { 
        id: "track3",
        title: "MON BÉBÉ", 
        artist: "Theodora", 
        icon: "", 
        src: "/sounds/radio/MON BÉBÉ.mp3",
        cover: "/images/radio/TheodoraCover.png",
        colorFrom: "from-indigo-400", 
        colorTo: "to-purple-900"
    },
        track4: { 
        id: "track4",
        title: "L'Alcazar", 
        artist: "Feu! Chatterton", 
        icon: "", 
        src: "/sounds/radio/LAlcazar.mp3",
        cover: "/images/radio/FeuCover.png",
        colorFrom: "from-indigo-400", 
        colorTo: "to-purple-900"
    },
        track6: { 
        id: "track6",
        title: "Motherboard", 
        artist: "Daft Punk", 
        icon: "", 
        src: "/sounds/radio/Daft Punk - Motherboard.mp3",
        cover: "/images/radio/DaftPunk.png",
        colorFrom: "from-indigo-400", 
        colorTo: "to-purple-900"
    },
        track5: { 
        id: "track5",
        title: "It's Personal", 
        artist: "The Radio Dept", 
        icon: "", 
        src: "/sounds/radio/It's Personal.mp3",
        cover: "/images/radio/The_radio_Dept.png",
        colorFrom: "from-indigo-400", 
        colorTo: "to-purple-900"
    }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isMobile, setIsMobile] = useState(false);
  const [isGamepadConnected, setIsGamepadConnected] = useState(false);
  const [vmin, setVmin] = useState(Math.min(window.innerWidth, window.innerHeight));

  useEffect(() => {
    const handleResize = () => setVmin(Math.min(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const proportionalScale = vmin / 1000;
  
  // Track state before pausing
  const pausedStateRef = useRef<GameState>(GameState.PLAYING);

  // LEVEL STATE
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentLevel = LEVELS[currentLevelIdx];
  
  const [items, setItems] = useState<ItemData[]>(currentLevel.items);
  // Score derived from items state
  const score = items.filter(i => i.isCleaned).length;
  
  const [timeLeft, setTimeLeft] = useState(currentLevel.timeLimit);
  
  // isLocked is now managed by checking document.pointerLockElement
  const [isLocked, setIsLocked] = useState(false);
  const [showStartHint, setShowStartHint] = useState(false); 
  const [language, setLanguage] = useState<Language>('es');
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // Free Roam State
  const [freeRoamTime, setFreeRoamTime] = useState<'day' | 'night' | 'sunset'>('day');
  const [showRoamSelect, setShowRoamSelect] = useState(false);
  
  // Interactive Drawer/Book/Radio/Cooking State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [showCookingPrompt, setShowCookingPrompt] = useState(false); // Modal for "Are you hungry?"
  const [isLoadingCooking, setIsLoadingCooking] = useState(false); // Loading screen state
  const [isKitchenWin, setIsKitchenWin] = useState(false); // New state to duck volume on kitchen win
  const [isExitingKitchen, setIsExitingKitchen] = useState(false); // New state for sequential transition on exit
  
  // Radio Track Override (Key of RADIO_TRACKS or null)
  const [radioTrackKey, setRadioTrackKey] = useState<string | null>(null);

  const [bookPageIndex, setBookPageIndex] = useState(0); 
  const [isFlipping, setIsFlipping] = useState(false); 

  // Gamepad Menu Navigation State
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const lastInputTimeRef = useRef(0);
  const prevGamepadStartRef = useRef(false);
  
  // Audio Warmup State
  const [hasInteracted, setHasInteracted] = useState(false);

  // AUDIO REFS
  const dayAudioRef = useRef<HTMLAudioElement>(null);
  const nightAudioRef = useRef<HTMLAudioElement>(null);
  const sunsetAudioRef = useRef<HTMLAudioElement>(null);
  const kitchenAudioRef = useRef<HTMLAudioElement>(null); // NEW: Kitchen Music Ref
  const radioPlayerRef = useRef<HTMLAudioElement>(null); // NEW: Dedicated Radio Player

  // MOBILE CONTROL REFS
  const moveJoystickRef = useRef({ x: 0, y: 0 });
  const lookJoystickRef = useRef({ x: 0, y: 0 });
  const [interactTrigger, setInteractTrigger] = useState(false);

  // FLAG TO PREVENT AUTO-PAUSE ON WIN/LOSE
  const isGameEndingRef = useRef(false);
  
  // Helper type for dynamic key access
  const t = TRANSLATIONS[language] as any;
  const totalItems = currentLevel.items.length;

  // --- INTERACTION LISTENER FOR AUDIO UNLOCK ---
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        console.log("Global Interaction Detected - Unlocking Audio");
        
        // 1. Unlock SFX Manager (Plays all small sounds silently)
        audioManager.unlock();
        
        // 2. Unlock BGM & Radio Elements Explicitly
        // This is crucial for iOS Safari. We must call .play() on the specific elements
        // that will be used later, even if we pause them immediately.
        const audioElements = [
            dayAudioRef.current, 
            nightAudioRef.current, 
            sunsetAudioRef.current,
            kitchenAudioRef.current,
            radioPlayerRef.current
        ];

        audioElements.forEach(el => {
            if (el) {
                // Play and immediately pause to "bless" the element
                el.volume = 0; // Mute to avoid glitch
                el.play().then(() => {
                   // FIX: Pause EVERYTHING immediately. 
                   // The main loop will determine what should play based on gameState.
                   // This prevents "day audio" from getting stuck playing on mobile.
                   el.pause(); 
                }).catch(e => {
                    // console.warn("Warmup failed for element", e);
                });
            }
        });

        setHasInteracted(true);
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
  }, [hasInteracted]);

  // --- RESET NAVIGATION INDEX ON STATE CHANGE ---
  useEffect(() => {
    setSelectedMenuIndex(0);
  }, [gameState, isBookOpen, isRadioOpen, isDrawerOpen, showRoamSelect, showCookingPrompt]);

  // --- AUTO-SCROLL RADIO LIST WHEN NAVIGATING ---
  useEffect(() => {
    if (isRadioOpen) {
      const elementId = `radio-item-${selectedMenuIndex}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedMenuIndex, isRadioOpen]);

  // --- DETECT MOBILE ---
  useEffect(() => {
    const checkMobile = () => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        // iPad often reports as MacIntel but has touch points > 1
        const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

        if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) || isTouch || isIPad) {
            setIsMobile(true);
        }
    };
    checkMobile();
  }, []);
  
  // --- DEFINE MENU ACTIONS FOR PAUSE MENU ---
  const pauseMenuActions = [
    { label: t.pause_resume, action: () => handleResume() },
    { label: t.pause_restart, action: () => handleRestartLevel() },
    { label: t.pause_roam, action: () => handleGoToRoamFromPause() },
    { label: t.pause_levels, action: (e?: any) => handleGoToLevelSelect(e || { stopPropagation: () => {} }) },
    { label: t.pause_menu, action: () => handleReturnToMenu() }
  ];

  // --- GAMEPAD CONNECTION & NAV LOGIC ---
  useEffect(() => {
    const handleConnect = () => setIsGamepadConnected(true);
    const handleDisconnect = () => setIsGamepadConnected(false);
    
    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);
    
    // Polling for Gamepad Inputs
    let animationFrameId: number;
    
    const checkGamepadInput = () => {
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gp = gamepads[0];
        const now = Date.now();
        
        // --- 1. START/PAUSE TOGGLE ---
        const startBtn = gp.buttons[9]?.pressed || gp.buttons[11]?.pressed; // Check 11 too just in case
        
        if (startBtn && !prevGamepadStartRef.current) {
          // Toggle Pause
          if (gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) {
              if (isBookOpen) { setIsBookOpen(false); }
              else if (isDrawerOpen) { setIsDrawerOpen(false); }
              else if (isRadioOpen) { setIsRadioOpen(false); }
              else if (showCookingPrompt) { setShowCookingPrompt(false); }
              else {
                pausedStateRef.current = gameState;
                setGameState(GameState.PAUSED);
                audioManager.play('click');
              }
          } else if (gameState === GameState.PAUSED) {
              setGameState(pausedStateRef.current || GameState.PLAYING);
              audioManager.play('click');
          } else if (gameState === GameState.LEVEL_SELECT) {
              setGameState(GameState.PAUSED);
              audioManager.play('click');
          }
        }
        prevGamepadStartRef.current = startBtn;

        // --- 2. UNIVERSAL UI NAVIGATION ---
        // Determine if we are in a menu/ui state
        const isMenu = gameState === GameState.MENU;
        const isPaused = gameState === GameState.PAUSED;
        const isLevelSelect = gameState === GameState.LEVEL_SELECT;
        const isWonLost = gameState === GameState.WON || gameState === GameState.LOST;
        const isStory = gameState === GameState.STORY;
        const isUIOpen = isBookOpen || isRadioOpen || isDrawerOpen || showCookingPrompt;

        if (isMenu || isPaused || isLevelSelect || isWonLost || isStory || isUIOpen) {
            // Debounce navigation inputs (180ms)
            if (now - lastInputTimeRef.current > 180) {
                // Directional Input (Stick or D-Pad)
                const axisY = gp.axes[1]; // Left Stick Y
                const axisX = gp.axes[0]; // Left Stick X
                const dPadUp = gp.buttons[12]?.pressed;
                const dPadDown = gp.buttons[13]?.pressed;
                const dPadLeft = gp.buttons[14]?.pressed;
                const dPadRight = gp.buttons[15]?.pressed;

                const moveUp = axisY < -0.5 || dPadUp;
                const moveDown = axisY > 0.5 || dPadDown;
                const moveLeft = axisX < -0.5 || dPadLeft;
                const moveRight = axisX > 0.5 || dPadRight;

                // Determine maximum items based on context
                let maxItems = 0;
                let gridWidth = 1; // For 2D grids like Level Select

                if (isMenu) {
                    if (!showRoamSelect) maxItems = 5; // Start, Roam, ES, FR, Music
                    else maxItems = 4; // Day, Sunset, Night, Back
                } else if (isPaused) {
                    maxItems = pauseMenuActions.length;
                } else if (isLevelSelect) {
                    maxItems = LEVELS.length + 1; // Levels + Back button
                    gridWidth = 3;
                } else if (isWonLost) {
                    maxItems = 1; // Retry button
                } else if (isStory) {
                    maxItems = 1; // Continue button
                } else if (isBookOpen) {
                    maxItems = 3; // Prev, Next, Close
                } else if (isRadioOpen) {
                    // Tracks + Stop + Close
                    maxItems = Object.keys(RADIO_TRACKS).length + 2; 
                } else if (isDrawerOpen) {
                    maxItems = 2; // Book, Close
                } else if (showCookingPrompt) {
                    maxItems = 2; // Yes, No
                }

                if (moveUp || moveDown || moveLeft || moveRight) {
                     // Generic navigation
                     let nextIndex = selectedMenuIndex;
                     
                     if (moveUp) nextIndex -= gridWidth;
                     else if (moveDown) nextIndex += gridWidth;
                     else if (moveLeft) nextIndex -= 1;
                     else if (moveRight) nextIndex += 1;

                     // Wrap around or clamp
                     if (nextIndex < 0) nextIndex = maxItems - 1;
                     if (nextIndex >= maxItems) nextIndex = 0;

                     setSelectedMenuIndex(nextIndex);
                     audioManager.play('click');
                     lastInputTimeRef.current = now;
                }
                
                // SELECTION (A Button / Cross / Button 0)
                if (gp.buttons[0]?.pressed) {
                    // Execute Action based on Context and Index
                    executeMenuAction(selectedMenuIndex, isMenu, isPaused, isLevelSelect, isWonLost, isStory, isBookOpen, isRadioOpen, isDrawerOpen, showCookingPrompt);
                    lastInputTimeRef.current = now + 250; // Extra debounce for action
                }
                
                // B BUTTON (Back/Close) - Optional convenience
                if (gp.buttons[1]?.pressed) {
                     if (isBookOpen) setIsBookOpen(false);
                     else if (isRadioOpen) setIsRadioOpen(false);
                     else if (isDrawerOpen) setIsDrawerOpen(false);
                     else if (showRoamSelect) setShowRoamSelect(false);
                     else if (showCookingPrompt) setShowCookingPrompt(false);
                     else if (isLevelSelect) handleBackToPause();
                     lastInputTimeRef.current = now + 250;
                }
            }
        }
      }
      animationFrameId = requestAnimationFrame(checkGamepadInput);
    };
    
    checkGamepadInput();
    
    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, isBookOpen, isDrawerOpen, isRadioOpen, selectedMenuIndex, showRoamSelect, showCookingPrompt]);

  // --- HELPER: EXECUTE ACTION BASED ON INDEX ---
  const executeMenuAction = (index: number, isMenu: boolean, isPaused: boolean, isLevelSelect: boolean, isWonLost: boolean, isStory: boolean, isBookOpen: boolean, isRadioOpen: boolean, isDrawerOpen: boolean, isCookingPrompt: boolean) => {
      if (isCookingPrompt) {
          if (index === 0) handleStartCooking(); // YES
          else setShowCookingPrompt(false); // NO
          return;
      }

      if (isBookOpen) {
          if (index === 0) handleBookPrev();
          else if (index === 1) handleBookNext();
          else if (index === 2) setIsBookOpen(false);
          return;
      }

      if (isRadioOpen) {
          const trackKeys = Object.keys(RADIO_TRACKS);
          if (index < trackKeys.length) {
              handlePlayTrack(trackKeys[index]);
          } else if (index === trackKeys.length) {
              handlePlayTrack(null); // Stop
          } else {
              setIsRadioOpen(false); // Close
          }
          return;
      }

      if (isDrawerOpen) {
          if (index === 0) handleOpenBook();
          else setIsDrawerOpen(false);
          return;
      }

      if (isWonLost) {
          handleLevelCompleteOrRetry();
          return;
      }
      
      if (isStory) {
          startLevel();
          return;
      }

      if (isLevelSelect) {
          if (index < LEVELS.length) {
              // Hacky way to simulate the event
              handleSelectLevel({ stopPropagation: () => {} } as any, index);
          } else {
              handleBackToPause();
          }
          return;
      }

      if (isPaused) {
          if (pauseMenuActions[index]) pauseMenuActions[index].action();
          return;
      }

      if (isMenu) {
          if (showRoamSelect) {
              if (index === 0) startFreeRoam('day');
              else if (index === 1) startFreeRoam('sunset');
              else if (index === 2) startFreeRoam('night');
              else setShowRoamSelect(false);
          } else {
              if (index === 0) startToStory();
              else if (index === 1) { audioManager.play('click'); setShowRoamSelect(true); }
              else if (index === 2) setLanguageAndClick('es');
              else if (index === 3) setLanguageAndClick('fr');
              else if (index === 4) toggleMusic();
          }
          return;
      }
  };

  // --- HELPER: GET CLASS FOR SELECTED ITEM ---
  const getFocusClass = (index: number) => {
      return (isGamepadConnected && selectedMenuIndex === index) ? "ring-4 ring-blue-400 scale-105 transition-transform" : "";
  };


  // --- EFFECTIVE TIME OF DAY LOGIC ---
  const isRoamingState = gameState === GameState.FREE_ROAM || 
                        (gameState === GameState.PAUSED && pausedStateRef.current === GameState.FREE_ROAM) ||
                        (gameState === GameState.LEVEL_SELECT && pausedStateRef.current === GameState.FREE_ROAM);

  const effectiveTimeOfDay = isRoamingState ? freeRoamTime : LEVELS[currentLevelIdx].timeOfDay;


  // --- CURSOR LOGIC REFACTOR ---
  const shouldCaptureCursor = 
    (gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) && // Must be in active game mode
    !isBookOpen && // Book must be closed
    !isDrawerOpen && // Drawer must be closed
    !isRadioOpen && // Radio must be closed
    !showCookingPrompt && // Prompt must be closed
    !showStartHint; // Not showing "Tap to Play" overlay

  useEffect(() => {
    if (!shouldCaptureCursor) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      setIsLocked(false);
    }
  }, [shouldCaptureCursor]);

  // Handle Pointer Lock Events from Browser
  useEffect(() => {
    const handleLockChange = () => {
      const isNowLocked = !!document.pointerLockElement;
      setIsLocked(isNowLocked);

      if (isNowLocked) {
        setShowStartHint(false);
      } else {
        // Only pause on unlock if we are NOT on mobile AND NOT using a gamepad.
        // Mobile doesn't use pointer lock, so this would pause the game constantly.
        // Gamepad users also don't use pointer lock, so we shouldn't pause if they click out.
        if (shouldCaptureCursor && !isGameEndingRef.current && !isMobile && !isGamepadConnected) {
           pausedStateRef.current = gameState;
           setGameState(GameState.PAUSED);
           setSelectedMenuIndex(0); // Reset selection
        }
      }
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [shouldCaptureCursor, gameState, isMobile, isGamepadConnected]);


  // PAUSE LISTENER (ESC Key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        // If playing or roaming
        if (gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) {
          // Close UI overlays if open
          if (isBookOpen) { setIsBookOpen(false); return; }
          if (isDrawerOpen) { setIsDrawerOpen(false); return; }
          if (isRadioOpen) { setIsRadioOpen(false); return; }
          if (showCookingPrompt) { setShowCookingPrompt(false); return; }

          // Otherwise, pause game
          pausedStateRef.current = gameState;
          setGameState(GameState.PAUSED);
          setSelectedMenuIndex(0);
        } else if (gameState === GameState.PAUSED || gameState === GameState.LEVEL_SELECT) {
          if (gameState === GameState.LEVEL_SELECT) {
             setGameState(GameState.PAUSED);
          } else {
             setGameState(pausedStateRef.current || GameState.PLAYING);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isBookOpen, isDrawerOpen, isRadioOpen, showCookingPrompt]);

  // --- AUDIO LOGIC (UPDATED FOR SMOOTH TRANSITIONS & KITCHEN DUCKING) ---
  useEffect(() => {
    const dayAudio = dayAudioRef.current;
    const nightAudio = nightAudioRef.current;
    const sunsetAudio = sunsetAudioRef.current;
    const kitchenAudio = kitchenAudioRef.current;
    const radioPlayer = radioPlayerRef.current;

    if (!dayAudio || !nightAudio || !sunsetAudio || !radioPlayer || !kitchenAudio) return;

    // 1. Determine what SHOULD be playing (Target)
    let targetAudio: HTMLAudioElement | null = null;

    if (isLoadingCooking || isExitingKitchen) {
        // During loading screen OR exiting kitchen, user wants background music volume to drop to silence
        targetAudio = null;
    } else if (gameState === GameState.COOKING) {
        // Play Kitchen Music
        targetAudio = kitchenAudio;
    } else if (radioTrackKey && RADIO_TRACKS[radioTrackKey as keyof typeof RADIO_TRACKS]) {
        // If a radio track is selected, play the radio player
        targetAudio = radioPlayer;
    } else {
        // Otherwise play ambient based on time
        if (effectiveTimeOfDay === 'night') targetAudio = nightAudio;
        else if (effectiveTimeOfDay === 'sunset') targetAudio = sunsetAudio;
        else targetAudio = dayAudio;
    }

    // 2. Setup Volume Constants
    const DEFAULT_VOL = 0.15;
    const RADIO_VOL = 0.25; 
    const SUNSET_VOL = 0.45; 
    const KITCHEN_VOL = 0.25;
    const DUCKED_VOLUME = 0.02; // Very quiet for pause menu
    const KITCHEN_WIN_VOLUME = 0.05; // Ducked volume when winning in kitchen to hear SFX

    // 3. Audio Loop for Fading (Simultaneous Cross-fade)
    const fadeInterval = setInterval(() => {
        // Check mute state first
        if (isMusicMuted) {
             [dayAudio, nightAudio, sunsetAudio, kitchenAudio, radioPlayer].forEach(track => {
                 track.volume = 0;
                 if (!track.paused) track.pause();
             });
             return;
        }

        // List of all tracks to manage
        const allTracks = [dayAudio, nightAudio, sunsetAudio, kitchenAudio, radioPlayer];

        allTracks.forEach(track => {
             // Determine target volume for THIS track
             let localTargetVol = 0;

             if (track === targetAudio) {
                 // Determine max volume based on track type
                 if (track === sunsetAudio) localTargetVol = SUNSET_VOL;
                 else if (track === radioPlayer) localTargetVol = RADIO_VOL;
                 else if (track === kitchenAudio) localTargetVol = KITCHEN_VOL;
                 else localTargetVol = DEFAULT_VOL;

                 // Apply Global Ducking (Pause Menu / Game End)
                 if (gameState === GameState.WON || gameState === GameState.LOST || gameState === GameState.PAUSED || gameState === GameState.LEVEL_SELECT) {
                     localTargetVol = DUCKED_VOLUME;
                 }
                 
                 // Apply Specific Kitchen Win Ducking
                 if (gameState === GameState.COOKING && isKitchenWin && track === kitchenAudio) {
                     localTargetVol = KITCHEN_WIN_VOLUME;
                 }
             } else {
                 localTargetVol = 0; // Fade out if not target
             }

             // FIX: Only attempt to play if volume is supposed to be > 0.
             // This prevents "zombie" tracks from overlapping on mobile.
             if (localTargetVol > 0) {
                 // Ensure playing
                 if (track.paused && (gameState !== GameState.MENU || hasInteracted)) {
                     // Handle src change for radio only if needed
                     if (track === radioPlayer && radioTrackKey) {
                        const trackSrc = RADIO_TRACKS[radioTrackKey as keyof typeof RADIO_TRACKS].src;
                        const currentSrcPath = radioPlayer.getAttribute('src');
                        if (currentSrcPath !== trackSrc) {
                            radioPlayer.src = trackSrc;
                            radioPlayer.load();
                        }
                     }
                     // Force play
                     const playPromise = track.play();
                     if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                     }
                 }

                 // Apply Smooth Fade UP
                 const FADE_SPEED = 0.015; 
                 if (track.volume < localTargetVol) {
                     track.volume = Math.min(localTargetVol, track.volume + FADE_SPEED);
                 } else if (track.volume > localTargetVol) {
                     // We are playing but need to duck volume (e.g., pause menu)
                     track.volume = Math.max(localTargetVol, track.volume - FADE_SPEED);
                 }
             } else {
                 // Fade DOWN
                 const FADE_SPEED = 0.015;
                 if (track.volume > 0) {
                     track.volume = Math.max(0, track.volume - FADE_SPEED);
                 }
                 
                 // FIX FOR MOBILE/iOS: 
                 // If volume is stuck (read-only 1 on iOS) or we simply want to ensure silence,
                 // we must pause immediately if target is 0.
                 // We add a check: if volume is effectively 0 OR (we are on mobile AND target is 0)
                 const shouldForcePause = track.volume <= 0.01 || (isMobile && localTargetVol === 0);

                 // Pause if effectively silent/forced and not target
                 if (shouldForcePause && !track.paused) {
                     track.volume = 0;
                     track.pause();
                     if (track === radioPlayer) track.currentTime = 0; 
                 }
             }
        });

    }, 50);

    return () => clearInterval(fadeInterval);
  }, [currentLevelIdx, isMusicMuted, gameState, effectiveTimeOfDay, radioTrackKey, isBookOpen, hasInteracted, isLoadingCooking, isKitchenWin, isExitingKitchen, isMobile]); // Added isMobile to deps


  useEffect(() => {
    let interval: any;
    if (gameState === GameState.PLAYING && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            isGameEndingRef.current = true; 
            setGameState(GameState.LOST);
            audioManager.play('lose'); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (score === totalItems && gameState === GameState.PLAYING) {
      isGameEndingRef.current = true;
      setGameState(GameState.WON);
      audioManager.play('win'); 
    }
  }, [score, totalItems, gameState]);

  const toggleMusic = () => {
    audioManager.play('click');
    const newVal = !isMusicMuted;
    setIsMusicMuted(newVal);
    audioManager.setMuted(newVal); 
  };

  const setLanguageAndClick = (lang: Language) => {
    audioManager.play('click');
    setLanguage(lang);
  };

  const startToStory = () => {
    audioManager.play('click');
    if (gameState === GameState.MENU) {
      setCurrentLevelIdx(0);
    }
    setGameState(GameState.STORY);
  };

  const startFreeRoam = (time: 'day' | 'night' | 'sunset') => {
    audioManager.play('click');
    setFreeRoamTime(time);
    setRadioTrackKey(null); // Reset radio when starting roam
    setShowRoamSelect(false);
    setGameState(GameState.FREE_ROAM);
  };

  const startLevel = () => {
    audioManager.play('click');
    const level = LEVELS[currentLevelIdx];
    setItems(level.items); 
    setTimeLeft(level.timeLimit);
    isGameEndingRef.current = false;
    setRadioTrackKey(null); // No radio in levels
    setGameState(GameState.PLAYING);
  };

  const handleLevelCompleteOrRetry = () => {
    audioManager.play('click');
    if (gameState === GameState.WON) {
      if (currentLevelIdx < LEVELS.length - 1) {
        setCurrentLevelIdx(prev => prev + 1);
        setGameState(GameState.STORY); 
      } else {
        setCurrentLevelIdx(0);
        setGameState(GameState.MENU);
      }
    } else {
      const level = LEVELS[currentLevelIdx];
      setItems(level.items); 
      setTimeLeft(level.timeLimit);
      isGameEndingRef.current = false;
      setGameState(GameState.PLAYING);
    }
  };

  const handleResume = () => {
    audioManager.play('click');
    setGameState(pausedStateRef.current || GameState.PLAYING);
  };

  const handleRestartLevel = () => {
    audioManager.play('click');
    if (pausedStateRef.current === GameState.FREE_ROAM) {
        setGameState(GameState.FREE_ROAM);
        return;
    }
    const level = LEVELS[currentLevelIdx];
    setItems(level.items);
    setTimeLeft(level.timeLimit);
    isGameEndingRef.current = false;
    setGameState(GameState.PLAYING);
  };

  const handleReturnToMenu = () => {
    audioManager.play('click');
    setCurrentLevelIdx(0);
    setGameState(GameState.MENU);
    setShowRoamSelect(false);
    setRadioTrackKey(null);
  };

  const handleGoToRoamFromPause = () => {
    audioManager.play('click');
    setCurrentLevelIdx(0);
    setGameState(GameState.MENU);
    setShowRoamSelect(true);
    setRadioTrackKey(null);
  };

  const handleGoToLevelSelect = (e: React.MouseEvent) => {
    audioManager.play('click');
    if (e && e.stopPropagation) e.stopPropagation();
    setGameState(GameState.LEVEL_SELECT);
  };

  const handleSelectLevel = (e: React.MouseEvent, idx: number) => {
    audioManager.play('click');
    if (e && e.stopPropagation) e.stopPropagation();
    setCurrentLevelIdx(idx);
    setGameState(GameState.STORY);
  };

  const handleBackToPause = () => {
    audioManager.play('click');
    setGameState(GameState.PAUSED);
    setSelectedMenuIndex(0);
  };

  const handleItemCleaned = (id: string) => {
    setItems((prevItems) => {
      return prevItems.map((i) => (i.id === id ? { ...i, isCleaned: true } : i));
    });
  };

  const handleOpenDrawer = () => {
    if (gameState === GameState.FREE_ROAM) {
        setIsDrawerOpen(true);
        audioManager.play('door_open');
    }
  };

  const handleOpenRadio = () => {
    if (gameState === GameState.FREE_ROAM) {
        setIsRadioOpen(true);
        audioManager.play('click');
    }
  };
  
  // New handler for door in Free Roam
  const handleInteractDoor = () => {
      if (gameState === GameState.FREE_ROAM) {
          setShowCookingPrompt(true);
          audioManager.play('click');
      }
  };
  
  // Start Cooking Transition
  const handleStartCooking = () => {
      setShowCookingPrompt(false);
      setIsLoadingCooking(true); // Triggers audio fade out via useEffect
      audioManager.play('click');
      
      // Fake loading time
      setTimeout(() => {
          setIsLoadingCooking(false);
          setGameState(GameState.COOKING);
      }, 2000);
  };
  
  const handleExitCooking = () => {
      audioManager.play('click');
      setIsKitchenWin(false); // Reset volume ducking
      
      // TRIGGER SEQUENTIAL FADE OUT
      // Set exit flag to true => Target Audio becomes NULL => Fade to silence
      setIsExitingKitchen(true);

      // Wait 1.2s for fade out to complete before switching state
      setTimeout(() => {
          setIsExitingKitchen(false);
          setGameState(GameState.FREE_ROAM); // Switching state triggers fade-in of Room BGM
      }, 1200);
  };

  const handlePlayTrack = (trackKey: string | null) => {
    audioManager.play('click');
    setRadioTrackKey(trackKey);
    
    // IMMEDIATE SWITCH LOGIC
    // This allows tracks to switch instantly without waiting for the audio loop logic.
    // It's crucial for mobile/iOS where changing src asynchronously might block playback.
    if (trackKey && radioPlayerRef.current) {
        const track = RADIO_TRACKS[trackKey as keyof typeof RADIO_TRACKS];
        if (track) {
            radioPlayerRef.current.src = track.src;
            radioPlayerRef.current.load();
            // Try to play immediately
            const playPromise = radioPlayerRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                     // If it fails (e.g. volume 0), the main audio loop will pick it up
                     // but at least we updated the src immediately.
                });
            }
        }
    } else if (!trackKey && radioPlayerRef.current) {
        // Immediate stop
        radioPlayerRef.current.pause();
        radioPlayerRef.current.currentTime = 0;
    }
  };

  const handleRadioEnded = () => {
      // Logic: When song ends, clear radio track so BGM returns
      setRadioTrackKey(null);
  };

  const handleOpenBook = () => {
    audioManager.play('pickup');
    setIsBookOpen(true);
    setBookPageIndex(0); 
    setIsDrawerOpen(false); 
  };

  const handleBookNext = () => {
    if (bookPageIndex < BOOK_PAGES.length - 1 && !isFlipping) {
      audioManager.play('pickup');
      setIsFlipping(true);
      setTimeout(() => {
        setBookPageIndex(prev => prev + 1);
        setIsFlipping(false);
      }, 300); 
    }
  };

  const handleBookPrev = () => {
    if (bookPageIndex > 0 && !isFlipping) {
       audioManager.play('pickup');
       setIsFlipping(true);
       setTimeout(() => {
        setBookPageIndex(prev => prev - 1);
        setIsFlipping(false);
       }, 300);
    }
  };

  const handleForceLock = () => {
    // If mobile, force lock just means hide the overlay and resume logic
    if (isMobile) {
        setShowStartHint(false);
        return;
    }
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.requestPointerLock();
  };

  // Trigger mobile interaction from button
  const handleMobileInteract = () => {
     setInteractTrigger(true);
     // Reset trigger after a short frame to simulate a "press"
     setTimeout(() => setInteractTrigger(false), 100);
  };

  const CozyLogo = ({ scale = 1, minimized = false }: { scale?: number, minimized?: boolean }) => {
    const letterColors = ["#ff9aa2", "#ffb7b2", "#ffdac1", "#e2f0cb", "#b5ead7", "#c7ceea"];
    
    // Bubble Component helper for cleaner JSX with variants
    const Bubble = ({ size, delay, pos, variant = 'blue' }: { size: string, delay: string, pos: string, variant?: 'blue' | 'pink' }) => {
      const colorClass = variant === 'pink' 
        ? 'bg-pink-400/40 border-pink-200/80 shadow-[0_0_10px_rgba(244,114,182,0.3)]' 
        : 'bg-blue-400/40 border-blue-200/80 shadow-[0_0_10px_rgba(96,165,250,0.3)]';
      
      return (
        <div 
          className={`absolute rounded-full border-2 backdrop-blur-[2px] animate-pulse ${colorClass} ${size} ${pos}`}
          style={{ animationDuration: delay }}
        >
           {/* Shine effect */}
           <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/90 rounded-full filter blur-[1px]"></div>
        </div>
      );
    };

    const topBubbleMargin = language === 'fr' ? 'mb-[-25px]' : 'mb-[-45px]';

    // Animation Styles for "Respiración" (Subtle Float)
    const floatStyle = minimized ? {} : { animation: 'subtle-float 3s ease-in-out infinite' };
    const floatStyleDelayed = minimized ? {} : { animation: 'subtle-float 4s ease-in-out infinite 0.5s' };
    const floatStyleSlower = minimized ? {} : { animation: 'subtle-float 5s ease-in-out infinite 1s' };

    return (
      <div 
        className={`relative flex flex-col items-center select-none transition-transform duration-500 ${minimized ? 'origin-top-left' : 'origin-center'}`}
        style={{ transform: `scale(${scale})` }}
      >
          {/* Inject Subtle Float Keyframes */}
          <style>{`
             @keyframes subtle-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
             }
          `}</style>

          {!minimized && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[170%] bg-white rounded-[50%] opacity-95 shadow-[0_10px_30px_rgba(93,64,55,0.15)] z-0 animate-pulse" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}></div>
          )}
          
          <div className={`relative z-20 ${topBubbleMargin} transform -rotate-2 hover:rotate-0 transition-transform`}>
            <div className="bg-[#ffb7b2] px-5 py-1 rounded-full border-4 border-white shadow-md">
               <span className="text-white font-black text-xl tracking-widest drop-shadow-sm">{t.bubble}</span>
            </div>
          </div>
          
          <div className="relative z-30 flex items-center justify-center filter drop-shadow-[0px_5px_0px_rgba(93,64,55,0.15)]">
              {t.main_title.split('').map((char: string, i: number) => (
                <span 
                  key={i}
                  className={`text-[7rem] font-black mx-[-3px] transform transition-transform hover:-translate-y-2 cursor-default ${i % 2 === 0 ? 'rotate-2' : '-rotate-2'}`}
                  style={{ 
                    color: letterColors[i % letterColors.length],
                    WebkitTextStroke: '2.5px #5d4037', 
                    paintOrder: 'stroke fill', 
                    textShadow: '4px 4px 0px #ffffff'
                  }}
                >
                  {char}
                </span>
              ))}

              <div className="absolute -right-8 -top-4 w-16 h-16 z-20 pointer-events-none">
                  <Bubble size="w-12 h-12" delay="4s" pos="top-0 right-0" variant="pink" />
                  <Bubble size="w-6 h-6" delay="2.5s" pos="top-8 right-8" variant="blue" />
                  <Bubble size="w-4 h-4" delay="3.5s" pos="top-2 right-10" variant="pink" />
              </div>
          </div>

          <div className="relative z-20 mt-[-40px] transform rotate-2 hover:rotate-0 transition-transform">
             <div className="bg-[#b5ead7] px-8 py-1 rounded-2xl border-[3px] border-[#5d4037] shadow-[4px_4px_0_rgba(93,64,55,0.2)]">
                <span className="text-[#5d4037] font-black text-2xl tracking-wide">{t.subtitle}</span>
             </div>
          </div>

             <img 
                src="/images/logo_icon_left.png" 
                alt="icon left" 
                className="absolute -left-7 -top-4 z-20 w-28 h-28 object-contain transition-transform duration-300 hover:scale-110" 
                style={floatStyle} 
              />
              
              <div 
                className="absolute -right-2 -bottom-6 z-40"
                style={floatStyleDelayed}
              >
                 <img 
                    src="/images/logo_icon_right.png" 
                    alt="icon right" 
                    className="w-28 h-28 object-contain filter drop-shadow-lg origin-bottom-left transform rotate-12 hover:rotate-45 transition-transform duration-300" 
                  />
              </div>

              <img 
                src="/images/logo_icon_bottom.png" 
                alt="icon bottom" 
                className="absolute -left-7 top-24 z-20 w-28 h-28 object-contain transition-transform duration-300 hover:scale-110"
                style={floatStyleSlower}
              />
      </div>
    );
  };

  const MusicIconOn = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>);
  const MusicIconOff = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>);

  const isGameFinished = gameState === GameState.WON && currentLevelIdx === LEVELS.length - 1;

  // --- NEW 2D BOOK RENDERER ---
  const renderDiaryOverlay = () => {
    const currentPage = BOOK_PAGES[bookPageIndex];
    const textLength = currentPage.text.length;
    
    // Dynamic Font Scaling Logic
    // Adjust size classes based on text length to try and fit without scrolling first
    const dynamicFontSize = textLength > 550 ? "text-base" : (textLength > 300 ? "text-lg" : "text-2xl");

    return (
      <div className="absolute inset-0 z-[60] bg-[#2d1b14]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
         {/* Table Texture Background */}
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8d6e63 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

         {/* The Book Container */}
         <div className="relative w-[900px] h-[550px] perspective-1000">
             
             {/* Book Back Cover/Base */}
             <div className="absolute inset-0 bg-[#fdf6e3] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-all duration-500 overflow-hidden">
                {/* Book Cover/Spine Effect */}
                <div className="absolute top-0 bottom-0 left-1/2 w-12 -translate-x-1/2 bg-gradient-to-r from-black/5 via-black/20 to-black/5 z-20 pointer-events-none mix-blend-multiply"></div>
                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(139,69,19,0.1)] pointer-events-none z-10"></div>
                
                {/* Left Page (Photo) */}
                <div className="absolute top-0 bottom-0 left-0 w-1/2 p-10 flex flex-col items-center justify-center border-r border-[#e0d6c2]">
                    <div className="absolute top-8 w-32 h-8 bg-[#ffb7b2] opacity-80 transform -rotate-3 shadow-sm z-10"></div>
                    
                    <div className="bg-white p-4 pb-12 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500 hover:scale-105 hover:z-30 cursor-pointer w-full max-w-[280px]">
                        <div className="w-full h-64 bg-gray-100 rounded-sm mb-2 overflow-hidden flex items-center justify-center">
                            <img 
                            src={currentPage.img} 
                            alt="Memory" 
                            className="w-full h-full object-cover filter sepia-[0.3] contrast-110"
                            />
                        </div>
                        <div className="absolute bottom-4 right-4 font-['Fredoka'] text-gray-400 text-xs tracking-widest">{currentPage.date || "Unknown"}</div>
                    </div>
                </div>

                {/* Right Page (Text) */}
                <div className="absolute top-0 bottom-0 right-0 w-1/2 p-12 flex flex-col bg-[linear-gradient(rgba(93,64,55,0.05)_1px,transparent_1px)] bg-[length:100%_2rem]">
                    <div className="flex justify-between items-center mb-6 opacity-60">
                        <span className="font-['Fredoka'] text-[#ff9aa2] text-xl font-bold tracking-widest">DIARIO</span>
                        <span className="font-mono text-sm text-[#8d6e63] font-bold border border-[#8d6e63] px-2 rounded-md">{bookPageIndex + 1} / {BOOK_PAGES.length}</span>
                    </div>

                    {/* Scrollable Text Container with dynamic font size */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                       <p className={`font-['Fredoka'] ${dynamicFontSize} text-[#5d4037] leading-relaxed tracking-wide`}>
                           {currentPage.text}
                       </p>
                    </div>

                    <div className="absolute bottom-8 right-8 text-4xl transform -rotate-12 animate-pulse">⭐</div>
                </div>
             </div>

             {/* Page Flip Animation Layer */}
             {isFlipping && (
                 <div className="absolute inset-0 z-50 flex pointer-events-none">
                     <div className="w-1/2 h-full bg-[#fdf6e3] shadow-xl border-r border-[#e0d6c2] origin-right animate-flip-page"></div>
                 </div>
             )}

             {/* Navigation Buttons */}
             {bookPageIndex > 0 && (
                <button 
                  onClick={handleBookPrev}
                  className={`absolute left-[-30px] top-1/2 -translate-y-1/2 bg-[#ffb7b2] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30 border-4 border-white ${getFocusClass(0)}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
             )}

            {bookPageIndex < BOOK_PAGES.length - 1 && (
                <button 
                  onClick={handleBookNext}
                  className={`absolute right-[-30px] top-1/2 -translate-y-1/2 bg-[#b5ead7] text-[#4a7c68] w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30 border-4 border-white ${getFocusClass(1)}`}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
             )}
         </div>

         {/* Close Button Outside */}
         <button 
            onClick={() => { setIsBookOpen(false); }}
            className={`absolute top-6 right-6 px-6 py-3 bg-[#e57373] text-white font-bold rounded-full shadow-lg hover:bg-[#ef5350] transition-colors flex items-center gap-2 z-50 font-['Fredoka'] tracking-wider border-4 border-white ${getFocusClass(2)}`}
         >
            <span>{t.book_close}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
         </button>
         
         <style>{`
            .perspective-1000 { perspective: 1000px; }
            @keyframes flip-page {
                0% { transform: rotateY(0deg); opacity: 1; }
                50% { opacity: 1; }
                100% { transform: rotateY(-90deg); opacity: 0; }
            }
            .animate-flip-page {
                animation: flip-page 0.3s ease-in-out forwards;
                transform-style: preserve-3d;
                backface-visibility: hidden;
            }
             /* Custom Scrollbar specifically for Book */
             .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
             }
             .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(141, 110, 99, 0.1); 
                border-radius: 4px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #8d6e63; 
                border-radius: 4px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #5d4037; 
             }
         `}</style>
      </div>
    );
  };

  const currentRadioTrack = radioTrackKey ? RADIO_TRACKS[radioTrackKey as keyof typeof RADIO_TRACKS] : null;

  return (
    <div className="relative w-full h-full select-none font-['Fredoka'] touch-none">
      {/* Background Audio Loops */}
      <audio ref={dayAudioRef} loop src="/sounds/bgm_day.mp3" />
      <audio ref={nightAudioRef} loop src="/sounds/bgm_night.mp3" />
      <audio ref={sunsetAudioRef} loop src="/sounds/bgm_sunset.mp3" />
      {/* NEW: Kitchen Background Music */}
      <audio ref={kitchenAudioRef} loop src="/sounds/bgm_kitchen.mp3" />
      
      {/* Radio Player - Single instance that changes src */}
      <audio ref={radioPlayerRef} onEnded={handleRadioEnded} />

      {/* RENDER GAME SCENE OR KITCHEN SCENE */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full bg-[#fdf6e3] text-[#5d4037] text-2xl font-bold">Loading...</div>}>
          {gameState === GameState.COOKING ? (
             <KitchenScene 
                onExit={handleExitCooking} 
                onWinStateChange={(isWin) => setIsKitchenWin(isWin)} // Handle volume ducking
                language={language}
             />
          ) : (
             <GameScene 
                gameState={gameState} 
                onItemCleaned={handleItemCleaned}
                items={items}
                timeOfDay={effectiveTimeOfDay} // Use DERIVED time to fix pause bug
                dropZone={currentLevel.dropZone}
                onOpenDrawer={handleOpenDrawer}
                onOpenRadio={handleOpenRadio}
                onDoorInteract={handleInteractDoor} // Pass the handler
                controlsEnabled={shouldCaptureCursor} 
                isMobile={isMobile}
                mobileInputs={{
                    move: moveJoystickRef,
                    look: lookJoystickRef,
                    interact: interactTrigger
                }}
                isUIOpen={isBookOpen || isRadioOpen || isDrawerOpen || showCookingPrompt} // Pass blocking flag to scene
            />
          )}
        </Suspense>
      </div>
      
      {/* AUDIO UNLOCK WARNING OVERLAY - SHOWS IF GAMEPAD DETECTED BUT NO TOUCH YET */}
      {!hasInteracted && isGamepadConnected && (
         <div 
           className="absolute top-0 left-0 right-0 bg-red-500/90 text-white font-black text-center py-3 z-[100] animate-pulse cursor-pointer shadow-lg"
           onClick={() => { /* Handled by global listener */ }}
         >
            {t.audio_warning}
         </div>
      )}

      {/* MOBILE CONTROLS OVERLAY - ONLY SHOW IN GAME SCENE */}
      {isMobile && shouldCaptureCursor && !isGamepadConnected && (
        <MobileControls 
          onMoveChange={(x, y) => { moveJoystickRef.current = { x: -x, y }; }} // Invert X for correct feeling
          onLookChange={(x, y) => { lookJoystickRef.current = { x, y }; }} 
          onInteract={handleMobileInteract}
        />
      )}

      {/* 2D BOOK OVERLAY */}
      {isBookOpen && renderDiaryOverlay()}

      {/* COOKING PROMPT MODAL */}
      {showCookingPrompt && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
           <div className="bg-[#fff8e7] rounded-3xl border-8 border-[#d7ccc8] p-10 max-w-md text-center shadow-2xl animate-fade-in">
              {/* Removed Pizza Emoji */}
              <h2 className="text-3xl font-black text-[#5d4037] mb-6 mt-4">{t.cooking_prompt_title}</h2>
              <div className="flex gap-4 justify-center">
                  <button 
                    onClick={handleStartCooking}
                    className={`px-8 py-3 bg-[#b5ead7] text-[#4a7c68] font-black rounded-xl border-b-4 border-[#88bba6] active:translate-y-1 active:border-b-0 transition-all ${getFocusClass(0)}`}
                  >
                    {t.cooking_prompt_yes}
                  </button>
                  <button 
                    onClick={() => setShowCookingPrompt(false)}
                    className={`px-8 py-3 bg-[#ff9aa2] text-[#c25e66] font-black rounded-xl border-b-4 border-[#e57373] active:translate-y-1 active:border-b-0 transition-all ${getFocusClass(1)}`}
                  >
                    {t.cooking_prompt_no}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* LOADING SCREEN FOR COOKING */}
      {isLoadingCooking && (
        <div className="absolute inset-0 z-[80] bg-[#6F4E37] flex flex-col items-center justify-center text-white animate-fade-in pointer-events-auto">
            <div className="mb-6 animate-bounce">
                <CozyLogo scale={0.8} />
            </div>
            <h2 className="text-4xl font-black tracking-widest">{t.cooking_loading}</h2>
        </div>
      )}

      {/* RADIO OVERLAY */}
      {isRadioOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto">
           {/* ... (Existing Radio Code) ... */}
           {/* Main Container - Wider for split view */}
           <div className="bg-[#1f2937] w-[900px] h-[550px] rounded-3xl overflow-hidden border-4 border-[#374151] shadow-[0_30px_70px_rgba(0,0,0,0.6)] relative flex">
              
              {/* CLOSE BUTTON */}
              <button 
                onClick={() => setIsRadioOpen(false)}
                className={`absolute top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-transform hover:scale-110 ${getFocusClass(Object.keys(RADIO_TRACKS).length + 1)}`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* LEFT SIDE: LARGE ALBUM ART & VINYL COMPOSITION */}
              <div className="w-[55%] relative flex flex-col items-center justify-center overflow-hidden bg-[#111827]">
                  {/* Atmospheric Background - Changes color based on track */}
                  <div className={`absolute inset-0 opacity-40 transition-all duration-1000 bg-gradient-to-br ${currentRadioTrack ? currentRadioTrack.colorFrom : 'from-gray-800'} ${currentRadioTrack ? currentRadioTrack.colorTo : 'to-gray-900'} blur-xl scale-125`}></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  
                  {/* THE COMPOSITION */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center pl-8 pr-16 perspective-1000">
                      
                      {/* 1. VINYL RECORD (Behind the cover, spins out) */}
                      <div className={`absolute w-[320px] h-[320px] rounded-full bg-[#111] shadow-xl flex items-center justify-center transition-transform duration-1000 ease-in-out border-8 border-[#222] ${currentRadioTrack ? 'translate-x-24 rotate-12' : 'translate-x-0 rotate-0'}`}>
                          {/* Grooves */}
                          <div className="absolute inset-0 rounded-full opacity-30 bg-[repeating-radial-gradient(#222_0px,#222_2px,#111_3px,#111_4px)]"></div>
                          <div className={`w-full h-full rounded-full flex items-center justify-center ${currentRadioTrack ? 'animate-spin-slow' : ''}`}>
                             <div className={`w-32 h-32 rounded-full border-4 border-black bg-gradient-to-tr ${currentRadioTrack ? currentRadioTrack.colorFrom : 'from-gray-500'} ${currentRadioTrack ? currentRadioTrack.colorTo : 'to-gray-600'} flex items-center justify-center shadow-inner overflow-hidden relative`}>
                                 {/* Vinyl Center Image */}
                                 {currentRadioTrack && (
                                     <img src={currentRadioTrack.cover} className="absolute inset-0 w-full h-full object-cover opacity-70" alt="vinyl center"/>
                                 )}
                                 <div className="w-3 h-3 bg-black rounded-full z-10"></div>
                             </div>
                          </div>
                      </div>

                      {/* 2. ALBUM COVER (Front, Static) */}
                      <div className={`relative w-[340px] h-[340px] rounded-lg shadow-2xl transition-all duration-700 bg-gray-800 flex items-center justify-center z-20 border-t border-l border-white/20 overflow-hidden ${currentRadioTrack ? 'scale-100 rotate-[-2deg]' : 'scale-95 grayscale opacity-80'}`}>
                          {currentRadioTrack ? (
                              <div className={`absolute inset-0 bg-gradient-to-br ${currentRadioTrack.colorFrom} ${currentRadioTrack.colorTo} p-0 flex flex-col justify-between`}>
                                   
                                   {/* Real Image Cover Background */}
                                   <img src={currentRadioTrack.cover} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                   
                                   {/* Overlay Gradient for Text Readability */}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                                   <div className="flex justify-between items-start z-10 p-6">
                                       <span className="text-white/60 font-black text-xs tracking-[0.2em] border border-white/40 px-2 py-1 rounded backdrop-blur-sm">STEREO</span>
                                       <div className="text-5xl filter drop-shadow-md animate-pulse">{currentRadioTrack.icon}</div>
                                   </div>
                                   
                                   <div className="z-10 p-6">
                                       <h1 className="text-4xl font-black text-white leading-none mb-2 drop-shadow-md break-words">{currentRadioTrack.title}</h1>
                                       <p className="text-white/80 font-bold uppercase tracking-widest text-sm">{currentRadioTrack.artist}</p>
                                   </div>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                                  <span className="text-6xl opacity-30">💿</span>
                                  <span className="font-bold tracking-widest text-sm">NO DISC</span>
                              </div>
                          )}
                          
                          {/* Glare/Shine overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                      </div>
                  </div>

                  {/* NOW PLAYING BAR (Bottom Overlay) */}
                  <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-md border-t border-white/10 p-4 flex items-center justify-center gap-3 z-30">
                       <div className={`w-3 h-3 rounded-full ${currentRadioTrack ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                       <p className="text-white font-mono text-sm tracking-wide">
                          {currentRadioTrack ? `PLAYING: ${currentRadioTrack.title.toUpperCase()}` : 'WAITING FOR INPUT...'}
                       </p>
                  </div>
              </div>

              {/* RIGHT SIDE: TRACK LIST */}
              <div className="w-[45%] bg-[#1f2937] p-8 flex flex-col relative border-l border-[#374151]">
                  <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
                     <h2 className="text-white font-black text-3xl tracking-widest drop-shadow-md">{t.radio_title}</h2>
                     <span className="text-2xl animate-pulse">📻</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                     {Object.entries(RADIO_TRACKS).map(([key, track]: [string, any], index: number) => (
                        <button
                           key={key}
                           id={`radio-item-${index}`}
                           onClick={() => handlePlayTrack(key)}
                           className={`w-full text-left p-4 rounded-xl flex items-center transition-all duration-300 group border relative overflow-hidden
                             ${radioTrackKey === key 
                               ? `bg-gradient-to-r ${track.colorFrom} ${track.colorTo} border-transparent shadow-[0_0_20px_rgba(0,0,0,0.4)] translate-x-2` 
                               : 'bg-[#2d3748] border-gray-600 hover:bg-[#4a5568] hover:border-gray-400'
                             }
                             ${getFocusClass(index)}
                           `}
                        >
                           {/* Icon Box with Image if available */}
                           <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl shadow-sm mr-5 overflow-hidden relative ${radioTrackKey === key ? 'bg-white/20' : 'bg-black/20'}`}>
                              <img src={track.cover} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="mini cover" />
                              <span className="relative z-10 drop-shadow-md">{track.icon}</span>
                           </div>
                           
                           {/* Text Info */}
                           <div className="flex-1 z-10">
                              <p className={`font-black text-xl leading-none mb-1 ${radioTrackKey === key ? 'text-white' : 'text-gray-200'}`}>
                                {track.title}
                              </p>
                              <p className={`text-xs font-bold uppercase tracking-wider ${radioTrackKey === key ? 'text-white/80' : 'text-gray-400'}`}>
                                {track.artist}
                              </p>
                           </div>

                           {/* Equalizer Animation if playing */}
                           {radioTrackKey === key && (
                             <div className="flex items-end gap-[3px] h-6 ml-3">
                                <div className="w-1.5 bg-white animate-[bounce_0.8s_infinite] h-3 rounded-t-sm"></div>
                                <div className="w-1.5 bg-white animate-[bounce_1.2s_infinite] h-6 rounded-t-sm"></div>
                                <div className="w-1.5 bg-white animate-[bounce_0.6s_infinite] h-2 rounded-t-sm"></div>
                                <div className="w-1.5 bg-white animate-[bounce_1.0s_infinite] h-4 rounded-t-sm"></div>
                             </div>
                           )}
                        </button>
                     ))}
                  </div>

                  {/* BOTTOM CONTROLS */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                     <button 
                       onClick={() => handlePlayTrack(null)}
                       className={`w-full py-5 rounded-2xl font-black text-white text-lg uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3
                         ${currentRadioTrack 
                            ? 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/30 hover:scale-[1.02]' 
                            : 'bg-gray-700 cursor-not-allowed opacity-50'
                         }
                         ${getFocusClass(Object.keys(RADIO_TRACKS).length)}
                       `}
                       disabled={!currentRadioTrack}
                     >
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                        {t.radio_stop}
                     </button>
                  </div>
              </div>
           </div>
           
           {/* Custom Scrollbar Styles injected locally */}
           <style>{`
             .animate-spin-slow {
                animation: spin 6s linear infinite;
             }
             @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
             }
             .perspective-1000 {
                perspective: 1000px;
             }
             .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
             }
             .custom-scrollbar::-webkit-scrollbar-track {
                background: #1f2937; 
                border-radius: 4px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4b5563; 
                border-radius: 4px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280; 
             }
           `}</style>
        </div>
      )}

      {/* HUD & UI LAYERS */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED || gameState === GameState.LEVEL_SELECT || gameState === GameState.FREE_ROAM) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[4vmin] left-[4vmin] z-20 pointer-events-auto origin-top-left">
             <CozyLogo scale={proportionalScale * 0.8} minimized={true} />
          </div>
          {/* CROSSHAIR - HIDE ON MOBILE TO KEEP IT CLEAN OR SHOW SMALL DOT */}
          {(gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) && !isBookOpen && !isDrawerOpen && !isRadioOpen && !showCookingPrompt && <div id="crosshair"></div>}
          
          {/* TAP TO PLAY - ONLY SHOW IF NOT MOBILE AND NOT LOCKED AND NOT GAMEPAD */}
          {/* On Mobile, we don't need 'click to capture' overlay because we use joysticks */}
          {(gameState === GameState.PLAYING || gameState === GameState.FREE_ROAM) && !isLocked && shouldCaptureCursor && !isMobile && !isGamepadConnected && (
            <div 
              onClick={handleForceLock}
              className="absolute inset-0 flex items-center justify-center bg-black/30 z-50 backdrop-blur-[2px] pointer-events-auto cursor-pointer"
            >
              <div className="bg-[#fff8e7] px-8 py-6 rounded-3xl border-4 border-[#5d4037] text-center shadow-[0_8px_0_rgba(0,0,0,0.2)] animate-bounce">
                <p className="text-2xl font-black text-[#5d4037] mb-2">{t.tap_to_play_title}</p>
                <p className="text-lg text-[#8d6e63] font-bold">{t.tap_to_play_desc}</p>
              </div>
            </div>
          )}

          {/* RADIO NOW PLAYING INDICATOR (If override active) */}
          {currentRadioTrack && gameState === GameState.FREE_ROAM && !isRadioOpen && !showCookingPrompt && (
             <div 
                onClick={() => setIsRadioOpen(true)}
                className="absolute top-[20vmin] right-[4vmin] pointer-events-auto bg-black/60 backdrop-blur-md px-[3vmin] py-[2vmin] rounded-[2vmin] flex flex-col items-end animate-fade-in group hover:bg-black/80 transition-colors cursor-pointer border border-white/10 shadow-lg z-50"
             >
                <span className="text-green-400 text-[2vmin] font-bold uppercase tracking-widest flex items-center gap-[1vmin] mb-[0.5vmin]">
                    <div className="w-[1.5vmin] h-[1.5vmin] rounded-full bg-green-500 animate-pulse shadow-[0_0_1vmin_#22c55e]"></div>
                    {t.radio_playing}
                </span>
                <span className="text-white font-bold text-[3vmin] border-t border-white/10 pt-[0.5vmin]">
                     {currentRadioTrack.title}
                </span>
             </div>
          )}

          <div className="absolute bottom-[4vmin] right-[4vmin] z-20 flex items-end gap-[2vmin] pointer-events-auto">
            {/* HIDE MUTE BUTTON ON MOBILE IF CONTROLS ARE IN THE WAY, OR MOVE IT UP */}
            <button 
                onClick={toggleMusic}
                className={`w-[10vmin] h-[10vmin] mb-[2vmin] rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all text-[#5d4037] ${isMobile ? 'absolute top-[-500px]' : ''}`} // Hacky hide on mobile for now or reposition
                style={isMobile ? { top: '-500px', opacity: 0 } : {}}
            >
                {isMusicMuted ? <MusicIconOff /> : <MusicIconOn />}
            </button>
            {/* HIDE HUD IN FREE ROAM OR BOOK MODE */}
            {!isRoamingState && !isBookOpen && (
                <>
                <div className={`flex flex-col items-center justify-center w-[20vmin] h-[20vmin] rounded-full border-[0.8vmin] border-[#5d4037] shadow-[0_1vmin_0_rgba(0,0,0,0.2)] transition-colors duration-500 ${timeLeft < 20 ? 'bg-[#ff9aa2] animate-pulse' : 'bg-[#fff8e7]'}`}>
                <div className="text-[#5d4037] mb-[-1vmin]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[6vmin] w-[6vmin]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-[6vmin] font-bold text-[#5d4037] tabular-nums leading-none">{timeLeft}</span>
                <span className="text-[2vmin] font-bold text-[#8d6e63] uppercase">{t.hud_sec}</span>
                </div>
                <div className={`bg-[#b8e0d2] border-[0.8vmin] border-[#5d4037] rounded-[4vmin] px-[4vmin] py-[2vmin] h-[18vmin] flex flex-col items-center justify-center shadow-[0_1vmin_0_rgba(0,0,0,0.2)] min-w-[24vmin]`}>
                <div className="flex items-center gap-[1vmin] mb-[0.5vmin]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[4vmin] w-[4vmin] text-[#5d4037]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" /></svg>
                    <span className="text-[2.5vmin] font-bold text-[#4a7c68] uppercase">{t.hud_cleaned}</span>
                </div>
                <div className="flex items-baseline gap-[1vmin]">
                    <span className="text-[6vmin] font-bold text-[#ffffff] drop-shadow-[0_0.5vmin_0_rgba(0,0,0,0.2)] tabular-nums leading-none" style={{ WebkitTextStroke: '0.3vmin #4a7c68', paintOrder: 'stroke fill' }}>{score}</span>
                    <span className="text-[4vmin] font-bold text-[#5d4037] leading-none">/ {totalItems}</span>
                </div>
                </div>
                </>
            )}
          </div>
          
          {/* MOBILE MENU BUTTON (Top Right) - Also show if Gamepad connected for visibility */}
          {(isMobile || isGamepadConnected) && shouldCaptureCursor && (
             <button 
               onClick={handleBackToPause}
               className="absolute top-[4vmin] right-[4vmin] pointer-events-auto w-[12vmin] h-[12vmin] bg-white/80 rounded-full border-[0.8vmin] border-[#5d4037] flex items-center justify-center z-50"
             >
                <span className="text-[5vmin]">⏸️</span>
             </button>
          )}

        </div>
      )}

      {/* DRAWER UI OVERLAY (FREE ROAM) - Show only if book is NOT open */}
      {isDrawerOpen && !isBookOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="bg-[#8d6e63] w-[500px] h-[400px] rounded-3xl border-8 border-[#5d4037] shadow-2xl relative flex items-center justify-center overflow-hidden">
                <button 
                  onClick={() => { setIsDrawerOpen(false); }} 
                  className={`absolute top-4 right-4 text-white hover:text-red-200 transition-colors z-50 ${getFocusClass(1)}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                {/* 3D BOOK ITEM IN DRAWER (Static representation to click) */}
                <button 
                   onClick={handleOpenBook}
                   className={`group relative w-48 h-64 transition-transform duration-500 hover:scale-105 hover:-translate-y-2 ${getFocusClass(0)}`}
                   style={{ transformStyle: 'preserve-3d', transform: 'rotate(-3deg)' }}
                >
                    <div className="absolute inset-0 bg-black/30 blur-md translate-x-4 translate-y-4 rounded-lg"></div>
                    <div className="absolute inset-0 bg-[#fdf6e3] rounded-r-lg rounded-l-sm border-l border-gray-300 translate-x-2 translate-y-2"></div>
                    <div className="absolute inset-0 bg-[#ff9aa2] rounded-r-lg rounded-l-sm border-l-8 border-[#e57373] flex flex-col items-center justify-center shadow-lg relative overflow-hidden z-10">
                        <div className="absolute left-2 top-0 bottom-0 w-[1px] bg-[#e57373] opacity-30"></div>
                        <div className="border-2 border-white/50 p-4 w-[80%] flex items-center justify-center rounded-lg">
                             <div className="text-white font-['Fredoka'] font-black text-xl text-center leading-none tracking-widest flex flex-col gap-1 drop-shadow-md">
                                <span>DIARIO</span>
                                <span className="text-sm opacity-80">DE</span>
                                <span>CECI</span>
                             </div>
                        </div>
                        <div className="absolute top-2 right-2 text-2xl animate-pulse">⭐</div>
                    </div>
                    <span className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-white font-bold text-lg bg-black/40 px-6 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Leer</span>
                </button>
            </div>
        </div>
      )}

      {/* PAUSE MENU OVERLAY */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-[4vmin]">
             <div className="bg-[#fff8e7] rounded-[4vmin] border-[1vmin] border-[#d7ccc8] p-[6vmin] w-[90vw] max-w-[70vmin] text-center shadow-2xl">
                <h2 className="text-[6vmin] font-black text-[#5d4037] mb-[6vmin] tracking-widest">{t.pause_title}</h2>
                <div className="flex flex-col gap-[3vmin]">
                   {pauseMenuActions.map((item, idx) => (
                      <button 
                          key={idx}
                          onClick={item.action} 
                          className={`px-[6vmin] py-[2.5vmin] text-[3.5vmin] font-bold rounded-[3vmin] border-[0.8vmin] shadow-md active:translate-y-1 transition-all
                             ${getFocusClass(idx)}
                             ${idx === 0 ? 'bg-[#b5ead7] text-[#4a7c68] border-[#88bba6]' : 
                               idx === 1 ? 'bg-[#ffdac1] text-[#b38061] border-[#dcbba3]' : 
                               idx === 2 ? 'bg-[#fdf6e3] text-[#d4a373] border-[#e8d5b5]' : 
                               idx === 3 ? 'bg-[#c7ceea] text-[#6a7b9c] border-[#9aa6c4]' : 
                               'bg-[#ff9aa2] text-[#c25e66] border-[#e57373]'}
                          `}
                      >
                          {item.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* LEVEL SELECT SCREEN */}
      {gameState === GameState.LEVEL_SELECT && (
        <div className="absolute inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-[4vmin]">
            <div className="bg-[#fff8e7] rounded-[4vmin] border-[1vmin] border-[#d7ccc8] p-[6vmin] w-[90vw] max-w-[100vmin] text-center shadow-2xl">
               <h2 className="text-[6vmin] font-black text-[#5d4037] mb-[6vmin] tracking-widest">{t.level_select_title}</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-[3vmin] mb-[6vmin]">
                 {LEVELS.map((level, idx) => (
                   <button 
                    key={level.id} 
                    onClick={(e) => handleSelectLevel(e, idx)}
                    className={`p-[4vmin] rounded-[3vmin] border-[0.8vmin] shadow-md transition-all active:scale-95 flex flex-col items-center gap-[2vmin] group
                      ${idx === currentLevelIdx ? 'bg-[#ffdac1] border-[#dcbba3]' : 'bg-white border-[#e5e7eb] hover:border-[#b5ead7]'}
                      ${getFocusClass(idx)}
                    `}
                   >
                      <div className="text-[6vmin] mb-[1vmin] group-hover:scale-110 transition-transform">
                        {level.timeOfDay === 'night' ? '🌙' : (level.timeOfDay === 'sunset' ? '🌅' : '☀️')}
                      </div>
                      <span className="text-[3vmin] font-black text-[#5d4037]">{t[level.titleKey]}</span>
                   </button>
                 ))}
               </div>
               <button 
                  onClick={handleBackToPause} 
                  className={`px-[6vmin] py-[2.5vmin] bg-[#e5e7eb] text-[#5d4037] text-[3.5vmin] font-bold rounded-[3vmin] border-[0.8vmin] border-[#d1d5db] shadow-md active:translate-y-1 transition-all ${getFocusClass(LEVELS.length)}`}
               >
                  {t.back}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* STORY MODE OVERLAY */}
      {gameState === GameState.STORY && (
        <div className="absolute inset-0 z-40 overflow-y-auto bg-[#5d4037]/90 backdrop-blur-sm pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-[4vmin]">
             <div className="bg-[#fff8e7] rounded-[4vmin] border-[1vmin] border-[#d7ccc8] p-[6vmin] w-[90vw] max-w-[90vmin] text-center shadow-2xl transform rotate-1">
                <h2 className="text-[6vmin] font-black text-[#5d4037] mb-[4vmin]">{t[LEVELS[currentLevelIdx].titleKey]}</h2>
                <p className="text-[3.5vmin] text-[#8d6e63] font-bold whitespace-pre-line mb-[5vmin] leading-relaxed">
                  {t[`story_l${LEVELS[currentLevelIdx].id}`]}
                </p>
                <button 
                  onClick={startLevel}
                  className={`px-[8vmin] py-[3vmin] bg-[#b5ead7] hover:bg-[#a3d9c5] text-[#4a7c68] text-[4vmin] font-black rounded-full border-b-[1vmin] border-[#88bba6] active:border-b-0 active:translate-y-2 transition-all shadow-lg ${getFocusClass(0)}`}
                >
                  {t.story_continue_btn}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MAIN MENU OVERLAY */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-[#fdf6e3]/80 backdrop-blur-sm pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-[4vmin]">
            <div className="relative flex flex-col items-center gap-[4vmin] w-full max-w-4xl">
              <div className="z-20 transform hover:scale-105 transition-transform duration-500">
                 <CozyLogo scale={proportionalScale * 1.8} />
              </div>
              
              {/* SUBMENU FOR FREE ROAM OR MAIN */}
              <div className="bg-white/90 backdrop-blur rounded-[4vmin] border-[1vmin] border-[#e2f0cb] p-[5vmin] shadow-[0_20px_50px_rgba(93,64,55,0.15)] text-center flex flex-col items-center gap-[3vmin] w-[90vw] max-w-[80vmin] z-10 transform rotate-1 transition-all duration-300">
               {!showRoamSelect ? (
                 <>
                    <div className="bg-[#fff8e7] p-[4vmin] rounded-[3vmin] border-dashed border-2 border-[#d7ccc8] w-full">
                        <p className="text-[#8d6e63] text-[3vmin] font-medium leading-relaxed whitespace-pre-line">{t.intro}</p>
                    </div>
                    <div className="flex gap-[3vmin] justify-center items-center w-full">
                        <div className="flex gap-[1vmin] bg-[#f5f5f5] p-[1vmin] rounded-full">
                            <button onClick={() => setLanguageAndClick('es')} className={`px-[3vmin] py-[1.5vmin] text-[2.5vmin] rounded-full font-bold transition-all ${language === 'es' ? 'bg-white text-[#5d4037] shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'} ${getFocusClass(2)}`}>ES</button>
                            <button onClick={() => setLanguageAndClick('fr')} className={`px-[3vmin] py-[1.5vmin] text-[2.5vmin] rounded-full font-bold transition-all ${language === 'fr' ? 'bg-white text-[#5d4037] shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'} ${getFocusClass(3)}`}>FR</button>
                        </div>
                        <button onClick={toggleMusic} className={`w-[8vmin] h-[8vmin] flex items-center justify-center rounded-full transition-all border-[0.5vmin] ${!isMusicMuted ? 'bg-[#ffdac1] text-[#5d4037] border-[#ffb7b2] shadow-sm' : 'bg-gray-100 text-gray-400 border-gray-200'} ${getFocusClass(4)}`}>
                            {isMusicMuted ? <MusicIconOff /> : <MusicIconOn />}
                        </button>
                    </div>
                    <div className="flex w-full gap-[2vmin]">
                        <button onClick={startToStory} className={`flex-1 py-[3vmin] bg-[#ff9aa2] hover:bg-[#ff808b] text-white text-[4vmin] font-black rounded-[3vmin] border-b-[1vmin] border-[#e57373] active:border-b-0 active:translate-y-2 transition-all shadow-xl flex items-center justify-center gap-[2vmin] group ${getFocusClass(0)}`}>
                            <span>{t.start_btn}</span>
                            <span className="group-hover:rotate-12 transition-transform">✨</span>
                        </button>
                        <button onClick={() => { audioManager.play('click'); setShowRoamSelect(true); }} className={`px-[4vmin] py-[3vmin] bg-[#c7ceea] hover:bg-[#b0badb] text-[#5d4037] text-[3vmin] font-black rounded-[3vmin] border-b-[1vmin] border-[#9aa6c4] active:border-b-0 active:translate-y-2 transition-all shadow-xl ${getFocusClass(1)}`}>
                            {t.roam_btn}
                        </button>
                    </div>
                 </>
               ) : (
                  <>
                     <h3 className="text-2xl font-black text-[#5d4037] mb-4">{t.roam_title}</h3>
                     <div className="flex flex-col gap-4 w-full">
                        <button onClick={() => startFreeRoam('day')} className={`py-4 bg-[#fff8e1] hover:bg-[#ffe082] text-[#f57f17] text-xl font-bold rounded-2xl border-b-4 border-[#ffb300] active:border-b-0 transition-all shadow-md ${getFocusClass(0)}`}>
                            ☀️ {t.roam_day}
                        </button>
                        <button onClick={() => startFreeRoam('sunset')} className={`py-4 bg-[#ffccbc] hover:bg-[#ffab91] text-[#d84315] text-xl font-bold rounded-2xl border-b-4 border-[#ff8a65] active:border-b-0 transition-all shadow-md ${getFocusClass(1)}`}>
                            🌅 {t.roam_sunset}
                        </button>
                        <button onClick={() => startFreeRoam('night')} className={`py-4 bg-[#c5cae9] hover:bg-[#9fa8da] text-[#283593] text-xl font-bold rounded-2xl border-b-4 border-[#7986cb] active:border-b-0 transition-all shadow-md ${getFocusClass(2)}`}>
                            🌙 {t.roam_night}
                        </button>
                        <button onClick={() => { audioManager.play('click'); setShowRoamSelect(false); }} className={`mt-4 text-[#8d6e63] font-bold underline ${getFocusClass(3)}`}>
                            {t.back}
                        </button>
                     </div>
                  </>
               )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* End Screen Overlay */}
      {(gameState === GameState.WON || gameState === GameState.LOST) && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="min-h-full flex items-center justify-center p-[4vmin]">
            <div className={`p-[8vmin] rounded-[5vmin] border-[1vmin] text-center shadow-2xl transform ${gameState === GameState.WON ? 'bg-[#d8f3dc] border-[#95d5b2] rotate-1' : 'bg-[#fad2e1] border-[#f28482] -rotate-1'} w-[90vw] max-w-[80vmin]`}>
              <h1 className={`text-[8vmin] font-black mb-[4vmin] ${gameState === GameState.WON ? 'text-[#40916c]' : 'text-[#e5383b]'} drop-shadow-sm`}>
                {gameState === GameState.WON ? (isGameFinished ? t.win_game_title : t.win_title) : t.lose_title}
              </h1>
              <div className="flex flex-col items-center mb-[6vmin]">
                <span className="text-[#5d4037] text-[3.5vmin] font-bold mb-[2vmin]">{t.score_label}</span>
                <div className="bg-white px-[6vmin] py-[3vmin] rounded-[3vmin] border-[0.8vmin] border-[#5d4037] shadow-inner">
                   <span className="text-[7vmin] font-black text-[#5d4037]">{score} / {totalItems}</span>
                </div>
              </div>
              <button 
                onClick={handleLevelCompleteOrRetry}
                className={`px-[8vmin] py-[3vmin] bg-white text-[#5d4037] hover:bg-[#fdf6e3] text-[4vmin] font-black rounded-full border-[0.8vmin] border-[#5d4037] shadow-[0_6px_0_#5d4037] active:shadow-none active:translate-y-1.5 transition-all ${getFocusClass(0)}`}
              >
                {gameState === GameState.WON 
                   ? (isGameFinished ? t.retry_game_win : t.retry_win) 
                   : t.retry_lose
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Asset Loader */}
      <Loader 
        containerStyles={{ background: '#1a1a1a' }}
        innerStyles={{ background: 'rgba(255, 255, 255, 0.2)', width: '300px', height: '10px', borderRadius: '5px' }}
        barStyles={{ background: '#ff9aa2', height: '10px', borderRadius: '5px' }}
        dataInterpolation={(p) => `Cargando modelos 3D... ${p.toFixed(0)}%`}
      />
    </div>
  );
};

export default App;
