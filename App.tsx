
import React, { useState, useEffect, useRef, useCallback } from 'react';
import IntroSequence from './components/IntroSequence';
import Aquarium from './components/Aquarium';
import Showroom from './components/Showroom';
import { AppState, GamePhase, FishState, Task, FishType, Gender, LifeStage } from './types';
import { Sun, ShoppingBag, Activity, Droplets, Thermometer, Wind, FlaskConical, Pill, Volume2, VolumeX, Eraser, Diamond, Coins, DollarSign, Clock, Car } from 'lucide-react';
import { getFishThoughts } from './services/geminiService';
import { audioManager } from './services/audioService';

// Constants
const INITIAL_MONEY = 150;
const INITIAL_GEMS = 5;

const TASKS: Task[] = [
  { id: 't1', description: 'Balıkları besle (5 kez)', current: 0, target: 5, reward: 50, completed: false },
  { id: 't2', description: 'Su değerlerini dengele', current: 0, target: 1, reward: 100, completed: false },
  { id: 't3', description: 'Yosunları temizle', current: 0, target: 1, reward: 30, gemReward: 1, completed: false },
];

// --- STANDARD SHOP ---
const STANDARD_ITEMS = [
  // Basics
  { id: 'fish_gold_m', name: 'Japon Balığı (E)', price: 80, currency: 'coin', type: 'fish', species: 'goldfish', gender: 'M', color: '#FFA500' },
  { id: 'fish_gold_f', name: 'Japon Balığı (D)', price: 80, currency: 'coin', type: 'fish', species: 'goldfish', gender: 'F', color: '#FF8C00' },
  { id: 'plant_fern', name: 'Java Fern', price: 60, currency: 'coin', type: 'plant', visual: 'fern' },
  { id: 'decor_rock', name: 'Kaya', price: 80, currency: 'coin', type: 'decoration', visual: 'rock' },
  
  // Equipment Upgrades
  { id: 'eq_filter_2', name: 'Şelale Filtre (Lv2)', price: 500, currency: 'coin', type: 'equipment', subtype: 'filter', level: 2 },
  { id: 'eq_filter_3', name: 'Dış Filtre (Lv3)', price: 1200, currency: 'coin', type: 'equipment', subtype: 'filter', level: 3 },
  { id: 'eq_heater', name: 'Isıtıcı', price: 300, currency: 'coin', type: 'equipment', subtype: 'heater' },
  { id: 'eq_airstone', name: 'Hava Taşı', price: 250, currency: 'coin', type: 'equipment', subtype: 'airstone' },
  { id: 'eq_light_2', name: 'LED Işık (Lv2)', price: 400, currency: 'coin', type: 'equipment', subtype: 'light', level: 2 },
  { id: 'eq_light_3', name: 'Full Spektrum (Lv3)', price: 15, currency: 'gem', type: 'equipment', subtype: 'light', level: 3 },
  { id: 'eq_co2', name: 'CO2 Sistemi', price: 25, currency: 'gem', type: 'equipment', subtype: 'co2' },
  { id: 'supply_medicine', name: 'İlaç', price: 50, currency: 'coin', type: 'supply', visual: 'medicine' },
];

// --- WHOLESALE SHOWROOM LIST ---
const WHOLESALE_ITEMS = [
    // --- SMALL PEACEFUL ---
    { id: 'w_guppy', name: 'Guppy (Lepistes)', price: 40, currency: 'coin', type: 'fish', species: 'guppy', gender: 'M', color: '#8A2BE2', category: 'peaceful' },
    { id: 'w_endler', name: 'Endler', price: 45, currency: 'coin', type: 'fish', species: 'endler', gender: 'M', color: '#FF4500', category: 'peaceful' },
    { id: 'w_platy', name: 'Platy', price: 50, currency: 'coin', type: 'fish', species: 'platy', gender: 'F', color: '#FF6347', category: 'peaceful' },
    { id: 'w_molly', name: 'Molly', price: 50, currency: 'coin', type: 'fish', species: 'molly', gender: 'M', color: '#111111', category: 'peaceful' },
    { id: 'w_neon', name: 'Neon Tetra', price: 35, currency: 'coin', type: 'fish', species: 'neon', gender: 'M', color: '#0000CD', category: 'peaceful' },
    { id: 'w_cardinal', name: 'Kardinal Tetra', price: 45, currency: 'coin', type: 'fish', species: 'cardinal_tetra', gender: 'M', color: '#DC143C', category: 'peaceful' },
    { id: 'w_ember', name: 'Ember Tetra', price: 40, currency: 'coin', type: 'fish', species: 'ember_tetra', gender: 'M', color: '#FF8C00', category: 'peaceful' },
    { id: 'w_zebra', name: 'Zebra Danio', price: 30, currency: 'coin', type: 'fish', species: 'zebra_danio', gender: 'M', color: '#E0FFFF', category: 'peaceful' },
    { id: 'w_rasbora', name: 'Rasbora', price: 35, currency: 'coin', type: 'fish', species: 'rasbora', gender: 'M', color: '#FF7F50', category: 'peaceful' },
    { id: 'w_whitecloud', name: 'White Cloud', price: 30, currency: 'coin', type: 'fish', species: 'white_cloud', gender: 'M', color: '#F0F8FF', category: 'peaceful' },

    // --- CICHLIDS ---
    { id: 'w_discus', name: 'Discus', price: 250, currency: 'coin', type: 'fish', species: 'discus', gender: 'M', color: '#20B2AA', category: 'cichlid' },
    { id: 'w_angel', name: 'Melek (Angelfish)', price: 120, currency: 'coin', type: 'fish', species: 'angelfish', gender: 'M', color: '#D3D3D3', category: 'cichlid' },
    { id: 'w_oscar', name: 'Oscar', price: 180, currency: 'coin', type: 'fish', species: 'oscar', gender: 'M', color: '#8B4513', category: 'cichlid' },
    { id: 'w_ramirezi', name: 'Ramirezi', price: 150, currency: 'coin', type: 'fish', species: 'ramirezi', gender: 'M', color: '#FFD700', category: 'cichlid' },
    { id: 'w_malawi', name: 'Malawi Cichlid', price: 100, currency: 'coin', type: 'fish', species: 'malawi', gender: 'M', color: '#4169E1', category: 'cichlid' },
    { id: 'w_tanganyika', name: 'Tanganyika', price: 110, currency: 'coin', type: 'fish', species: 'tanganyika', gender: 'M', color: '#A9A9A9', category: 'cichlid' },
    { id: 'w_kribensis', name: 'Kribensis', price: 90, currency: 'coin', type: 'fish', species: 'kribensis', gender: 'M', color: '#DB7093', category: 'cichlid' },

    // --- BOTTOM DWELLERS ---
    { id: 'w_cory', name: 'Corydoras', price: 60, currency: 'coin', type: 'fish', species: 'corydoras', gender: 'M', color: '#F5DEB3', category: 'bottom' },
    { id: 'w_pleco', name: 'Vatoz (Pleco)', price: 80, currency: 'coin', type: 'fish', species: 'pleco', gender: 'M', color: '#2F4F4F', category: 'bottom' },
    { id: 'w_oto', name: 'Otocinclus', price: 70, currency: 'coin', type: 'fish', species: 'otocinclus', gender: 'M', color: '#708090', category: 'bottom' },
    { id: 'w_loach', name: 'Kuhli Loach', price: 65, currency: 'coin', type: 'fish', species: 'loach', gender: 'M', color: '#FFA07A', category: 'bottom' },
    { id: 'w_catfish', name: 'Yayın Balığı', price: 200, currency: 'coin', type: 'fish', species: 'catfish', gender: 'M', color: '#000000', category: 'bottom' },

    // --- PREDATORS ---
    { id: 'w_piranha', name: 'Piranha', price: 20, currency: 'gem', type: 'fish', species: 'piranha', gender: 'M', color: '#708090', category: 'predator' },
    { id: 'w_arapaima', name: 'Arapaima', price: 50, currency: 'gem', type: 'fish', species: 'arapaima', gender: 'M', color: '#808000', category: 'predator' },
    { id: 'w_arowana', name: 'Arowana', price: 40, currency: 'gem', type: 'fish', species: 'arowana', gender: 'M', color: '#C0C0C0', category: 'predator' },
    { id: 'w_peacock', name: 'Peacock Bass', price: 30, currency: 'gem', type: 'fish', species: 'peacock_bass', gender: 'M', color: '#228B22', category: 'predator' },
    { id: 'w_gar', name: 'Alligator Gar', price: 45, currency: 'gem', type: 'fish', species: 'alligator_gar', gender: 'M', color: '#556B2F', category: 'predator' },

    // --- MARINE REEF ---
    { id: 'w_clown', name: 'Clownfish (Nemo)', price: 200, currency: 'coin', type: 'fish', species: 'clownfish', gender: 'M', color: '#FF4500', category: 'marine_reef' },
    { id: 'w_bluetang', name: 'Blue Tang (Dory)', price: 300, currency: 'coin', type: 'fish', species: 'blue_tang', gender: 'M', color: '#1E90FF', category: 'marine_reef' },
    { id: 'w_yellowtang', name: 'Yellow Tang', price: 280, currency: 'coin', type: 'fish', species: 'yellow_tang', gender: 'M', color: '#FFFF00', category: 'marine_reef' },
    { id: 'w_butterfly', name: 'Butterflyfish', price: 250, currency: 'coin', type: 'fish', species: 'butterflyfish', gender: 'M', color: '#F0E68C', category: 'marine_reef' },
    { id: 'w_marineangel', name: 'İmparator Melek', price: 20, currency: 'gem', type: 'fish', species: 'marine_angelfish', gender: 'M', color: '#4B0082', category: 'marine_reef' },
    { id: 'w_wrasse', name: 'Wrasse', price: 150, currency: 'coin', type: 'fish', species: 'wrasse', gender: 'M', color: '#32CD32', category: 'marine_reef' },
    { id: 'w_goby', name: 'Goby', price: 100, currency: 'coin', type: 'fish', species: 'goby', gender: 'M', color: '#FF69B4', category: 'marine_reef' },
    { id: 'w_firefish', name: 'Firefish', price: 180, currency: 'coin', type: 'fish', species: 'firefish', gender: 'M', color: '#FFD700', category: 'marine_reef' },
    { id: 'w_anthias', name: 'Anthias', price: 160, currency: 'coin', type: 'fish', species: 'anthias', gender: 'M', color: '#FF7F50', category: 'marine_reef' },
    { id: 'w_damsel', name: 'Damsel', price: 80, currency: 'coin', type: 'fish', species: 'damsel', gender: 'M', color: '#00BFFF', category: 'marine_reef' },

    // --- MARINE OCEAN / GIANTS ---
    { id: 'w_tuna', name: 'Bluefin Tuna', price: 50, currency: 'gem', type: 'fish', species: 'tuna', gender: 'M', color: '#000080', category: 'marine_big' },
    { id: 'w_mahi', name: 'Mahi-Mahi', price: 40, currency: 'gem', type: 'fish', species: 'mahi_mahi', gender: 'M', color: '#32CD32', category: 'marine_big' },
    { id: 'w_sword', name: 'Kılıç Balığı', price: 60, currency: 'gem', type: 'fish', species: 'swordfish', gender: 'M', color: '#778899', category: 'marine_big' },
    { id: 'w_marlin', name: 'Blue Marlin', price: 70, currency: 'gem', type: 'fish', species: 'marlin', gender: 'M', color: '#4682B4', category: 'marine_big' },
    { id: 'w_barracuda', name: 'Barracuda', price: 35, currency: 'gem', type: 'fish', species: 'barracuda', gender: 'M', color: '#C0C0C0', category: 'marine_big' },

    // --- MARINE ODD ---
    { id: 'w_lion', name: 'Aslan Balığı (Lionfish)', price: 300, currency: 'coin', type: 'fish', species: 'lionfish', gender: 'M', color: '#8B0000', category: 'marine_odd' },
    { id: 'w_scorpion', name: 'İskorpit', price: 200, currency: 'coin', type: 'fish', species: 'scorpionfish', gender: 'M', color: '#8B4513', category: 'marine_odd' },
    { id: 'w_angler', name: 'Fener Balığı', price: 40, currency: 'gem', type: 'fish', species: 'anglerfish', gender: 'M', color: '#2F4F4F', category: 'marine_odd' },
    { id: 'w_moray', name: 'Müren (Moray Eel)', price: 350, currency: 'coin', type: 'fish', species: 'moray_eel', gender: 'M', color: '#556B2F', category: 'marine_odd' },
    { id: 'w_flounder', name: 'Pisi Balığı', price: 150, currency: 'coin', type: 'fish', species: 'flounder', gender: 'M', color: '#D2B48C', category: 'marine_odd' },

    // --- POLAR / COLD WATER ---
    { id: 'w_halibut', name: 'Halibut', price: 200, currency: 'coin', type: 'fish', species: 'halibut', gender: 'M', color: '#696969', category: 'cold_water' },
    { id: 'w_cod', name: 'Cod (Atlantik Morina)', price: 150, currency: 'coin', type: 'fish', species: 'cod', gender: 'M', color: '#8FBC8F', category: 'cold_water' },
    { id: 'w_haddock', name: 'Mezgit (Haddock)', price: 120, currency: 'coin', type: 'fish', species: 'haddock', gender: 'M', color: '#708090', category: 'cold_water' },
    { id: 'w_arctic_char', name: 'Arctic Char', price: 180, currency: 'coin', type: 'fish', species: 'arctic_char', gender: 'M', color: '#FA8072', category: 'cold_water' },
    { id: 'w_capelin', name: 'Capelin', price: 50, currency: 'coin', type: 'fish', species: 'capelin', gender: 'M', color: '#C0C0C0', category: 'cold_water' },

    // --- BRACKISH WATER ---
    { id: 'w_archer', name: 'Okçu Balığı (Archerfish)', price: 250, currency: 'coin', type: 'fish', species: 'archerfish', gender: 'M', color: '#FFFFF0', category: 'brackish' },
    { id: 'w_mono', name: 'Monodactylus', price: 200, currency: 'coin', type: 'fish', species: 'monodactylus', gender: 'M', color: '#D3D3D3', category: 'brackish' },
    { id: 'w_scat', name: 'Scat', price: 180, currency: 'coin', type: 'fish', species: 'scat', gender: 'M', color: '#BDB76B', category: 'brackish' },
    { id: 'w_mudskipper', name: 'Çamur Zıpzıpı', price: 300, currency: 'coin', type: 'fish', species: 'mudskipper', gender: 'M', color: '#8B4513', category: 'brackish' },

    // --- COMMERCIAL / SEAFOOD ---
    { id: 'w_salmon', name: 'Somon', price: 10, currency: 'gem', type: 'fish', species: 'salmon', gender: 'M', color: '#FA8072', category: 'seafood' },
    { id: 'w_trout', name: 'Alabalık', price: 150, currency: 'coin', type: 'fish', species: 'trout', gender: 'M', color: '#556B2F', category: 'seafood' },
    { id: 'w_torik', name: 'Torik', price: 200, currency: 'coin', type: 'fish', species: 'torik', gender: 'M', color: '#708090', category: 'seafood' },
    { id: 'w_bluefish', name: 'Lüfer', price: 250, currency: 'coin', type: 'fish', species: 'bluefish', gender: 'M', color: '#4682B4', category: 'seafood' },
    { id: 'w_mackerel', name: 'Uskumru', price: 100, currency: 'coin', type: 'fish', species: 'mackerel', gender: 'M', color: '#00CED1', category: 'seafood' },
    { id: 'w_whiting', name: 'Mezgit', price: 80, currency: 'coin', type: 'fish', species: 'whiting', gender: 'M', color: '#DCDCDC', category: 'seafood' },
    { id: 'w_orkinos', name: 'Orkinos', price: 60, currency: 'gem', type: 'fish', species: 'orkinos', gender: 'M', color: '#000080', category: 'seafood' },
    { id: 'w_mullet', name: 'Kefal', price: 70, currency: 'coin', type: 'fish', species: 'mullet', gender: 'M', color: '#A9A9A9', category: 'seafood' },
    { id: 'w_turbot', name: 'Kalkan', price: 300, currency: 'coin', type: 'fish', species: 'turbot', gender: 'M', color: '#8B4513', category: 'seafood' },
    { id: 'w_red_mullet', name: 'Barbun', price: 120, currency: 'coin', type: 'fish', species: 'red_mullet', gender: 'M', color: '#CD5C5C', category: 'seafood' },
    { id: 'w_red_seabream', name: 'Mercan', price: 140, currency: 'coin', type: 'fish', species: 'red_seabream', gender: 'M', color: '#FF6347', category: 'seafood' },
    { id: 'w_horse_mackerel', name: 'İstavrit', price: 50, currency: 'coin', type: 'fish', species: 'horse_mackerel', gender: 'M', color: '#B0C4DE', category: 'seafood' },

    // --- TURKISH LOCAL ---
    { id: 'w_hamsi', name: 'Hamsi', price: 20, currency: 'coin', type: 'fish', species: 'hamsi', gender: 'M', color: '#C0C0C0', category: 'turkish' },
    { id: 'w_cinekop', name: 'Çinekop', price: 150, currency: 'coin', type: 'fish', species: 'cinekop', gender: 'M', color: '#778899', category: 'turkish' },
    { id: 'w_levrek', name: 'Levrek', price: 200, currency: 'coin', type: 'fish', species: 'levrek', gender: 'M', color: '#C0C0C0', category: 'turkish' },
    { id: 'w_cupra', name: 'Çupra', price: 200, currency: 'coin', type: 'fish', species: 'cupra', gender: 'M', color: '#A9A9A9', category: 'turkish' },
    { id: 'w_palamut', name: 'Palamut', price: 180, currency: 'coin', type: 'fish', species: 'palamut', gender: 'M', color: '#2F4F4F', category: 'turkish' },
    { id: 'w_kofana', name: 'Kofana', price: 300, currency: 'coin', type: 'fish', species: 'kofana', gender: 'M', color: '#4682B4', category: 'turkish' },
    { id: 'w_pike', name: 'Turna', price: 220, currency: 'coin', type: 'fish', species: 'pike', gender: 'M', color: '#556B2F', category: 'turkish' },
    { id: 'w_chub', name: 'Tatlı Su Kefali', price: 60, currency: 'coin', type: 'fish', species: 'chub', gender: 'M', color: '#808000', category: 'turkish' },
    { id: 'w_carp', name: 'Sazan', price: 80, currency: 'coin', type: 'fish', species: 'carp', gender: 'M', color: '#DAA520', category: 'turkish' },
    { id: 'w_wels', name: 'Yayın (Dev)', price: 40, currency: 'gem', type: 'fish', species: 'wels_catfish', gender: 'M', color: '#2E2B5F', category: 'turkish' },
    { id: 'w_pearl', name: 'İnci Kefali', price: 100, currency: 'coin', type: 'fish', species: 'pearl_mullet', gender: 'M', color: '#E6E6FA', category: 'turkish' },

    // --- EXOTIC / RARE ---
    { id: 'w_mandarin', name: 'Mandarinfish', price: 50, currency: 'gem', type: 'fish', species: 'mandarinfish', gender: 'M', color: '#00CED1', category: 'exotic' },
    { id: 'w_seadragon', name: 'Leafy Sea Dragon', price: 80, currency: 'gem', type: 'fish', species: 'seadragon', gender: 'M', color: '#9ACD32', category: 'exotic' },
    { id: 'w_seahorse', name: 'Denizatı', price: 40, currency: 'gem', type: 'fish', species: 'seahorse', gender: 'M', color: '#FFD700', category: 'exotic' },
    { id: 'w_dragonfish', name: 'Dragonfish', price: 60, currency: 'gem', type: 'fish', species: 'dragonfish', gender: 'M', color: '#000000', category: 'exotic' },
    { id: 'w_oarfish', name: 'Kral Ringa (Oarfish)', price: 100, currency: 'gem', type: 'fish', species: 'oarfish', gender: 'M', color: '#C0C0C0', category: 'exotic' },
    { id: 'w_molamola', name: 'Mola Mola (Sunfish)', price: 90, currency: 'gem', type: 'fish', species: 'mola_mola', gender: 'M', color: '#778899', category: 'exotic' },

    // --- APEX / DANGEROUS ---
    { id: 'w_greatwhite', name: 'Büyük Beyaz Köpekbalığı', price: 200, currency: 'gem', type: 'fish', species: 'great_white_shark', gender: 'M', color: '#A9A9A9', category: 'apex' },
    { id: 'w_tiger', name: 'Kaplan Köpekbalığı', price: 150, currency: 'gem', type: 'fish', species: 'tiger_shark', gender: 'M', color: '#708090', category: 'apex' },
    { id: 'w_bull', name: 'Boğa Köpekbalığı', price: 140, currency: 'gem', type: 'fish', species: 'bull_shark', gender: 'M', color: '#696969', category: 'apex' },
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [tankSize, setTankSize] = useState<{ w: number; h: number }>({ w: 800, h: 500 });
  const [shopOpen, setShopOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState<'fish' | 'plant' | 'decoration' | 'equipment' | 'supply'>('fish');
  const [isMuted, setIsMuted] = useState(false);
  const [sellMode, setSellMode] = useState(false);
  const [offlineReport, setOfflineReport] = useState<{ time: string, message: string } | null>(null);

  const [gameState, setGameState] = useState<AppState>(() => {
    const saved = localStorage.getItem('fishFarmState_v7');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration safety
        return { 
            ...parsed, 
            gameStarted: false, 
            food: [],
            lastSaveTime: parsed.lastSaveTime || Date.now(),
            fishes: parsed.fishes.map((f: any) => ({
                ...f,
                stage: f.stage || LifeStage.ADULT,
                genes: f.genes || { colorHex: '#FFA500', rarity: 'common' },
                wanderOffset: Math.random() * 100
            }))
        };
      } catch (e) { console.error("Save load failed", e); }
    }
    return {
      gameStarted: false,
      lastSaveTime: Date.now(),
      money: INITIAL_MONEY,
      gems: INITIAL_GEMS,
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
      inventory: { medicine: 0 },
      lightOn: true,
      fishes: [],
      decorations: [],
      plants: [],
      food: [],
      tasks: TASKS,
      algaeLevel: 0
    };
  });

  const requestRef = useRef<number>(0);

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
                if (f.hunger < 20 && Math.random() > 0.5) f.isSick = true;
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

  // --- Helpers ---
  const spawnFish = (type: FishType, gender: Gender = 'F', color: string = '#FFA500', isBaby = false): FishState => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    gender,
    stage: isBaby ? LifeStage.FRY : LifeStage.ADULT,
    genes: { colorHex: color, rarity: 'common' },
    position: { x: tankSize.w / 2, y: 100 },
    velocity: { x: (Math.random() - 0.5) * 2, y: Math.random() },
    wanderOffset: Math.random() * 1000,
    size: isBaby ? 0.2 : 1.0,
    hunger: 70,
    health: 100,
    stress: 0,
    age: 0,
    isSick: false,
    reproductiveProgress: 0,
    thoughts: ''
  });

  const mixColors = (c1: string, c2: string): string => {
    // Very simple hex mixing
    const parse = (c: string) => {
       if (c.startsWith('#')) return {
           r: parseInt(c.slice(1,3), 16),
           g: parseInt(c.slice(3,5), 16),
           b: parseInt(c.slice(5,7), 16)
       };
       // Basic color name fallback
       if (c === 'purple') return { r: 128, g: 0, b: 128 };
       return { r: 255, g: 255, b: 255 };
    };
    const col1 = parse(c1);
    const col2 = parse(c2);
    
    // Mutation chance
    if (Math.random() < 0.1) {
       return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    const r = Math.floor((col1.r + col2.r) / 2);
    const g = Math.floor((col1.g + col2.g) / 2);
    const b = Math.floor((col1.b + col2.b) / 2);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const spawnEgg = (mom: FishState, dad: FishState): FishState => {
      return {
          id: Math.random().toString(36).substr(2, 9),
          type: mom.type,
          gender: Math.random() > 0.5 ? 'M' : 'F',
          stage: LifeStage.EGG,
          genes: { 
              colorHex: mixColors(mom.genes.colorHex, dad.genes.colorHex),
              rarity: 'common'
          },
          position: { x: mom.position.x, y: tankSize.h - 50 }, // Spawn at bottom
          velocity: { x: 0, y: 0 },
          wanderOffset: 0,
          size: 0.1,
          hunger: 100,
          health: 100,
          stress: 0,
          age: 0,
          isSick: false,
          reproductiveProgress: 0,
          thoughts: ''
      };
  };

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

  // --- Physics Engine ---
  const updatePhysics = useCallback(() => {
    if (phase !== GamePhase.PLAYING) return;

    setGameState(prev => {
      const now = Date.now();
      const fishCount = prev.fishes.length;
      let { temperature, ammonia, oxygen, ph } = prev.waterParams;
      let { algaeLevel } = prev;
      let money = prev.money;
      let fishes = prev.fishes.map(f => ({ ...f }));
      let plants = [...prev.plants];
      
      // --- Water Chemistry ---
      const targetTemp = prev.equipment.heater ? 25 : 18;
      if (temperature < targetTemp) temperature += 0.02; else if (temperature > targetTemp) temperature -= 0.01;
      
      const wasteLoad = (fishCount * 0.0005) + (prev.food.length * 0.002);
      let filterEfficiency = [0.01, 0.03, 0.08][prev.equipment.filterLevel - 1] || 0.01;
      ammonia = Math.max(0, ammonia + wasteLoad - filterEfficiency - (plants.length * 0.002));
      
      oxygen = Math.min(100, Math.max(0, oxygen - (fishCount * 0.02) + 0.05 + (prev.equipment.airStone ? 0.15 : 0)));
      
      if (prev.lightOn) {
          algaeLevel = Math.min(100, algaeLevel + (prev.equipment.lightLevel * 0.005) + (ammonia * 0.05));
          plants.forEach(p => p.growth = Math.min(1.5, p.growth + 0.0005));
      }

      // --- Fish AI Loop ---
      const survivingFood = [...prev.food];
      const predators = fishes.filter(f => ['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'marine_odd', 'shark', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(f.type) && f.stage !== LifeStage.EGG);

      fishes = fishes.map(fish => {
          fish.age += 1;

          // EGG LOGIC
          if (fish.stage === LifeStage.EGG) {
              if (fish.age > 1000) { // Hatch time
                  fish.stage = LifeStage.FRY;
                  fish.size = 0.2;
                  fish.velocity = { x: (Math.random() - 0.5), y: -0.5 };
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

          // Health & Stress
          let stressFactor = 0;
          if (ammonia > 0.5) { stressFactor += 1; fish.health -= 0.05; }
          if (fish.hunger <= 0) { fish.health -= 0.1; }
          fish.stress = Math.min(100, Math.max(0, fish.stress + (stressFactor * 0.1) - 0.05));
          fish.hunger = Math.max(0, fish.hunger - 0.03);

          // MOVEMENT VECTORS
          const speedMod = (fish.isSick || temperature < 20) ? 0.5 : 1.0;
          let ax = 0, ay = 0;

          // 1. WANDER (Perlin-ish using sin/cos of offset)
          fish.wanderOffset += 0.01;
          ax += Math.sin(fish.wanderOffset) * 0.05;
          ay += Math.cos(fish.wanderOffset * 1.3) * 0.05;

          // 2. FLEE (Threat Detection)
          if (!['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(fish.type)) {
              predators.forEach(predator => {
                  const dx = predator.position.x - fish.position.x;
                  const dy = predator.position.y - fish.position.y;
                  const dist = Math.sqrt(dx*dx + dy*dy);
                  if (dist < 150) {
                      // Run away!
                      ax -= (dx / dist) * 0.3;
                      ay -= (dy / dist) * 0.3;
                      fish.stress += 0.1;
                  }
              });
          }

          // 3. FLOCKING (Boids - simplified)
          if (['neon', 'guppy', 'cardinal_tetra', 'ember_tetra', 'rasbora', 'anthias', 'hamsi', 'capelin'].includes(fish.type)) {
               fishes.forEach(other => {
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
          prev.food.forEach(f => {
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
          
          // Bottom dweller constraint
          if (['corydoras', 'pleco', 'loach', 'catfish', 'goby', 'flounder', 'wels_catfish', 'mudskipper', 'scorpionfish', 'halibut', 'turbot'].includes(fish.type)) {
               if (fish.position.y < tankSize.h - 100) fish.velocity.y += 0.5;
          }

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

      fishes.forEach(fish => {
          // Eating Food
          survivingFood.forEach(f => {
             if (foodToRemove.has(f.id)) return;
             const dist = Math.hypot(f.position.x - fish.position.x, f.position.y - fish.position.y);
             if (dist < 30 * fish.size && fish.stage !== LifeStage.EGG) {
                 fish.hunger = Math.min(100, fish.hunger + 30);
                 foodToRemove.add(f.id);
                 audioManager.playBubble();
             }
          });

          // PREDATOR EATING FISH
          if (['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'lionfish', 'moray_eel', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(fish.type) && fish.size > 0.8) {
              fishes.forEach(prey => {
                  if (prey.id === fish.id) return;
                  if (fishToRemove.has(prey.id)) return;
                  // Predators don't eat same species or other big predators usually (simplified)
                  if (['piranha', 'arapaima', 'arowana', 'peacock_bass', 'alligator_gar', 'barracuda', 'lionfish', 'moray_eel', 'great_white_shark', 'tiger_shark', 'bull_shark'].includes(prey.type)) return;

                  const dist = Math.hypot(prey.position.x - fish.position.x, prey.position.y - fish.position.y);
                  if (dist < 40 && prey.size < fish.size * 0.5) {
                      fishToRemove.add(prey.id);
                      fish.hunger = 100;
                      audioManager.playBubble(); // Chomp sound ideally
                  }
              });
          }

          // Breeding Check
          if (fish.reproductiveProgress >= 100 && fish.gender === 'F') {
              const mate = fishes.find(m => 
                  m.id !== fish.id && 
                  m.type === fish.type && 
                  m.gender === 'M' && 
                  m.reproductiveProgress >= 100 &&
                  Math.hypot(m.position.x - fish.position.x, m.position.y - fish.position.y) < 50
              );
              
              if (mate) {
                  fish.reproductiveProgress = 0;
                  mate.reproductiveProgress = 0;
                  fish.thoughts = "❤️";
                  newEggs.push(spawnEgg(fish, mate));
                  audioManager.playChime();
              }
          }
      });

      const finalFishes = [...fishes.filter(f => !fishToRemove.has(f.id)), ...newEggs];
      const finalFood = survivingFood.filter(f => !foodToRemove.has(f.id)).filter(f => {
           if (now - parseInt(f.id, 36) > 20000) return false;
           return true;
      });

      return {
          ...prev,
          money,
          waterParams: { temperature, ammonia, oxygen, ph },
          fishes: finalFishes,
          plants: plants,
          food: finalFood,
          algaeLevel: algaeLevel,
          lastSaveTime: now // Update save time constantly while playing
      };
    });

    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [phase, tankSize]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updatePhysics]);

  // Save State
  useEffect(() => {
      const timer = setInterval(() => {
          if (phase === GamePhase.PLAYING) {
              localStorage.setItem('fishFarmState_v7', JSON.stringify(gameState));
          }
      }, 5000);
      return () => clearInterval(timer);
  }, [gameState, phase]);

  const startGame = () => {
      audioManager.startAmbience();
      audioManager.startMusic();
      setPhase(GamePhase.PLAYING);
      if (gameState.fishes.length === 0) {
           setGameState(p => ({ ...p, fishes: [spawnFish('goldfish', 'M'), spawnFish('goldfish', 'F')] }));
      }
  };

  // --- Interactions ---

  const handleTankClick = (x: number, y: number, target?: any) => {
      if (sellMode) {
          const closestFish = gameState.fishes.find(f => {
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
          food: [...prev.food, { id: Math.random().toString(36).substr(2, 9), position: { x, y }, active: true }],
          tasks: prev.tasks.map(t => t.id === 't1' ? { ...t, current: Math.min(t.current + 1, t.target) } : t)
      }));
  };

  const sellFish = (fishId: string) => {
      const fish = gameState.fishes.find(f => f.id === fishId);
      if (!fish || fish.stage === LifeStage.EGG) return; // Can't sell eggs

      let value = 20;
      if (['goldfish', 'platy', 'molly'].includes(fish.type)) value = 30;
      if (['discus', 'arapaima', 'arowana'].includes(fish.type)) value = 150;
      // Saltwater is expensive
      if (['blue_tang', 'clownfish', 'lionfish', 'seahorse'].includes(fish.type)) value = 200;
      // Sharks are huge money
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
    setGameState(prev => ({
        ...prev,
        waterParams: {
            ...prev.waterParams,
            ammonia: Math.max(0, prev.waterParams.ammonia - 0.5),
            oxygen: 90,
            temperature: (prev.waterParams.temperature * 0.7) + (20 * 0.3)
        },
        tasks: prev.tasks.map(t => t.id === 't2' ? { ...t, current: 1 } : t)
    }));
  };

  const handleScrubAlgae = () => {
      if (gameState.algaeLevel <= 0) return;
      audioManager.playBubble();
      setGameState(prev => ({
          ...prev,
          algaeLevel: Math.max(0, prev.algaeLevel - 20),
          tasks: prev.tasks.map(t => t.id === 't3' ? { ...t, current: 1, completed: true } : t)
      }));
      const task = gameState.tasks.find(t => t.id === 't3');
      if (task && !task.completed) {
          collectReward('t3');
      }
  };

  const handleTreatFish = () => {
      if (gameState.inventory.medicine > 0) {
          audioManager.playChime();
          setGameState(prev => ({
              ...prev,
              inventory: { ...prev.inventory, medicine: prev.inventory.medicine - 1 },
              fishes: prev.fishes.map(f => ({ ...f, isSick: false, health: Math.min(100, f.health + 20) }))
          }));
      }
  };

  const buyItem = (item: any) => {
      const currency = item.currency === 'gem' ? gameState.gems : gameState.money;
      if (currency < item.price) return;

      audioManager.playChime();
      setGameState(prev => {
          const next = { ...prev };
          if (item.currency === 'gem') next.gems -= item.price;
          else next.money -= item.price;

          if (item.type === 'fish') {
              next.fishes = [...next.fishes, spawnFish(item.species, item.gender, item.color)];
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
          } else if (item.type === 'supply') {
              if (item.visual === 'medicine') next.inventory.medicine += 1;
          }
          return next;
      });
  };

  const triggerThought = async () => {
      if (gameState.fishes.length === 0) return;
      const fishIndex = Math.floor(Math.random() * gameState.fishes.length);
      const fish = gameState.fishes[fishIndex];
      // Do not generate thoughts for eggs
      if (fish.stage === LifeStage.EGG) return;
      
      const thought = await getFishThoughts(fish, gameState.lightOn, gameState.waterParams);
      setGameState(prev => {
          const newFishes = [...prev.fishes];
          newFishes[fishIndex] = { ...newFishes[fishIndex], thoughts: thought };
          return { ...prev, fishes: newFishes };
      });
      setTimeout(() => {
        setGameState(prev => {
            const newFishes = [...prev.fishes];
            if (newFishes[fishIndex]) newFishes[fishIndex].thoughts = '';
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
              tasks: prev.tasks.filter(x => x.id !== id)
          };
      });
  };

  // --- RENDER PHASES ---

  if (phase === GamePhase.SHOWROOM) {
      return (
          <Showroom 
              onBack={() => {
                  setPhase(GamePhase.PLAYING);
                  setShopOpen(true); // Re-open shop on return
              }}
              items={WHOLESALE_ITEMS}
              onBuy={buyItem}
              money={gameState.money}
              gems={gameState.gems}
          />
      );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-2 font-sans overflow-hidden">
      
      {phase === GamePhase.INTRO && (
        <IntroSequence onComplete={startGame} />
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

                   <h1 className="hidden md:block text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                       Akvaryumum
                   </h1>

                   <div className="flex gap-2">
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
                           <button onClick={handleTreatFish} className={`p-2 rounded-xl transition-colors ${gameState.inventory.medicine > 0 ? 'bg-red-500/30 hover:bg-red-500 text-red-200' : 'bg-gray-800 text-gray-600'}`}>
                               <Pill size={20} />
                               <span className="absolute bottom-0 right-0 text-[8px] bg-black px-1 rounded-full">{gameState.inventory.medicine}</span>
                           </button>
                           
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
                       <Aquarium 
                          state={gameState}
                          onDimensionsChange={handleDimensions}
                          onFeed={handleTankClick}
                          onClean={handleWaterChange}
                          toggleLight={toggleLight}
                          sellMode={sellMode}
                       />
                       
                       {/* AI Thought Button */}
                       <button 
                          onClick={triggerThought}
                          className="absolute bottom-4 left-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 shadow-lg transition-all active:scale-95"
                       >
                           <Activity size={24} />
                       </button>
                  </div>

                  {/* Right Panel: Tasks */}
                  <div className="hidden md:flex w-48 flex-col gap-2 bg-gray-900/50 rounded-2xl p-3 border border-gray-800">
                      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Görevler</h3>
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
                                      <span className="text-yellow-500">+{task.reward}</span>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>

              </div>
          </div>
      )}

      {/* SHOP MODAL */}
      {shopOpen && phase === GamePhase.PLAYING && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-900 w-full max-w-4xl h-[80vh] rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
                  {/* Shop Header */}
                  <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <ShoppingBag className="text-cyan-400" /> Akvaryum Market
                      </h2>
                      <div className="flex gap-2">
                           {/* SHOWROOM BUTTON */}
                           <button 
                               onClick={() => { setShopOpen(false); setPhase(GamePhase.SHOWROOM); }}
                               className="p-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg transform transition-transform hover:scale-105"
                           >
                               <Car size={20} /> Toptancı
                           </button>

                           <button onClick={() => setShopOpen(false)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                               Kapat
                           </button>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-2 bg-black/20 gap-2 overflow-x-auto">
                      {['fish', 'plant', 'decoration', 'equipment', 'supply'].map(cat => (
                          <button 
                              key={cat}
                              onClick={() => setShopCategory(cat as any)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${shopCategory === cat ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                          >
                              {cat === 'fish' ? 'Balıklar' : cat === 'plant' ? 'Bitkiler' : cat === 'decoration' ? 'Dekor' : cat === 'equipment' ? 'Ekipman' : 'Sarf Malzeme'}
                          </button>
                      ))}
                  </div>

                  {/* Items Grid */}
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-gray-950/50">
                      {STANDARD_ITEMS.filter(item => item.type === shopCategory).map(item => {
                           const canAfford = (item.currency === 'gem' ? gameState.gems : gameState.money) >= item.price;
                           return (
                               <div key={item.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-cyan-500 transition-all group">
                                   <div className="h-24 bg-black/40 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                       {/* Simple preview icons */}
                                       {item.type === 'fish' && <div className="w-8 h-8 rounded-full" style={{ backgroundColor: item.color }}></div>}
                                       {item.type === 'plant' && <div className="text-green-500">🌿</div>}
                                       {item.type === 'decoration' && <div className="text-gray-400">🪨</div>}
                                       {item.type === 'equipment' && <div className="text-blue-400">⚙️</div>}
                                       {item.type === 'supply' && <div className="text-red-400">💊</div>}
                                   </div>
                                   <h3 className="font-bold text-gray-200 text-sm mb-1">{item.name}</h3>
                                   <div className="flex justify-between items-center mt-2">
                                       <div className="flex items-center gap-1">
                                           {item.currency === 'gem' ? <Diamond size={14} className="text-purple-400"/> : <Coins size={14} className="text-yellow-500"/>}
                                           <span className={`font-bold ${item.currency === 'gem' ? 'text-purple-400' : 'text-yellow-400'}`}>{item.price}</span>
                                       </div>
                                       <button 
                                          onClick={() => buyItem(item)}
                                          disabled={!canAfford}
                                          className={`px-3 py-1 rounded text-xs font-bold ${canAfford ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                       >
                                           AL
                                       </button>
                                   </div>
                               </div>
                           )
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
