export const ALL_PERMISSIONS = [
  'inventory:create',
  'inventory:update',
  'inventory:archive',
  'supplier:create',
  'supplier:update',
  'supplier:archive',
  'transaction:create'
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
    'inventory:create': 'Can create new inventory items',
    'inventory:update': 'Can edit existing inventory items',
    'inventory:archive': 'Can archive inventory items',
    'supplier:create': 'Can create new suppliers',
    'supplier:update': 'Can edit existing suppliers',
    'supplier:archive': 'Can archive suppliers',
    'transaction:create': 'Can record new transactions',
};