import { useContext } from 'react';
import * as Yup from 'yup';
import DataProvider, { DataContext } from './DataProvider';
import useData from './useData';

export type WithOptionalId<T> = Omit<T, 'id'> & { id?: string };

export interface DataSourceInitOptions<T> {
  target: string;
  targetMode?: 'collection' | 'document' | 'number' | 'string' | 'boolean'; //TODO: implement
  targetFilter?: FilterObject<T>;
  subscribe?: boolean;
  YupValidationSchema?: Yup.AnySchema;
  schema?: Record<string, any>;
  defaultValue?: any;
  cleanValues?: {
    removeUndefined?: boolean;
  };
  mock?: boolean; //TODO: implement
  mockOptions?: {
    count?: number;
    schema?: {
      [key: string]: () => any;
    };
  };
}

export interface DataSourceObject {
  [key: string]: any;
}

// export interface DataSource<T> {
//   key: string;
//   dataSource: DataSourceSource<T>;
// }

export interface DataSourceActions<T, Z = T[]> {
  fetchData: (filter?: FilterObject<T>) => Promise<void>;
  getAll: (filter?: FilterObject<T>) => Promise<Z | null>;
  get: (id?: string) => Promise<T | null>;
  add: (item: WithOptionalId<T>) => Promise<T>;
  update: (data: Partial<WithOptionalId<T>>, id?: string) => Promise<T>;
  set: (data: WithOptionalId<T>, id?: string) => Promise<T>;
  delete: (id?: string) => Promise<void>;
  validate: (data: T) => Promise<boolean>;
  getDummyData: () => T;
}

// export interface UseDataReturn<T> {
//   // Options supplied to class constructor
//   options?: DataSourceInitOptions<T>;
//   providerConfig?: any;
//   // Data state
//   data: T;
//   loading: boolean;
//   error: any;
//   // Provider name
//   provider: string;
//   // Actions
//   actions: DataSourceActions<T>;
//   // Predefined methods
//   // getAll: (filter?: object) => Promise<T[]>;
//   // get: (id?: string) => Promise<T | null>;
//   // add: (item: T) => Promise<T>;
//   // update: (data: Partial<T>, id?: string) => Promise<void>;
//   // set: (data: T, id?: string) => Promise<void>;
//   // delete: (id?: string) => Promise<void>;
//   // Raw datasource info
//   dataSource: any;
//   // Custom props
//   custom?: {
//     [key: string]: any;
//   };
// }

export interface DataSource<T, Z = T[]> {
  //TODO: fix second generic type
  // Options supplied to class constructor
  options?: DataSourceInitOptions<T>;
  providerConfig?: any;
  // Data state
  data: Z;
  loading: boolean;
  error: any;
  // Provider name
  provider: string;
  // Actions
  actions: DataSourceActions<T, Z>;
  // Predefined methods
  // getAll: (filter?: object) => Promise<T[]>;
  // get: (id?: string) => Promise<T | null>;
  // add: (item: T) => Promise<T>;
  // update: (data: Partial<T>, id?: string) => Promise<void>;
  // set: (data: T, id?: string) => Promise<void>;
  // delete: (id?: string) => Promise<void>;
  // Raw datasource info
  dataSource: any;
  // Custom props
  custom?: {
    [key: string]: any;
  };
}

export type FilterOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'in'
  | 'not-in'
  | 'array-contains-any';

export interface FilterObject<T> {
  limit?: number;
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }[];
  pagination?: { page: number; pageSize: number };
  filters?: { field: keyof T; operator: FilterOperator; value: any }[];
  select?: (keyof T)[];
}

export interface FilterReturn<T> {
  provider: any;
  postFilter: FilterObject<T>;
}

export const useDataSources = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataSources must be used within a DataProvider');
  }
  return {
    dataSources: context.dataSources,
    addDataSource: context.addDataSource,
    setDataSource: context.setDataSource,
  };
};

export { DataProvider, useData };
