import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { DataSource, DataSourceObject } from '.';

// interface DataProviderContextProps {
//   dataSources: DataSourceObject;
//   setDataSource: (key: string, dataSource: DataSource<any>) => void;
//   addDataSource: (key: string, dataSource: DataSource<any>) => void;
//   data: Record<string, any>;
//   loading: Record<string, boolean>;
//   error: Record<string, any>;
//   fetchData: (key: string, filter?: object) => Promise<void>;
//   subscribeToData: (key: string) => void;
//   subscriptions: Record<string, () => void>;
//   add: (key: string, item: any) => Promise<any>;
//   update: (key: string, data: any, id: string) => Promise<void>;
//   set: (key: string, data: any, id: string) => Promise<void>;
//   remove: (key: string, id: string) => Promise<void>;
// } // TODO: implement?

// Create a context for the data
export const DataContext = createContext<any>(undefined);

interface DataProviderProps {
  dataSources: DataSourceObject;
  children: ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ dataSources, children }) => {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, any>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, () => void>>({});
  const [dataSourcesState, setDataSourcesState] = useState(dataSources);

  const addDataSource = useCallback(
    (key: string, newDataSource: DataSource<any>) => {
      setDataSourcesState((prev) => ({ ...prev, [key]: newDataSource }));
    },
    [setDataSourcesState]
  );

  const setDataSource = useCallback((key: string, dataSource: DataSource<any>) => {
    setDataSourcesState((prev) => ({ ...prev, [key]: { ...prev[key], dataSource } }));
  }, []);

  const getDataSource = useCallback(
    (key: string) => {
      const dataSource = dataSourcesState[key];
      if (!dataSource) throw new Error(`Data source with key ${key} not found`);
      return dataSource;
    },
    [dataSourcesState]
  );

  const fetchData = useCallback(
    async (key: string, filter?: object) => {
      if (subscriptions[key]) return; // Skip if there is an active subscription
      setLoading((prev) => ({ ...prev, [key]: true }));
      setError((prev) => ({ ...prev, [key]: null }));
      try {
        const dataSource = getDataSource(key);
        const result =
          dataSource.options?.targetMode === 'collection'
            ? await dataSource.getAll(filter)
            : await dataSource.get();
        setData((prev) => ({ ...prev, [key]: result }));
      } catch (err) {
        setError((prev) => ({ ...prev, [key]: err }));
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [getDataSource, subscriptions]
  );

  const subscribeToData = useCallback(
    (key: string) => {
      if (subscriptions[key]) {
        subscriptions[key]();
      }

      try {
        const dataSource = getDataSource(key);
        const unsubscribe = dataSource.subscribe((newData: any) => {
          setData((prev) => ({ ...prev, [key]: newData }));
          setLoading((prev) => ({ ...prev, [key]: false }));
        });
        setSubscriptions((prev) => ({ ...prev, [key]: unsubscribe }));
      } catch (err) {
        setError((prev) => ({ ...prev, [key]: err }));
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [getDataSource, subscriptions]
  );

  const add = useCallback(
    async (key: string, item: any) => {
      const dataSource = getDataSource(key);
      const newItem = await dataSource.add(item);
      if (!subscriptions[key] && data[key]) {
        setData((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
      }
      return newItem;
    },
    [getDataSource, subscriptions, data]
  );

  const update = useCallback(
    async (key: string, data: any, id: string) => {
      const dataSource = getDataSource(key);
      const newData = await dataSource.update(data, id);
      if (!subscriptions[key] && data[key]) {
        setData((prev) => ({
          ...prev,
          [key]: prev[key].map((item: any) =>
            item.id === id && newData ? { ...item, ...(newData as object) } : item
          ),
        }));
      }
    },
    [getDataSource, subscriptions]
  );

  const set = useCallback(
    async (key: string, data: any, id: string) => {
      const dataSource = getDataSource(key);
      await dataSource.set(data, id);
      if (!subscriptions[key] && data[key]) {
        setData((prev) => ({
          ...prev,
          [key]: prev[key].map((item: any) => (item.id === id ? { ...item, ...data } : item)),
        }));
      }
    },
    [getDataSource, subscriptions]
  );

  const remove = useCallback(
    async (key: string, id: string) => {
      const dataSource = getDataSource(key);
      await dataSource.delete(id);
      if (!subscriptions[key] && data[key]) {
        setData((prev) => ({
          ...prev,
          [key]: prev[key].filter((item: any) => item.id !== id),
        }));
      }
    },
    [getDataSource, subscriptions, data]
  );

  useEffect(() => {
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    console.log('Data sources have new data', data);
  }, [data]);

  return (
    <DataContext.Provider
      value={{
        dataSources: dataSourcesState,
        setDataSource,
        addDataSource,
        data,
        loading,
        error,
        fetchData,
        subscribeToData,
        subscriptions,
        add,
        update,
        set,
        remove,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
