import createWebStorage from "redux-persist/lib/storage/createWebStorage";

// Define the custom noop storage interface
interface NoopStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string | unknown): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Create a noop storage to simulate storage in environments where `window` is not available
const createNoopStorage = (): NoopStorage => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
   setItem(_key: string, _value: string | unknown)
{
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// Use the correct storage based on environment
const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

export default storage;
