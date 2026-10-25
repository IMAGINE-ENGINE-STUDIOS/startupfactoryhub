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

export const DEFAULT_SKYBOX: SkyboxChoice = { city: "nyc", url: "/skyboxes/nyc.jpg" };

export const skyboxCityLabel = (id?: string | null): string =>
  SKYBOX_CITIES.find((c) => c.id === id)?.label ?? "Custom photo";
