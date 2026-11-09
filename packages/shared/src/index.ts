/**
 * @gaushala/shared — contracts, tokens and domain utilities shared by the
 * Next.js application and the Express API.
 *
 * Import only from the package root (`@gaushala/shared`) so the public surface
 * stays explicit and tree-shakeable.
 */
export * from './constants/site.js';
export * from './contracts/index.js';
export * from './design/contrast.js';
export * from './design/tokens.js';
export * from './money/money.js';
export * from './permissions/permissions.js';
export * from './utils/slug.js';
export * from './utils/uuid.js';
