// Matter uses bitmasks for collision filtering. Ghost packages use a zero mask
// while dragged, so moving them through a wall cannot disturb settled packages.
export const CATEGORY_WALL = 0x0001;
export const CATEGORY_PACKAGE = 0x0002;
export const CATEGORY_GHOST = 0x0004;

export const PACKAGE_COLLISION_MASK = CATEGORY_WALL | CATEGORY_PACKAGE;
