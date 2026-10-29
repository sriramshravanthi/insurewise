// Providers may import only schemas (docs/ARCHITECTURE.md §4), so this
// mirrors src/engine/engine-version.ts independently rather than importing
// it — providers are their own evolving seam, separate from the engine's
// formula versioning (docs/ARCHITECTURE.md §5.5).
export const PROVIDER_VERSION = "0.1.0";
