// @ts-nocheck -- Imagine Studio v2
/**
 * Photo skyboxes (founder directive 2026-10-25): a real-life city photo
 * wrapped around a level, seen through the windows instead of built
 * geometry. The choice lives ON the scene (`scene.skybox`) so it saves
 * with the level, publishes with it, and can differ per floor. Admins
 * swap cities from edit mode (StudioIntegrations "Skybox" panel).
 * Photos are served same-origin from public/skyboxes in the repo.
 */
export type SkyboxChoice = { city: string; url: string };
export type SkyboxCity = { id: string; label: string; url: string };

export const SKYBOX_CITIES: SkyboxCity[] = [
  { id: "nyc", label: "New York City", url: "/skyboxes/nyc.jpg" },
  { id: "san-francisco", label: "San Francisco", url: "/skyboxes/san-francisco.jpg" },
  { id: "tokyo", label: "Tokyo", url: "/skyboxes/tokyo.jpg" },
  { id: "orlando", label: "Orlando", url: "/skyboxes/orlando.jpg" },
];

/**
 * 360° environments (founder directive 2026-10-25): true equirectangular
 * photos that wrap all the way around and overhead, shown in the Skybox
 * panel BELOW the cities. All are openly licensed (CC BY / CC BY-SA,
 * Wikimedia Commons), 8000×4000. NOTE: real Sketchfab downloads need a
 * Sketchfab account token — if the founder connects one, Sketchfab
 * skyboxes can be added here the same way.
 */
export const SKYBOX_ENVIRONMENTS: SkyboxCity[] = [
  { id: "env-alpine-lake", label: "Alpine Lake", url: "/skyboxes/env-alpine-lake.jpg" },
  { id: "env-starry-night", label: "Starry Night", url: "/skyboxes/env-starry-night.jpg" },
  { id: "env-desert-sunrise", label: "Desert Sunrise", url: "/skyboxes/env-desert-sunrise.jpg" },
  { id: "env-pacific-coast", label: "Pacific Coast", url: "/skyboxes/env-pacific-coast.jpg" },
  { id: "env-redwood-forest", label: "Forest Valley", url: "/skyboxes/env-redwood-forest.jpg" },
  { id: "env-london-park", label: "London Park", url: "/skyboxes/env-london-park.jpg" },
];

export const ALL_SKYBOXES: SkyboxCity[] = [...SKYBOX_CITIES, ...SKYBOX_ENVIRONMENTS];

export const DEFAULT_SKYBOX: SkyboxChoice = { city: "nyc", url: "/skyboxes/nyc.jpg" };

export const skyboxCityLabel = (id?: string | null): string =>
  ALL_SKYBOXES.find((c) => c.id === id)?.label ?? "Custom photo";
