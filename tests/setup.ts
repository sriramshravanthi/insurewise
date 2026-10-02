import "@testing-library/jest-dom/vitest";
// jsdom does not implement IndexedDB; this polyfills it for tests of the
// guest-storage layer (docs/DATA-MODEL.md §10).
import "fake-indexeddb/auto";
