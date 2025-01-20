// @ts-nocheck

import { DataSourceInitOptions } from '..';
import BaseDataSource from './BaseDataSource';

interface LocalStorageDataSourceProviderConfig {
  storageType?: 'localStorage' | 'sessionStorage';
}

export class LocalStorageDataSource extends BaseDataSource {
  storageKey: string;
  storage: Storage;
  subscribers: ((data: any) => void)[] = [];

  constructor(
    options: DataSourceInitOptions,
    providerConfig?: LocalStorageDataSourceProviderConfig
  ) {
    super(options, providerConfig);
    this.provider = 'LocalStorage';
    this.storageKey = options.target;
    this.storage = providerConfig?.storageType === 'sessionStorage' ? sessionStorage : localStorage;

    // Read initial data and notify subscribers
    const initialData = this.getData();
    this.notifySubscribers(initialData);
  }

  // Helper function to get data from storage
  private getData(): T {
    const data = this.storage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this._getDefaultValue();
  }

  // Helper function to save data to storage and notify subscribers
  private saveData(data: T): void {
    this.storage.setItem(this.storageKey, JSON.stringify(data));
    this.notifySubscribers(data);
    window.dispatchEvent(new Event('local-storage'));
  }

  // Notify all subscribers with the latest data
  private notifySubscribers(data: T): void {
    this.subscribers.forEach((callback) => callback(data));
  }

  // Get a single item by ID
  async get(id?: string): Promise<T | null> {
    const data = this.getData();
    if (this.options?.targetMode === 'document') {
      return data;
    }
    if (!id) throw new Error('ID is required for collection types');
    return data[id] || null;
  }

  // Get all items, with optional filters
  async getAll(filter: { [key: string]: any } = {}): Promise<T[]> {
    const data = this.getData();
    if (this.options?.targetMode === 'document') {
      return [data];
    }
    const items = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
    return items.filter((item) => {
      return Object.keys(filter).every((key) => item[key] === filter[key]);
    });
  }

  // Add a new item
  async add(item: T): Promise<T> {
    this.validate(item);
    if (this.options?.targetMode === 'document') {
      this.saveData(item);
      return item;
    }
    const data = this.getData() || [];
    const id = new Date().getTime().toString(); // Generate a simple unique ID
    data.push({ id, ...item });
    this.saveData(data);
    return { id, ...item };
  }

  // Update an existing item by ID
  async update(data?: T, id: any): Promise<void> {
    this.validate(data);
    if (this.options?.targetMode === 'document') {
      const newData = id ? { ...this.getData(), ...id } : { ...this.getData(), ...data };
      this.saveData(newData);
      return;
    }
    const existingData = this.getData();
    const itemIndex = existingData.findIndex((d: any) => d.id === id);
    if (itemIndex === -1) {
      throw new Error(`Item with ID ${id} does not exist.`);
    }

    existingData[itemIndex] = { ...existingData[itemIndex], ...data };
    this.saveData(existingData);
  }

  // Set an existing item by ID
  async set(data?: T, id?: any): Promise<void> {
    this.validate(data);
    if (this.options?.targetMode === 'document') {
      this.saveData(data);
      return;
    }
    const existingData = this.getData();
    const itemIndex = existingData.findIndex((d: any) => d.id === id);
    if (itemIndex === -1) {
      existingData.push({
        id,
        ...data,
      });
    } else {
      existingData[itemIndex] = data;
    }

    // existingData[itemIndex] = data;
    this.saveData(existingData);
  }

  // Delete an item by ID
  async delete(id?: string): Promise<void> {
    if (this.options?.targetMode === 'document') {
      this.storage.removeItem(this.storageKey);
      window.dispatchEvent(new Event('local-storage'));
      return;
    }
    const existingData = this.getData();
    const newData = existingData.filter((d: any) => d.id !== id);
    this.saveData(newData);
  }

  // Subscribe to changes in the storage data
  subscribe(callback: (data: any) => any) {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === this.storageKey || event.type === 'local-storage') {
        callback(this.getData());
      }
    };

    // call data
    callback(this.getData());

    // Listen for changes in storage from other documents
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom local-storage events within the same document
    window.addEventListener('local-storage', handleStorageChange);

    // Return a function to remove the event listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }
}

export default LocalStorageDataSource;
