
import React, { useState, useEffect, useRef, useCallback } from 'react';
import IntroSequence from './components/IntroSequence';
import Aquarium from './components/Aquarium';
import Showroom from './components/Showroom'; 
import Shop3D from './components/Shop3D'; 
import FishingGame from './components/FishingGame';
import { AppState, GamePhase, FishState, Task, LifeStage, SpeciesInfo } from './types';
import { ShoppingBag, Activity, Droplets, Thermometer, Wind, FlaskConical, Pill, Volume2, VolumeX, Eraser, Diamond, Coins, DollarSign, Clock, Baby, Trophy, Save, RotateCcw } from 'lucide-react';
import { getFishThoughts } from './services/geminiService';
import { audioManager } from './services/audioService';

// Data Imports
import { SPECIES_DB } from './data/species';
import { STANDARD_ITEMS } from './data/shopItems';
import { generateTasks, spawnFish, spawnEgg } from './utils/gameHelpers';

// Constants
const INITIAL_MONEY = 150;
const INITIAL_GEMS = 5;
const SAVE_KEY = 'fishFarmState_v15'; 

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [tankSize, setTankSize] = useState<{ w: number; h: number }>({ w: 800, h: 500 });
  const [shopOpen, setShopOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sellMode, setSellMode] = useState(false);
  const [offlineReport, setOfflineReport] = useState<{ time: string, message: string } | null>(null);
  const [showNursery, setShowNursery] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null);

  const [gameState, setGameState] = useState<AppState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration safety
        return { 
            ...parsed, 
            gameStarted: false, 
            food: [],
            lastSaveTime: parsed.lastSaveTime || Date.now(),
            xp: parsed.xp || 0,
            level: parsed.level || 1,
            nurseryUnlocked: parsed.nurseryUnlocked || false,
            bait: parsed.bait || 5, // Default bait
            fishes: parsed.fishes.map((f: any) => ({
                ...f,
                stage: f.stage || LifeStage.ADULT,
                genes: f.genes || { colorHex: '#FFA500', rarity: 'common' },
                wanderOffset: Math.random() * 100,
                disease: f.disease || 'none',
                isSick: f.isSick || false,
                location: f.location || 'main'
            })),
            inventory: {
                medicine_general: parsed.inventory?.medicine || 0,
                medicine_ich: parsed.inventory?.medicine_ich || 0,
                medicine_fungus: parsed.inventory?.medicine_fungus || 0,
            },
            tankLevel: parsed.tankLevel || 1,
            tankCapacity: parsed.tankCapacity || 20,
            activeWallpaper: parsed.activeWallpaper || 'default',
            ownedWallpapers: parsed.ownedWallpapers || ['default']
        };
      } catch (e) { console.error("Save load failed", e); }
    }
    return {
      gameStarted: false,
      lastSaveTime: Date.now(),
      money: INITIAL_MONEY,
      gems: INITIAL_GEMS,
      xp: 0,
      level: 1,
      bait: 5,
      nurseryUnlocked: false,
      waterParams: {
        temperature: 20, 
        ammonia: 0,
        oxygen: 85,
        ph: 7.0
      },
      equipment: {
        filterLevel: 1,
        heater: false,
        airStone: false,
        lightLevel: 1,
        co2System: false
      },
      inventory: { medicine_general: 0, medicine_ich: 0, medicine_fungus: 0 },
      lightOn: true,
      fishes: [],
      decorations: [],
      plants: [],
      food: [],
      tasks: generateTasks(1),
      algaeLevel: 0,
      tankLevel: 1,
      tankCapacity: 20,
      activeWallpaper: 'default',
      ownedWallpapers: ['default']
    };
  });

  const requestRef = useRef<number>(0);

  // --- XP & Level System ---
  const addXp = (amount: number) => {
      setGameState(prev => {
          const nextXp = prev.xp + amount;
          const xpNeeded = prev.level * 100;
          if (nextXp >= xpNeeded) {
              audioManager.playChime();
              setShowLevelUp(prev.level + 1);
              // Level Up logic
              const nextLevel = prev.level + 1;
              const newTasks = generateTasks(nextLevel);
              const unlockNursery = nextLevel === 3;
              
              return {
                  ...prev,
                  xp: nextXp - xpNeeded,
                  level: nextLevel,
                  nurseryUnlocked: prev.nurseryUnlocked || unlockNursery,
                  gems: prev.gems + 2, // Level up reward
                  tasks: [...prev.tasks, ...newTasks]
              };
          }
          return { ...prev, xp: nextXp };
      });
  };

  // --- Initial Offline Calculation ---
  useEffect(() => {
    if (phase === GamePhase.INTRO && gameState.lastSaveTime) {
      const now = Date.now();
      const diffMs = now - gameState.lastSaveTime;
      const diffSeconds = diffMs / 1000;
      
      // If away for more than 5 minutes
      if (diffSeconds > 300) {
         setGameState(prev => {
           let { algaeLevel, waterParams } = prev;
           let plants = [...prev.plants];
           let fishes = prev.fishes.map(f => ({ ...f }));
           let message = [];

           // Simulate Algae Growth
           if (prev.lightOn) {
             const algaeGrowth = Math.min(50, diffSeconds * 0.005);
             algaeLevel = Math.min(100, algaeLevel + algaeGrowth);
             if (algaeGrowth > 10) message.push(`Yosun arttı (%${algaeGrowth.toFixed(0)})`);
           }

           // Simulate Fish Status (Hunger increase, but clamp it)
           let sickCount = 0;
           fishes.forEach(f => {
              if (f.stage !== LifeStage.EGG) {
                f.hunger = Math.max(0, f.hunger - (diffSeconds * 0.01));
                // Offline disease check based on water quality
                // Sickness chance reduced for offline calculation too
                if (waterParams.ammonia > 0.8 && Math.random() < 0.1) {
                    f.disease = 'ich';
                    f.isSick = true;
                }
                if (f.isSick) sickCount++;
              }
           });
           if (sickCount > 0) message.push(`${sickCount} balık hastalandı veya acıktı.`);

           // Plant Growth
           plants.forEach(p => {
             p.growth = Math.min(1.5, p.growth + (diffSeconds * 0.0001));
           });

           // Water params
           waterParams.ammonia = Math.min(2.0, waterParams.ammonia + (diffSeconds * 0.0005));

           const timeString = diffSeconds > 3600 
                ? `${(diffSeconds/3600).toFixed(1)} saat` 
                : `${(diffSeconds/60).toFixed(0)} dakika`;

           if (message.length > 0) {
             setOfflineReport({
               time: timeString,
               message: message.join('\n')
             });
           }

           return {
             ...prev,
             algaeLevel,
             waterParams,
             plants,
             fishes,
             lastSaveTime: now
           };
         });
      }
    }
  }, []);

  const handleDimensions = useCallback((w: number, h: number) => {
    setTankSize({ w, h });
  }, []);

  const toggleLight = () => {
    setGameState(prev => ({ ...prev, lightOn: !prev.lightOn }));
    audioManager.playChime();
  };

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    audioManager.toggleMute(newVal);
  };

  const saveGame = () => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      audioManager.playChime();
      alert("Oyun Kaydedildi!");
  };

  const resetGame = () => {
      if (confirm("Tüm ilerlemeniz silinecek. Emin misiniz?")) {
          localStorage.removeItem(SAVE_KEY);
          window.location.reload();
      }
  };

  // --- Physics Engine ---
  const updatePhysics = useCallback(() => {
    if (phase !== GamePhase.PLAYING) return;

    setGameState(prev => {
      const now = Date.now();
      const currentLocation = showNursery ? 'nursery' : 'main';
      const visibleFishes = prev.fishes.filter(f => f.location === currentLocation);
      
      const fishCount = visibleFishes.length;
      let { temperature, ammonia, oxygen, ph } = prev.waterParams;
      let { algaeLevel } = prev;
      let money = prev.money;
      // We process ALL fishes, but physics only matters for active tank mostly (simplified: all physics run)
      let fishes = prev.fishes.map(f => ({ ...f }));
      let plants = [...prev.plants];
      
      // --- Water Chemistry ---
      const targetTemp = prev.equipment.heater ? 25 : 18;
      if (temperature < targetTemp) temperature += 0.02; else if (temperature > targetTemp) temperature -= 0.01;
      
      const wasteLoad = (prev.fishes.length * 0.0005) + (prev.food.length * 0.002);
      let filterEfficiency = [0.01, 0.03, 0.08][prev.equipment.filterLevel - 1] || 0.01;
      ammonia = Math.max(0, ammonia + wasteLoad - filterEfficiency - (plants.length * 0.002));
      
      oxygen = Math.min(100, Math.max(0, oxygen - (prev.fishes.length * 0.02) + 0.05 + (prev.equipment.airStone ? 0.15 : 0)));
      
      if (prev.lightOn) {
          algaeLevel = Math.min(100, algaeLevel + (prev.equipment.lightLevel * 0.005) + (ammonia * 0.05));
          plants.forEach(p => p.growth = Math.min(1.5, p.growth + 0.0005));
      }

      // --- Fish AI Loop ---
      const survivingFood = [...prev.food];
      const predators = fishes.filter(f => f.location === currentLocation && ['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'marine_odd', 'shark', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(f.type) && f.stage !== LifeStage.EGG);

      fishes = fishes.map(fish => {
          fish.age += 1;

          // EGG LOGIC
          if (fish.stage === LifeStage.EGG) {
              if (fish.age > 1000) { // Hatch time
                  fish.stage = LifeStage.FRY;
                  fish.size = 0.2;
                  fish.velocity = { x: (Math.random() - 0.5), y: -0.5 };
                  // Auto-move to nursery if unlocked? optional
              }
              // Eggs sink
              if (fish.position.y < tankSize.h - 20) fish.position.y += 0.2;
              return fish;
          }

          // FRY GROWTH
          if (fish.stage === LifeStage.FRY) {
              if (fish.size < 0.6) fish.size += 0.0002;
              else fish.stage = LifeStage.ADULT;
          }

          // Health & Disease Logic
          let stressFactor = 0;
          if (ammonia > 0.5) { stressFactor += 1; fish.health -= 0.05; }
          if (fish.hunger <= 0) { fish.health -= 0.1; }
          fish.stress = Math.min(100, Math.max(0, fish.stress + (stressFactor * 0.1) - 0.05));
          fish.hunger = Math.max(0, fish.hunger - 0.03);

          // Random Disease Chance
          // REDUCED PROBABILITY: Was 0.0001 (1/10000), now 0.00002 (1/50000)
          if (fish.disease === 'none' && Math.random() < 0.00002) { 
              if (temperature < 22) fish.disease = 'ich'; // Cold causes Ich
              else if (ammonia > 0.8) fish.disease = 'fungus'; // Dirty causes Fungus
              else if (fish.stress > 80) fish.disease = 'parasite'; // Stress causes Parasites
              
              if (fish.disease !== 'none') fish.isSick = true;
          }
          if (fish.isSick) fish.health -= 0.05;

          // MOVEMENT VECTORS
          const speedMod = (fish.isSick || temperature < 20) ? 0.5 : 1.0;
          let ax = 0, ay = 0;

          // 1. WANDER
          fish.wanderOffset += 0.01;
          ax += Math.sin(fish.wanderOffset) * 0.05;
          ay += Math.cos(fish.wanderOffset * 1.3) * 0.05;

          // 2. FLEE
          if (!['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(fish.type)) {
              predators.forEach(predator => {
                  const dx = predator.position.x - fish.position.x;
                  const dy = predator.position.y - fish.position.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 150) {
                      ax -= (dx / dist) * 0.3;
                      ay -= (dy / dist) * 0.3;
                      fish.stress += 0.1;
                  }
              });
          }

          // 3. FLOCKING
          if (['neon', 'guppy', 'cardinal_tetra', 'ember_tetra', 'rasbora', 'anthias', 'hamsi', 'capelin', 'sardine', 'neon_rainbowfish', 'zebra_danio'].includes(fish.type)) {
               fishes.filter(o => o.location === fish.location).forEach(other => {
                  if (other.id !== fish.id && other.type === fish.type) {
                      const dx = other.position.x - fish.position.x;
                      const dy = other.position.y - fish.position.y;
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      if (dist < 80) {
                          ax += (other.velocity.x - fish.velocity.x) * 0.02; // Alignment
                          ay += (other.velocity.y - fish.velocity.y) * 0.02;
                          if (dist < 30) { // Separation
                              ax -= (dx / dist) * 0.1;
                              ay -= (dy / dist) * 0.1;
                          }
                      }
                  }
               });
          }

          // 4. FOOD SEEKING
          let closestFood = null;
          let minFoodDist = 300;
          prev.food.filter(f => f.tankId === fish.location).forEach(f => {
              const dx = f.position.x - fish.position.x;
              const dy = f.position.y - fish.position.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < minFoodDist && f.active) {
                  minFoodDist = dist;
                  closestFood = f;
              }
          });
          if (closestFood) {
              const dx = closestFood.position.x - fish.position.x;
              const dy = closestFood.position.y - fish.position.y;
              ax += (dx / minFoodDist) * 0.2;
              ay += (dy / minFoodDist) * 0.2;
          }

          fish.velocity.x += ax * speedMod;
          fish.velocity.y += ay * speedMod;

          // Boundaries
          const pad = 50;
          if (fish.position.x < pad) fish.velocity.x += 0.5;
          if (fish.position.x > tankSize.w - pad) fish.velocity.x -= 0.5;
          if (fish.position.y < pad) fish.velocity.y += 0.5;
          if (fish.position.y > tankSize.h - pad) fish.velocity.y -= 0.5;
          
          // Drag
          fish.velocity.x *= 0.98;
          fish.velocity.y *= 0.98;

          fish.position.x += fish.velocity.x;
          fish.position.y += fish.velocity.y;

          // Breeding Readiness
          if (fish.stage === LifeStage.ADULT && !fish.isSick && fish.hunger > 80) {
              fish.reproductiveProgress += 0.05;
          }

          return fish;
      }).filter(f => f.health > 0);

      // --- Collisions (Eating & Breeding) ---
      const foodToRemove = new Set<string>();
      const fishToRemove = new Set<string>();
      const newEggs: FishState[] = [];
      let xpGained = 0;

      fishes.forEach(fish => {
          // Eating Food
          survivingFood.filter(f => f.tankId === fish.location).forEach(f => {
             if (foodToRemove.has(f.id)) return;
             const dist = Math.hypot(f.position.x - fish.position.x, f.position.y - fish.position.y);
             if (dist < 30 * fish.size && fish.stage !== LifeStage.EGG) {
                 fish.hunger = Math.min(100, fish.hunger + 30);
                 foodToRemove.add(f.id);
                 audioManager.playBubble();
                 xpGained += 1;
             }
          });

          // PREDATOR EATING FISH
          if (['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'lionfish', 'moray_eel', 'great_white_shark', 'tiger_shark', 'bull_shark', 'clown_triggerfish'].includes(fish.type) && fish.size > 0.8) {
              fishes.filter(o => o.location === fish.location).forEach(prey => {
                  if (prey.id === fish.id) return;
                  if (fishToRemove.has(prey.id)) return;
                  if (['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'lionfish', 'moray_eel', 'great_white_shark', 'tiger_shark', 'bull_shark', 'clown_triggerfish'].includes(prey.type)) return;

                  const dist = Math.hypot(prey.position.x - fish.position.x, prey.position.y - fish.position.y);
                  if (dist < 40 && prey.size < fish.size * 0.5) {
                      fishToRemove.add(prey.id);
                      fish.hunger = 100;
                      audioManager.playBubble(); 
                  }
              });
          }

          // Breeding Check
          if (fish.reproductiveProgress >= 100 && fish.gender === 'F') {
              const mate = fishes.find(m => 
                  m.id !== fish.id && 
                  m.type === fish.type && 
                  m.gender === 'M' && 
                  m.location === fish.location &&
                  m.reproductiveProgress >= 100 &&
                  Math.hypot(m.position.x - fish.position.x, m.position.y - fish.position.y) < 50
              );
              
              if (mate) {
                  fish.reproductiveProgress = 0;
                  mate.reproductiveProgress = 0;
                  fish.thoughts = "❤️";
                  newEggs.push(spawnEgg(fish, mate, tankSize.h));
                  audioManager.playChime();
                  xpGained += 50;
              }
          }
      });

      // Handle Task Updates (Breeding)
      if (newEggs.length > 0) {
          prev.tasks = prev.tasks.map(t => {
              if (t.type === 'breed') return { ...t, current: t.current + newEggs.length, completed: true };
              return t;
          });
      }

      const finalFishes = [...fishes.filter(f => !fishToRemove.has(f.id)), ...newEggs];
      const finalFood = survivingFood.filter(f => !foodToRemove.has(f.id)).filter(f => {
           if (now - parseInt(f.id, 36) > 20000) return false;
           return true;
      });

      // XP Gain
      if (xpGained > 0) {
          addXp(xpGained);
      }

      return {
          ...prev,
          money,
          waterParams: { temperature, ammonia, oxygen, ph },
          fishes: finalFishes,
          plants: plants,
          food: finalFood,
          algaeLevel: algaeLevel,
          lastSaveTime: now 
      };
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [phase, tankSize, showNursery]); 

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics]);

  // Save State
  useEffect(() => {
      const timer = setInterval(() => {
          if (phase === GamePhase.PLAYING) {
              localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
          }
      }, 5000);
      return () => clearInterval(timer);
  }, [gameState, phase]);

  const startGame = () => {
      audioManager.startAmbience();
      audioManager.startMusic();
      setPhase(GamePhase.PLAYING);
      if (gameState.fishes.length === 0) {
           setGameState(p => ({ ...p, fishes: [
               spawnFish('goldfish', 'M', '#FFA500', false, tankSize.w, tankSize.h), 
               spawnFish('goldfish', 'F', '#FF8C00', false, tankSize.w, tankSize.h)
           ] }));
      }
  };

  // --- Interactions ---

  const handleTankClick = (x: number, y: number, target?: any) => {
      if (sellMode) {
          const closestFish = gameState.fishes.find(f => {
              if (f.location !== (showNursery ? 'nursery' : 'main')) return false;
              const dx = f.position.x - x;
              const dy = f.position.y - y;
              return Math.sqrt(dx*dx + dy*dy) < 40 * f.size;
          });
          if (closestFish) sellFish(closestFish.id);
          return;
      }
      
      if (gameState.money < 1) return;
      setGameState(prev => ({
          ...prev,
          money: prev.money - 1,
          food: [...prev.food, { id: Math.random().toString(36).substr(2, 9), position: { x, y }, active: true, tankId: showNursery ? 'nursery' : 'main' }],
          tasks: prev.tasks.map(t => t.type === 'feed' ? { ...t, current: Math.min(t.current + 1, t.target) } : t)
      }));
  };

  const sellFish = (fishId: string) => {
      const fish = gameState.fishes.find(f => f.id === fishId);
      if (!fish || fish.stage === LifeStage.EGG) return; 

      let value = 20;
      if (['goldfish', 'platy', 'molly'].includes(fish.type)) value = 30;
      if (['discus', 'arapaima', 'arowana'].includes(fish.type)) value = 150;
      if (['blue_tang', 'clownfish', 'lionfish', 'seahorse'].includes(fish.type)) value = 200;
      if (['great_white_shark', 'tiger_shark', 'bull_shark', 'mola_mola'].includes(fish.type)) value = 500;
      
      value *= fish.size; 
      if (fish.isSick) value *= 0.2;
      value = Math.floor(value);

      audioManager.playChime();
      setGameState(prev => ({
          ...prev,
          money: prev.money + value,
          fishes: prev.fishes.filter(f => f.id !== fishId)
      }));
  };

  const handleWaterChange = () => {
    audioManager.playBubble();
    addXp(15);
    setGameState(prev => ({
        ...prev,
        waterParams: {
            ...prev.waterParams,
            ammonia: Math.max(0, prev.waterParams.ammonia - 0.5),
            oxygen: 90,
            temperature: (prev.waterParams.temperature * 0.7) + (20 * 0.3)
        },
        tasks: prev.tasks.map(t => t.type === 'clean' ? { ...t, current: 1 } : t)
    }));
  };

  const handleScrubAlgae = () => {
      if (gameState.algaeLevel <= 0) return;
      audioManager.playBubble();
      addXp(5);
      setGameState(prev => ({
          ...prev,
          algaeLevel: Math.max(0, prev.algaeLevel - 20),
      }));
  };

  const handleTreatFish = () => {
      // Prioritize specific meds if fish have specific disease
      // This is a simplified interaction: Clicking treats all appropriate
      const sickFishes = gameState.fishes.filter(f => f.isSick && f.location === (showNursery ? 'nursery' : 'main'));
      
      if (sickFishes.length === 0) return;

      setGameState(prev => {
          let inv = { ...prev.inventory };
          let treatedFishes = prev.fishes.map(f => ({...f}));
          let playedSound = false;

          treatedFishes = treatedFishes.map(f => {
               if (f.location !== (showNursery ? 'nursery' : 'main')) return f;
               
               if (f.disease === 'ich' && inv.medicine_ich > 0) {
                   inv.medicine_ich--;
                   f.disease = 'none';
                   f.isSick = false;
                   f.health = 100;
                   playedSound = true;
               } else if (f.disease === 'fungus' && inv.medicine_fungus > 0) {
                   inv.medicine_fungus--;
                   f.disease = 'none';
                   f.isSick = false;
                   f.health = 100;
                   playedSound = true;
               } else if (f.isSick && inv.medicine_general > 0) {
                   // General cure / Parasite / Stress
                   inv.medicine_general--;
                   f.disease = 'none';
                   f.isSick = false;
                   f.health = 100;
                   playedSound = true;
               }
               return f;
          });

          if (playedSound) audioManager.playChime();
          
          return {
              ...prev,
              inventory: inv,
              fishes: treatedFishes
          };
      });
  };

  const moveFryToNursery = () => {
      if (!gameState.nurseryUnlocked) return;
      setGameState(prev => ({
          ...prev,
          fishes: prev.fishes.map(f => {
              if (f.stage === LifeStage.FRY || f.stage === LifeStage.EGG) {
                  return { ...f, location: 'nursery' };
              }
              return f;
          })
      }));
  };

  const buyItem = (item: any) => {
      const currency = item.currency === 'gem' ? gameState.gems : gameState.money;
      if (currency < item.price) return;

      // Handle "Already owned" for wallpapers
      if (item.type === 'wallpaper' && gameState.ownedWallpapers.includes(item.visual)) {
           setGameState(prev => ({ ...prev, activeWallpaper: item.visual }));
           return;
      }

      audioManager.playChime();
      addXp(10);
      setGameState(prev => {
          const next = { ...prev };
          if (item.currency === 'gem') next.gems -= item.price;
          else next.money -= item.price;

          if (item.type === 'fish') {
              next.fishes = [...next.fishes, spawnFish(item.species, item.gender, item.color, false, tankSize.w, tankSize.h)];
          } else if (item.type === 'plant') {
              next.plants = [...next.plants, { id: Math.random().toString(), type: item.visual, x: Math.random() * (tankSize.w - 50) + 25, growth: 0.5, health: 100 }];
          } else if (item.type === 'decoration') {
              next.decorations = [...next.decorations, { id: Math.random().toString(), type: item.visual, x: Math.random() * (tankSize.w - 100) + 50, scale: 1.0 }];
          } else if (item.type === 'equipment') {
              if (item.subtype === 'filter') next.equipment.filterLevel = item.level;
              if (item.subtype === 'light') next.equipment.lightLevel = item.level;
              if (item.subtype === 'heater') next.equipment.heater = true;
              if (item.subtype === 'airstone') next.equipment.airStone = true;
              if (item.subtype === 'co2') next.equipment.co2System = true;
              if (item.subtype === 'tank') {
                  next.tankCapacity = item.size;
                  next.tankLevel = (next.tankLevel || 1) + 1;
              }
          } else if (item.type === 'supply') {
              if (item.visual === 'medicine_general') next.inventory.medicine_general += 1;
              if (item.visual === 'medicine_ich') next.inventory.medicine_ich += 1;
              if (item.visual === 'medicine_fungus') next.inventory.medicine_fungus += 1;
              if (item.visual === 'bait') next.bait = (next.bait || 0) + 5;
          } else if (item.type === 'wallpaper') {
              next.ownedWallpapers = [...next.ownedWallpapers, item.visual];
              next.activeWallpaper = item.visual;
          }
          return next;
      });
  };

  const handleFishCaught = (fishInfo: SpeciesInfo | null, sellPrice: number) => {
      setGameState(prev => {
          const next = { ...prev };
          next.bait = Math.max(0, next.bait - 1); // Consume bait
          next.money += sellPrice;
          
          if (fishInfo && sellPrice === 0) {
              // Keep fish
              next.fishes = [...next.fishes, spawnFish(fishInfo.species, fishInfo.gender, fishInfo.color, false, tankSize.w, tankSize.h)];
          }
          return next;
      });
  };

  const triggerThought = async () => {
      if (gameState.fishes.length === 0) return;
      const visibleFishes = gameState.fishes.filter(f => f.location === (showNursery ? 'nursery' : 'main'));
      if (visibleFishes.length === 0) return;

      const fishIndex = Math.floor(Math.random() * visibleFishes.length);
      const fish = visibleFishes[fishIndex];
      // Do not generate thoughts for eggs
      if (fish.stage === LifeStage.EGG) return;
      
      const thought = await getFishThoughts(fish, gameState.lightOn, gameState.waterParams);
      setGameState(prev => {
          const newFishes = prev.fishes.map(f => {
              if (f.id === fish.id) return { ...f, thoughts: thought };
              return f;
          });
          return { ...prev, fishes: newFishes };
      });
      setTimeout(() => {
        setGameState(prev => {
            const newFishes = prev.fishes.map(f => {
                if (f.id === fish.id) return { ...f, thoughts: '' };
                return f;
            });
            return { ...prev, fishes: newFishes };
        });
      }, 5000);
  };

  const collectReward = (id: string) => {
      audioManager.playChime();
      setGameState(prev => {
          const t = prev.tasks.find(x => x.id === id);
          if (!t) return prev;
          return {
              ...prev,
              money: prev.money + t.reward,
              gems: prev.gems + (t.gemReward || 0),
              xp: prev.xp + t.xpReward,
              tasks: prev.tasks.filter(x => x.id !== id)
          };
      });
      addXp(0); 
  };

  // --- RENDER PHASES ---

  if (phase === GamePhase.SHOWROOM) {
      return (
          <Showroom 
              onBack={() => {
                  setPhase(GamePhase.PLAYING);
                  setShopOpen(true); // Re-open shop on return
              }}
              items={SPECIES_DB}
              onBuy={buyItem}
              money={gameState.money}
              gems={gameState.gems}
              playerLevel={gameState.level}
              tankCapacity={gameState.tankCapacity}
          />
      );
  }

  if (phase === GamePhase.FISHING) {
      return (
          <FishingGame 
              onBack={() => setPhase(GamePhase.PLAYING)}
              onFishCaught={handleFishCaught}
              baitCount={gameState.bait || 0}
              onBuyBait={() => {
                  if (gameState.money >= 50) {
                      buyItem({ price: 50, currency: 'coin', type: 'supply', visual: 'bait' });
                  } else {
                      alert("Yetersiz bakiye!");
                  }
              }}
          />
      );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-2 font-sans overflow-hidden">
      
      {phase === GamePhase.INTRO && (
        <IntroSequence onComplete={startGame} />
      )}

      {/* Level Up Modal */}
      {showLevelUp && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur">
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-900 p-8 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_gold] text-center transform animate-bounce">
                  <Trophy size={64} className="mx-auto text-yellow-200 mb-4" />
                  <h2 className="text-4xl font-bold text-white mb-2">SEVİYE {showLevelUp}!</h2>
                  <p className="text-yellow-100 text-lg mb-6">Yeni balıklar ve özellikler açıldı!</p>
                  <div className="flex justify-center gap-4">
                      <div className="bg-black/40 px-4 py-2 rounded flex items-center gap-2 text-purple-300">
                          <Diamond size={20} /> +2 Elmas
                      </div>
                  </div>
                  <button onClick={() => setShowLevelUp(null)} className="mt-6 bg-white text-yellow-900 font-bold px-8 py-3 rounded-full hover:scale-110 transition-transform">
                      HARİKA!
                  </button>
              </div>
          </div>
      )}

      {/* Offline Report Modal */}
      {offlineReport && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="bg-gray-800 p-6 rounded-2xl max-w-md w-full border border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <h2 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Clock /> Hoşgeldin!
            </h2>
            <p className="text-gray-300 mb-4">
              Sen yokken <span className="font-mono text-white">{offlineReport.time}</span> geçti.
            </p>
            <div className="bg-black/50 p-4 rounded-lg mb-4 text-sm text-gray-400 whitespace-pre-wrap font-mono">
              {offlineReport.message}
            </div>
            <button 
              onClick={() => setOfflineReport(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {phase === GamePhase.PLAYING && (
          <div className="relative w-full max-w-6xl h-[85vh] flex flex-col gap-4">
              
              {/* Header / HUD */}
              <div className="flex justify-between items-center bg-gray-900/80 p-3 rounded-2xl backdrop-blur-sm border border-gray-800 shadow-xl z-50">
                   {/* Level & XP */}
                   <div className="flex items-center gap-3">
                       <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full border-2 border-yellow-300 shadow-lg">
                           <span className="font-bold text-white text-xl">{gameState.level}</span>
                           <div className="absolute -bottom-1 bg-gray-900 px-1 rounded text-[8px] text-gray-400 uppercase">LVL</div>
                       </div>
                       <div className="flex flex-col gap-1 w-24 md:w-32">
                           <div className="flex justify-between text-[10px] text-gray-400">
                               <span>XP</span>
                               <span>{gameState.xp}/{gameState.level * 100}</span>
                           </div>
                           <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                               <div className="h-full bg-yellow-500" style={{ width: `${(gameState.xp / (gameState.level * 100)) * 100}%` }}></div>
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center gap-4">
                       <div className="bg-black/50 px-3 py-1 rounded-full flex items-center gap-2 border border-gray-700">
                           <Coins className="text-yellow-400" size={16} />
                           <span className="font-bold text-yellow-100">{gameState.money}</span>
                       </div>
                       <div className="bg-black/50 px-3 py-1 rounded-full flex items-center gap-2 border border-gray-700">
                           <Diamond className="text-purple-400" size={16} />
                           <span className="font-bold text-purple-100">{gameState.gems}</span>
                       </div>
                   </div>

                   <div className="flex gap-2">
                       {/* Save / Reset */}
                       <button onClick={saveGame} className="p-2 bg-gray-800 rounded-full text-green-400 hover:text-white transition-colors" title="Kaydet">
                           <Save size={18} />
                       </button>
                       <button onClick={resetGame} className="p-2 bg-gray-800 rounded-full text-red-400 hover:text-white transition-colors" title="Sıfırla">
                           <RotateCcw size={18} />
                       </button>

                       {/* Nursery Toggle */}
                       {gameState.nurseryUnlocked && (
                           <button 
                               onClick={() => setShowNursery(!showNursery)}
                               className={`p-2 rounded-full transition-colors ${showNursery ? 'bg-pink-600 text-white animate-pulse' : 'bg-gray-800 text-pink-400'}`}
                               title="Yavru Tankı"
                           >
                               <Baby size={18} />
                           </button>
                       )}

                       <button onClick={toggleMute} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                           {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                       </button>
                       <button 
                          onClick={() => setShopOpen(true)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white font-bold shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
                        >
                           <ShoppingBag size={18} /> Dükkan
                       </button>
                   </div>
              </div>

              {/* Main Game Area */}
              <div className="flex-1 relative flex gap-4">
                  
                  {/* Left Panel: Status */}
                  <div className="w-16 md:w-20 flex flex-col gap-3 bg-gray-900/50 rounded-2xl p-2 items-center backdrop-blur-sm border border-gray-800">
                       <div className="group relative">
                           <div className={`p-2 rounded-xl ${gameState.waterParams.temperature < 22 ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                               <Thermometer size={20} />
                           </div>
                           <div className="absolute left-full ml-2 bg-black px-2 py-1 rounded text-xs whitespace-nowrap hidden group-hover:block z-50">
                               {gameState.waterParams.temperature.toFixed(1)}°C
                           </div>
                       </div>
                       
                       <div className="group relative">
                           <div className={`p-2 rounded-xl ${gameState.waterParams.ammonia > 0.5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-green-500/20 text-green-400'}`}>
                               <FlaskConical size={20} />
                           </div>
                           <div className="absolute left-full ml-2 bg-black px-2 py-1 rounded text-xs whitespace-nowrap hidden group-hover:block z-50">
                               Amonyak: {gameState.waterParams.ammonia.toFixed(2)}
                           </div>
                       </div>

                       <div className="group relative">
                           <div className={`p-2 rounded-xl ${gameState.waterParams.oxygen < 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                               <Wind size={20} />
                           </div>
                           <div className="absolute left-full ml-2 bg-black px-2 py-1 rounded text-xs whitespace-nowrap hidden group-hover:block z-50">
                               O2: {gameState.waterParams.oxygen.toFixed(0)}%
                           </div>
                       </div>
                       
                       {/* Action Buttons */}
                       <div className="mt-auto flex flex-col gap-2">
                           <button onClick={handleWaterChange} className="p-2 bg-blue-600/30 hover:bg-blue-600 rounded-xl text-blue-200 transition-colors tooltip" title="Su Değişimi">
                               <Droplets size={20} />
                           </button>
                           <button onClick={handleScrubAlgae} className={`p-2 rounded-xl transition-colors ${gameState.algaeLevel > 10 ? 'bg-green-600/50 hover:bg-green-600 text-green-100' : 'bg-gray-800 text-gray-600'}`}>
                               <Eraser size={20} />
                           </button>
                           
                           {/* Treat Fish Button with Badge */}
                           <div className="relative">
                               <button onClick={handleTreatFish} className={`p-2 rounded-xl transition-colors ${(gameState.inventory.medicine_general + gameState.inventory.medicine_ich + gameState.inventory.medicine_fungus) > 0 ? 'bg-red-500/30 hover:bg-red-500 text-red-200' : 'bg-gray-800 text-gray-600'}`}>
                                   <Pill size={20} />
                               </button>
                               <span className="absolute -top-1 -right-1 text-[8px] bg-white text-black px-1 rounded-full font-bold">
                                   {gameState.inventory.medicine_general + gameState.inventory.medicine_ich + gameState.inventory.medicine_fungus}
                               </span>
                           </div>
                           
                           {/* SELL MODE TOGGLE */}
                           <button 
                              onClick={() => setSellMode(!sellMode)}
                              className={`p-2 rounded-xl transition-colors ${sellMode ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-green-400 hover:bg-green-900/30'}`}
                           >
                               <DollarSign size={20} />
                           </button>
                       </div>
                  </div>

                  {/* AQUARIUM VIEW */}
                  <div className="flex-1 relative">
                       {/* Nursery Header Overlay */}
                       {showNursery && (
                           <div className="absolute top-0 left-0 right-0 bg-pink-500/20 text-pink-200 text-center py-1 text-xs uppercase tracking-widest font-bold z-40 backdrop-blur-sm rounded-t-2xl">
                               Yavru Tankı (Kuluçkahane)
                           </div>
                       )}

                       <div className={showNursery ? 'border-4 border-pink-400 rounded-2xl h-full' : 'h-full'}>
                           <Aquarium 
                              state={{...gameState, fishes: gameState.fishes.filter(f => f.location === (showNursery ? 'nursery' : 'main'))}}
                              onDimensionsChange={handleDimensions}
                              onFeed={handleTankClick}
                              onClean={handleWaterChange}
                              toggleLight={toggleLight}
                              sellMode={sellMode}
                           />
                       </div>
                       
                       {/* AI Thought Button */}
                       <button 
                          onClick={triggerThought}
                          className="absolute bottom-4 left-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 shadow-lg transition-all active:scale-95"
                       >
                           <Activity size={24} />
                       </button>

                       {/* Move Fry Button (Only in Main view if Nursery exists) */}
                       {!showNursery && gameState.nurseryUnlocked && (
                           <button 
                               onClick={moveFryToNursery}
                               className="absolute bottom-4 left-20 px-3 py-2 bg-pink-600/80 hover:bg-pink-500 rounded-lg text-white text-xs font-bold shadow-lg"
                           >
                               Yavruları Taşı
                           </button>
                       )}
                  </div>

                  {/* Right Panel: Tasks */}
                  <div className="hidden md:flex w-48 flex-col gap-2 bg-gray-900/50 rounded-2xl p-3 border border-gray-800">
                      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Günlük Görevler</h3>
                      {gameState.tasks.map(task => (
                          <div key={task.id} className="bg-black/40 p-2 rounded-lg border border-gray-700 text-sm">
                              <p className="text-gray-300 text-xs mb-1">{task.description}</p>
                              <div className="w-full h-1 bg-gray-700 rounded-full mb-1">
                                  <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(task.current / task.target) * 100}%` }}></div>
                              </div>
                              {task.current >= task.target ? (
                                  <button onClick={() => collectReward(task.id)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-1 rounded animate-pulse">
                                      Ödülü Al
                                  </button>
                              ) : (
                                  <div className="flex justify-between text-[10px] text-gray-500">
                                      <span>{task.current}/{task.target}</span>
                                      <div className="flex gap-1">
                                          <span className="text-blue-400">+{task.xpReward}XP</span>
                                          <span className="text-yellow-500">+{task.reward}₺</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                      {gameState.tasks.length === 0 && (
                          <div className="text-center text-gray-500 text-xs italic">Tüm görevler bitti! Seviye atlayarak yenilerini aç.</div>
                      )}
                      
                      {/* FISHING GAME BUTTON */}
                      <button 
                        onClick={() => setPhase(GamePhase.FISHING)}
                        className="mt-4 w-full bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl border border-blue-500/30 flex flex-col items-center justify-center gap-1 shadow-lg transition-transform active:scale-95 group"
                      >
                         <div className="text-2xl group-hover:-translate-y-1 transition-transform">🎣</div>
                         <span className="text-sm">Balık Tut</span>
                         <span className="text-[10px] text-blue-200 font-normal">Göl Kenarı &gt;</span>
                      </button>
                  </div>

              </div>
          </div>
      )}

      {/* SHOP 3D OVERLAY */}
      {shopOpen && phase === GamePhase.PLAYING && (
          <Shop3D 
              onClose={() => setShopOpen(false)}
              onGoWholesale={() => {
                  setShopOpen(false);
                  setPhase(GamePhase.SHOWROOM);
              }}
              items={STANDARD_ITEMS}
              onBuy={buyItem}
              money={gameState.money}
              gems={gameState.gems}
          />
      )}

    </div>
  );
};

export default App;
