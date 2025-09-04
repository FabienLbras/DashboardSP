import { JSDOM } from "jsdom";

const { window } = new JSDOM("");
global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: "node.js",
};

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
