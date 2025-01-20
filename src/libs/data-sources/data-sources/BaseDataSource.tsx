import { faker } from '@faker-js/faker';
import * as yup from 'yup';
import { DataSourceInitOptions, FilterObject } from '..';

interface validateOptions extends yup.ValidateOptions {
  full?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string[]>;
  values: any;
}

/**
 * BaseDataSource class provides methods to interact with data sources and generate dummy data based on Yup schemas.
 * @template T - The type of the data source.
 */
class BaseDataSource<T> {
  protected defaultOptions = {
    targetMode: 'collection' as const,
    subscribe: false,
  };
  options: DataSourceInitOptions<T>;
  providerConfig: any;
  provider: string;

  /**
   * Constructs a new instance of BaseDataSource.
   * @param {DataSourceInitOptions<T>} options - Initialization options for the data source.
   * @param {any} providerConfig - Configuration for the data provider.
   */
  constructor(options: DataSourceInitOptions<T>, providerConfig: any) {
    if (new.target === BaseDataSource) {
      throw new TypeError('Cannot construct BaseDataSource instances directly');
    }
    this.provider = 'Base';
    this.providerConfig = providerConfig;
    this.options = {
      ...this.defaultOptions,
      ...options,
    };
  }

  // /**
  //  * Helper function to validate email format.
  //  * @param {string} email - The email to validate.
  //  * @returns {boolean} - True if the email is valid, false otherwise.
  //  */
  // #isValidEmail = (email: string): boolean => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // };

  // /**
  //  * Helper function to validate date format.
  //  * @param {string} date - The date to validate.
  //  * @returns {boolean} - True if the date is valid, false otherwise.
  //  */
  // #isValidDate = (date: string): boolean => {
  //   return !isNaN(new Date(date).getTime());
  // };

  /**
  //  * Validates the data against the schema.
  //  * @param {Partial<T>} data - The data to validate.
  //  * @param {validateOptions} [_options] - Additional validation options.
  //  * @throws Will throw an error if validation fails.
  //  */
  // #validateSchema = async (data: Partial<T>, _options?: validateOptions): Promise<void> => {
  //   if (this.options.schema) {
  //     const errors = [];
  //     for (const [key, rules] of Object.entries(this.options.schema)) {
  //       const value = (data as { [key: string]: any })[key];

  //       // Check required fields
  //       if (rules.required && (value === undefined || value === null)) {
  //         errors.push(`${key} is required.`);
  //         continue;
  //       }

  //       // Check data type
  //       if (rules.type) {
  //         switch (rules.type) {
  //           case 'string':
  //             if (typeof value !== 'string') errors.push(`${key} must be a string.`);
  //             break;
  //           case 'number':
  //             if (typeof value !== 'number') errors.push(`${key} must be a number.`);
  //             break;
  //           case 'boolean':
  //             if (typeof value !== 'boolean') errors.push(`${key} must be a boolean.`);
  //             break;
  //           case 'date':
  //             if (!this.#isValidDate(value)) errors.push(`${key} must be a valid date.`);
  //             break;
  //           case 'email':
  //             if (!this.#isValidEmail(value)) errors.push(`${key} must be a valid email.`);
  //             break;
  //           default:
  //             break;
  //         }
  //       }
  //     }

  //     if (errors.length > 0) {
  //       throw new Error(errors.join(' '));
  //     }
  //   }
  // };

  /**
   * Validates the data against the Yup schema.
   * @param {Partial<T>} data - The data to validate.
   * @param {validateOptions} [_options] - Additional validation options.
   * @throws Will throw an error if validation fails.
   */
  #validateYupSchema = async (
    data: Partial<T>,
    options?: validateOptions
  ): Promise<ValidationResult> => {
    const combinedOptions = { full: false, abortEarly: false, ...options };
    const returnObject: ValidationResult = {
      valid: true,
      errors: undefined,
      values: data,
    };
    if (this.options.YupValidationSchema) {
      try {
        const validationSchema = options?.full
          ? this.options.YupValidationSchema
          : (this.options.YupValidationSchema as yup.ObjectSchema<any>).pick(
              Object.keys(data) as (keyof typeof this.options.YupValidationSchema)[]
            );
        //await this.options.YupValidationSchema.validate(data, { abortEarly: false });
        await validationSchema.validate(data, combinedOptions);
      } catch (error: any) {
        if (error instanceof yup.ValidationError) {
          // Collect multiple errors for each path
          const errorMessages = error.inner.reduce((acc: Record<string, string[]>, err) => {
            if (err.path && !acc[err.path]) {
              acc[err.path] = [];
            }
            if (err.path) {
              acc[err.path].push(err.message);
            }
            return acc;
          }, {});
          console.error('Validation error', errorMessages);
          returnObject.valid = false;
          returnObject.errors = errorMessages;
          console.error('Validation error:', returnObject);
        } else {
          console.error('Unexpected error:', error);
          throw error;
        }
      } finally {
        console.log('VALIDATION', returnObject);
      }
    }
    return returnObject;
  };

  /**
   * Validates the data using both custom and Yup schemas.
   * @param {Partial<T>} data - The data to validate.
   * @param {validateOptions} [options] - Additional validation options.
   * @throws Will throw an error if validation fails.
   */
  validate = async (data: Partial<T>, options?: validateOptions): Promise<ValidationResult> => {
    //await this.#validateSchema(data, options);
    return await this.#validateYupSchema(data, options);
  };

  /**
   * Cleans the data by removing undefined values.
   * @param {Partial<T>} data - The data to clean.
   * @returns {Partial<T>} - The cleaned data.
   */
  // TODO: finish implementation
  cleanValues = (data: Partial<T>): Partial<T> => {
    const isObject = ['collection', 'document'].includes(this.options.targetMode || '');
    const cleanedData: any = isObject ? {} : data;
    if (isObject) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined || !this.options.cleanValues?.removeUndefined) {
          cleanedData[key] = value;
        }
      }
    }
    return cleanedData;
  };

  /**
   * Gets the default value based on the target mode.
   * @returns {any} - The default value.
   */
  protected _getDefaultValue = (): any => {
    let fallback;

    switch (this.options.targetMode) {
      case 'collection':
        fallback = [];
        break;
      case 'document':
        fallback = {};
        break;
      case 'string':
        fallback = '';
        break;
      case 'number':
        fallback = 0;
        break;
      case 'boolean':
        fallback = false;
        break;
      default:
        fallback = null;
        break;
    }
    return this.options.defaultValue || fallback;
  };

  /**
   * Generates test data based on a Yup schema.
   * @template T - The type of the object schema.
   * @param {YupSchema<T>} schema - The Yup schema to generate data for.
   * @returns {T} - The generated test data.
   */
  #generateDummyData = <T extends yup.AnyObject>(schema: any): T => {
    //const schema = this.options.YupValidationSchema as YupSchema<T>;
    const shape = schema.fields;
    const data: Partial<T> = {};

    Object.keys(shape).forEach((key) => {
      const field = shape[key];
      if (this.options.mockOptions?.schema?.[key]) {
        data[key as keyof T] = this.options.mockOptions?.schema?.[key]();
      } else if (field instanceof yup.StringSchema) {
        const minLength = (field.spec as any).min ?? 5;
        const maxLength = (field.spec as any).max ?? 20;
        data[key as keyof T] = faker.lorem.words(
          faker.number.int({ min: minLength, max: maxLength })
        ) as any;
      } else if (field instanceof yup.NumberSchema) {
        const min = (field.spec as any).min ?? 0;
        const max = (field.spec as any).max ?? 100;
        data[key as keyof T] = faker.number.int({ min, max }) as any;
      } else if (field instanceof yup.BooleanSchema) {
        data[key as keyof T] = faker.datatype.boolean() as any;
      } else if (field instanceof yup.DateSchema) {
        const minDate = (field.spec as any).min
          ? new Date((field.spec as any).min)
          : faker.date.past();
        const maxDate = (field.spec as any).max
          ? new Date((field.spec as any).max)
          : faker.date.future();
        data[key as keyof T] = faker.date.between({ from: minDate, to: maxDate }) as any;
      } else if (field instanceof yup.ArraySchema) {
        const itemType = (field as yup.ArraySchema<any, any, any, any>).innerType;
        const minItems = (field.spec as any).min ?? 1;
        const maxItems = (field.spec as any).max ?? 5;
        const length = faker.number.int({ min: minItems, max: maxItems });

        if (itemType instanceof yup.StringSchema) {
          data[key as keyof T] = Array.from({ length }, () => faker.lorem.word()) as any;
        } else if (itemType instanceof yup.NumberSchema) {
          data[key as keyof T] = Array.from({ length }, () => faker.number.int()) as any;
        }
      } else if (field instanceof yup.ObjectSchema) {
        data[key as keyof T] = this.#generateDummyData(field) as any;
      }
    });

    return data as T;
  };

  /**
   * Generates dummy data based on the Yup schema.
   * @param {number} [count=1] - The number of dummy data objects to generate.
   * @returns {T | T[]} - The generated dummy data.
   * @throws Will throw an error if YupValidationSchema is not provided or count is less than 1.
   */
  getDummyData = (count: number = 1): T | T[] => {
    if (!this.options.YupValidationSchema && !this.options.mockOptions?.schema) {
      throw new Error(
        'YupValidationSchema OR mockOptionsSchema is required to generate dummy data'
      );
    }
    if (count === 1) {
      return this.#generateDummyData(this.options.YupValidationSchema) as T;
    } else if (count > 1) {
      return Array.from({ length: count }, () => {
        return this.#generateDummyData(this.options.YupValidationSchema) as T;
      });
    } else {
      throw new Error('Count must be greater than 0');
    }
  };

  /**
   * Applies post-filters to the data.
   * @param {T[]} data - The data to filter.
   * @param {FilterObject<T>} filterConfig - The filter configuration.
   * @returns {Partial<T>[]} - The filtered data.
   */
  _applyPostFilters = (data: T[], filterConfig: FilterObject<T>): Partial<T>[] => {
    let result = data;
    const { limit, orderBy, pagination, filters, select } = filterConfig;

    if (filters) {
      result = result.filter((item) => {
        return Object.entries(filters!).every(([_key, value]) => {
          const itemValue = item[value.field as keyof T];
          const filterValue = typeof value.value === 'function' ? value.value() : value.value;
          return itemValue === filterValue;
        });
      });
    }

    if (orderBy) {
      result = result.sort((a, b) => {
        for (const { field, direction } of orderBy!) {
          if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
          if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    if (pagination) {
      const { page, pageSize } = pagination;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      result = result.slice(start, end);
    }

    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    if (select) {
      // result = result.map((item) => {
      //   const selectedItem: Partial<T> = {};
      //   this.select!.forEach((key) => {
      //     selectedItem[key] = item[key];
      //   });
      //   return selectedItem;
      // });
    }

    return result;
  };

  /**
   * Parses filters for the data source.
   * @throws Will throw an error if the method is not implemented.
   */
  protected _parseFilters = (): void => {
    throw new Error("Method '_parseFilters' is not implemented.");
  };

  /**
   * Retrieves a single data item.
   * @returns {Promise<T | null>} - The retrieved data item.
   * @throws Will throw an error if the method is not implemented.
   */
  async get(): Promise<T | null> {
    throw new Error("Method 'get' must be implemented.");
  }

  /**
   * Retrieves all data items.
   * @returns {Promise<T[]>} - The retrieved data items.
   * @throws Will throw an error if the method is not implemented.
   */
  async getAll(): Promise<T[]> {
    throw new Error("Method 'getAll' must be implemented.");
  }

  /**
   * Adds a new data item.
   * @param {T} _item - The data item to add.
   * @returns {Promise<T>} - The added data item.
   * @throws Will throw an error if the method is not implemented.
   */
  async add(_item: T): Promise<T> {
    throw new Error("Method 'add' must be implemented.");
  }

  /**
   * Updates an existing data item.
   * @param {Partial<T>} _data - The data to update.
   * @param {string} [_id] - The ID of the data item to update.
   * @returns {Promise<void>}
   * @throws Will throw an error if the method is not implemented.
   */
  async update(_data: Partial<T>, _id?: string): Promise<void> {
    throw new Error("Method 'update' must be implemented.");
  }

  /**
   * Sets a data item.
   * @param {T} _data - The data to set.
   * @param {string} [_id] - The ID of the data item to set.
   * @returns {Promise<void>}
   * @throws Will throw an error if the method is not implemented.
   */
  async set(_data: T, _id?: string): Promise<void> {
    throw new Error("Method 'set' must be implemented.");
  }

  /**
   * Deletes a data item.
   * @returns {Promise<void>}
   * @throws Will throw an error if the method is not implemented.
   */
  async delete(): Promise<void> {
    throw new Error("Method 'delete' must be implemented.");
  }
}

export default BaseDataSource;
