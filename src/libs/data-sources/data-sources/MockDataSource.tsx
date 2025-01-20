import { DataSourceInitOptions } from '..';
import BaseDataSource from './BaseDataSource';

interface providerConfig<T> {
  count?: number;
  data?: T[];
}

type Callback = (data: any) => void;

/**
 * MockDataSource class extends BaseDataSource to provide specific implementations.
 * @template T - The type of the data source.
 */
export class MockDataSource<T> extends BaseDataSource<T> {
  private data: T[];
  private callbacks: Callback[] = [];

  /**
   * Constructs a new instance of MockDataSource.
   * @param {DataSourceInitOptions<T>} options - Initialization options for the data source.
   * @param {providerConfig} providerConfig - Configuration for the data provider.
   */
  constructor(options: DataSourceInitOptions<T>, providerConfig: providerConfig<T>) {
    super(options, providerConfig);
    this.data = [...(providerConfig.data || [])];
    if (providerConfig?.count && providerConfig.count > 0) {
      this.data.push(...(this.getDummyData(providerConfig.count) as T[]));
    }
  }

  /**
   * Retrieves a single data item.
   * @returns {Promise<T | null>} - The retrieved data item.
   */
  get = async (): Promise<T | null> => {
    return this.data.length > 0 ? this.data[0] : null;
  };

  /**
   * Retrieves all data items.
   * @returns {Promise<T[]>} - The retrieved data items.
   */
  getAll = async (): Promise<T[]> => {
    return this.data;
  };

  /**
   * Adds a new data item.
   * @param {T} item - The data item to add.
   * @returns {Promise<T>} - The added data item.
   */
  add = async (item: T): Promise<T> => {
    this.data.push(item);
    this.notifySubscribers(this.data);
    return item;
  };

  /**
   * Updates an existing data item.
   * @param {Partial<T>} data - The data to update.
   * @param {string} [id] - The ID of the data item to update.
   * @returns {Promise<void>}
   */
  update = async (data: Partial<T>, id?: string): Promise<void> => {
    const index = this.data.findIndex((item) => (item as any).id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...data };
    }
    this.notifySubscribers(this.data);
  };

  /**
   * Sets a data item.
   * @param {T} data - The data to set.
   * @param {string} [id] - The ID of the data item to set.
   * @returns {Promise<void>}
   */
  set = async (data: T, id?: string): Promise<void> => {
    const index = this.data.findIndex((item) => (item as any).id === id);
    if (index !== -1) {
      this.data[index] = data;
    } else {
      this.data.push(data);
    }
    this.notifySubscribers(this.data);
  };

  /**
   * Deletes a data item.
   * @param {string} id - The ID of the data item to delete.
   * @returns {Promise<void>}
   */
  delete = async (id?: string): Promise<void> => {
    this.data = this.data.filter((item) => (item as any).id !== id);
    this.notifySubscribers(this.data);
  };

  /**
   * Subscribes to data changes.
   * @param {Callback} callback - The callback to call when data changes.
   * @returns {Promise<void>}
   */
  subscribe = async (callback: Callback): Promise<void> => {
    this.callbacks.push(callback);
    this.notifySubscribers(this.data);
  };

  /**
   * Notifies all subscribers of data changes.
   * @private
   */
  private notifySubscribers = (data: any): void => {
    console.log(this.callbacks);
    this.callbacks.forEach((callback) => callback(data));
  };
}

export default MockDataSource;
