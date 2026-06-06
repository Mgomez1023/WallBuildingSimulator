export const SIM_BASE_SPAWN_DELAY_MS = 2500;
export const SIM_SPEED_INCREASE_PER_WALL_MS = 80;
export const SIM_MIN_SPAWN_DELAY_MS = 650;
export const WALL_COMPLETION_BONUS = 200;

export function getSimulationSpawnDelay(wallNumber: number) {
  const delay =
    SIM_BASE_SPAWN_DELAY_MS -
    (Math.max(1, wallNumber) - 1) * SIM_SPEED_INCREASE_PER_WALL_MS;

  return Math.max(SIM_MIN_SPAWN_DELAY_MS, delay);
}
