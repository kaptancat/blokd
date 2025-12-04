
export interface Vector2 {
  x: number;
  y: number;
}

export type FishType = 
  // Standard
  'goldfish' | 'neon' | 'betta' | 'guppy' | 'discus' | 'clownfish' | 'piranha' |
  // Small Peaceful
  'endler' | 'platy' | 'molly' | 'cardinal_tetra' | 'ember_tetra' | 'zebra_danio' | 'rasbora' | 'white_cloud' |
  // Cichlids
  'angelfish' | 'oscar' | 'ramirezi' | 'malawi' | 'tanganyika' | 'kribensis' |
  // Bottom
  'corydoras' | 'pleco' | 'otocinclus' | 'loach' | 'catfish' |
  // Big/Predator
  'arapaima' | 'arowana' | 'peacock_bass' | 'alligator_gar' |
  // Marine Reef
  'blue_tang' | 'yellow_tang' | 'butterflyfish' | 'marine_angelfish' | 'wrasse' | 'goby' | 'firefish' | 'anthias' | 'damsel' |
  // Marine Big/Ocean
  'tuna' | 'mahi_mahi' | 'swordfish' | 'marlin' | 'barracuda' |
  // Marine Odd/Bottom
  'lionfish' | 'scorpionfish' | 'anglerfish' | 'moray_eel' | 'flounder' |
  // Polar / Cold Water
  'halibut' | 'cod' | 'haddock' | 'arctic_char' | 'capelin' |
  // Brackish
  'archerfish' | 'monodactylus' | 'scat' | 'mudskipper' |
  // Commercial / Seafood
  'salmon' | 'trout' | 'torik' | 'bluefish' | 'mackerel' | 'whiting' | 'orkinos' | 'mullet' | 'turbot' | 'red_mullet' | 'red_seabream' | 'horse_mackerel' |
  // Turkish Local
  'hamsi' | 'cinekop' | 'levrek' | 'cupra' | 'palamut' | 'kofana' | 'pike' | 'chub' | 'carp' | 'wels_catfish' | 'pearl_mullet' |
  // Exotic
  'mandarinfish' | 'seadragon' | 'seahorse' | 'dragonfish' | 'oarfish' | 'mola_mola' |
  // Apex / Dangerous
  'great_white_shark' | 'tiger_shark' | 'bull_shark';

export type Gender = 'M' | 'F';

export enum LifeStage {
  EGG = 'EGG',
  FRY = 'FRY', // Baby
  ADULT = 'ADULT'
}

export interface FishGenes {
  colorHex: string; // The primary body color
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface FishState {
  id: string;
  type: FishType;
  gender: Gender;
  stage: LifeStage;
  genes: FishGenes;
  
  position: Vector2;
  velocity: Vector2;
  wanderOffset: number; // For smooth random movement
  
  size: number; // 0.2 (fry) to 1.0+ (adult)
  hunger: number; // 0-100 (0 = starving)
  health: number; // 0-100 (0 = dead)
  stress: number; // 0-100 (100 = panic)
  age: number; // in ticks
  
  isSick: boolean;
  reproductiveProgress: number; // 0-100
  thoughts: string;
}

export interface FoodParticle {
  id: string;
  position: Vector2;
  active: boolean;
}

export interface Decoration {
  id: string;
  type: 'rock' | 'coral' | 'castle';
  x: number;
  scale: number;
}

export interface Plant {
  id: string;
  type: 'fern' | 'amazon' | 'grass';
  x: number;
  growth: number; // 0.1 to 1.5
  health: number;
}

export interface Task {
  id: string;
  description: string;
  current: number;
  target: number;
  reward: number; // Coins
  gemReward?: number;
  completed: boolean;
}

export interface WaterParams {
  temperature: number; // Ideal: 24-26
  ammonia: number; // Ideal: 0, Toxic > 0.5
  oxygen: number; // Ideal: > 80
  ph: number; // Ideal 6.5 - 7.5
}

export interface Equipment {
  filterLevel: number; // 1: Sponge, 2: HOB, 3: Canister
  heater: boolean;
  airStone: boolean;
  lightLevel: number; // 1: Low, 2: Med, 3: High
  co2System: boolean;
}

export interface AppState {
  gameStarted: boolean;
  lastSaveTime: number; // For offline progress
  money: number;
  gems: number; // Premium currency
  waterParams: WaterParams;
  equipment: Equipment;
  lightOn: boolean;
  fishes: FishState[];
  decorations: Decoration[];
  plants: Plant[];
  food: FoodParticle[];
  algaeLevel: number; // 0-100
  tasks: Task[];
  inventory: {
    medicine: number;
  };
}

export enum GamePhase {
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  SHOWROOM = 'SHOWROOM',
}
