// Simple in-memory event bus for UI events (lightweight)
const listeners = {};

export const EventBus = {
  on: (event, cb) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => { listeners[event] = listeners[event].filter(f => f !== cb); };
  },
  emit: (event, payload) => {
    (listeners[event] || []).slice().forEach(cb => {
      try { cb(payload); } catch (e) { /* ignore listener errors */ }
    });
  }
};

export default EventBus;
