import "@testing-library/jest-dom/vitest";
// jsdom does not implement IndexedDB; this polyfills it for tests of the
// guest-storage layer (docs/DATA-MODEL.md §10).
import "fake-indexeddb/auto";

// jsdom does not implement IntersectionObserver, which motion/react's
// `whileInView` (used for scroll-reveal animations) requires to mount.
// Minimal stub: components mount without observing anything, so
// whileInView-animated elements simply render in their initial state in
// tests rather than animating in — sufficient since no test asserts on
// mid-animation state.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
