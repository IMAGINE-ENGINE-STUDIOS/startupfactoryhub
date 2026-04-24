// Free, public 3D model library users can drop into the AR scene.
// All sources are publicly hosted .glb files (NASA + Khronos sample assets).

export interface ARModelLibraryEntry {
  id: string;
  name: string;
  category: "Artemis & NASA" | "Space" | "Vehicles" | "Objects" | "Nature";
  src: string;
  /** Suggested real-world size in meters (used as default size_m). */
  defaultSizeM: number;
  thumbnail?: string;
}

const NASA = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";
const KHRONOS =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0";

export const AR_MODEL_LIBRARY: ARModelLibraryEntry[] = [
  // === Artemis / NASA pack (the same models we used at the Artemis event) ===
  {
    id: "nasa-astronaut",
    name: "NASA Astronaut",
    category: "Artemis & NASA",
    src: `${NASA}/Astronaut/Astronaut.glb`,
    defaultSizeM: 1.8,
  },
  {
    id: "apollo-lunar-module",
    name: "Apollo Lunar Module",
    category: "Artemis & NASA",
    src: `${NASA}/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb`,
    defaultSizeM: 6,
  },
  {
    id: "perseverance-rover",
    name: "Perseverance Rover",
    category: "Artemis & NASA",
    src: `${NASA}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`,
    defaultSizeM: 3,
  },
  {
    id: "james-webb",
    name: "James Webb Telescope",
    category: "Artemis & NASA",
    src: `${NASA}/James%20Webb%20Space%20Telescope%20(A)/James%20Webb%20Space%20Telescope%20(A).glb`,
    defaultSizeM: 8,
  },
  {
    id: "gateway-station",
    name: "Gateway Lunar Station",
    category: "Artemis & NASA",
    src: `${NASA}/Gateway/Gateway%20Core.glb`,
    defaultSizeM: 8,
  },
  {
    id: "space-shuttle",
    name: "Space Shuttle",
    category: "Artemis & NASA",
    src: `${NASA}/Space%20Shuttle%20(A)/Space%20Shuttle%20(A).glb`,
    defaultSizeM: 12,
  },
  {
    id: "iss",
    name: "International Space Station",
    category: "Artemis & NASA",
    src: `${NASA}/International%20Space%20Station%20(ISS)%20(A)/International%20Space%20Station%20(ISS)%20(A).glb`,
    defaultSizeM: 20,
  },

  // === Generic free models (Khronos glTF sample set, MIT/CC licensed) ===
  {
    id: "duck",
    name: "Rubber Duck",
    category: "Objects",
    src: `${KHRONOS}/Duck/glTF-Binary/Duck.glb`,
    defaultSizeM: 0.4,
  },
  {
    id: "avocado",
    name: "Avocado",
    category: "Nature",
    src: `${KHRONOS}/Avocado/glTF-Binary/Avocado.glb`,
    defaultSizeM: 0.15,
  },
  {
    id: "boom-box",
    name: "Boom Box",
    category: "Objects",
    src: `${KHRONOS}/BoomBox/glTF-Binary/BoomBox.glb`,
    defaultSizeM: 0.3,
  },
  {
    id: "damaged-helmet",
    name: "Sci-Fi Helmet",
    category: "Objects",
    src: `${KHRONOS}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
    defaultSizeM: 0.4,
  },
  {
    id: "flight-helmet",
    name: "Flight Helmet",
    category: "Objects",
    src: `${KHRONOS}/FlightHelmet/glTF/FlightHelmet.gltf`,
    defaultSizeM: 0.35,
  },
  {
    id: "lantern",
    name: "Lantern",
    category: "Objects",
    src: `${KHRONOS}/Lantern/glTF-Binary/Lantern.glb`,
    defaultSizeM: 1.5,
  },
  {
    id: "fox",
    name: "Fox",
    category: "Nature",
    src: `${KHRONOS}/Fox/glTF-Binary/Fox.glb`,
    defaultSizeM: 0.7,
  },
  {
    id: "cesium-man",
    name: "Walking Person",
    category: "Objects",
    src: `${KHRONOS}/CesiumMan/glTF-Binary/CesiumMan.glb`,
    defaultSizeM: 1.7,
  },
];

export const AR_MODEL_CATEGORIES = Array.from(
  new Set(AR_MODEL_LIBRARY.map((m) => m.category))
) as ARModelLibraryEntry["category"][];
