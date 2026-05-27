// Mock Chrome extension APIs for Jest
// storageData is accessed via closure by mock functions.
// Tests can reset via global.__resetChromeStorage().

let storageData = {};

global.__resetChromeStorage = () => {
  storageData = {};
};

global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === "string") {
            resolve({ [keys]: storageData[keys] });
          } else if (Array.isArray(keys)) {
            const result = {};
            keys.forEach((k) => (result[k] = storageData[k]));
            resolve(result);
          } else {
            resolve({ ...storageData });
          }
        });
      }),
      set: jest.fn((items) => {
        return new Promise((resolve) => {
          Object.assign(storageData, items);
          resolve();
        });
      }),
      remove: jest.fn((keys) => {
        return new Promise((resolve) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          arr.forEach((k) => delete storageData[k]);
          resolve();
        });
      }),
    },
    local: {
      get: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === "string") {
            resolve({ [keys]: storageData[keys] });
          } else if (Array.isArray(keys)) {
            const result = {};
            keys.forEach((k) => (result[k] = storageData[k]));
            resolve(result);
          } else {
            resolve({ ...storageData });
          }
        });
      }),
      set: jest.fn((items) => {
        return new Promise((resolve) => {
          Object.assign(storageData, items);
          resolve();
        });
      }),
      remove: jest.fn((keys) => {
        return new Promise((resolve) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          arr.forEach((k) => delete storageData[k]);
          resolve();
        });
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
};
