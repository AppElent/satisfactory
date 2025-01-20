import { faker } from '@faker-js/faker';
import * as yup from 'yup';

type YupSchema<T extends yup.AnyObject> = yup.ObjectSchema<T>;

/**
 * Generates test data based on a Yup schema.
 *
 * @template T - The type of the object schema.
 * @param {YupSchema<T>} schema - The Yup schema to generate data for.
 * @returns {T} - The generated test data.
 */
const generateTestData = <T extends yup.AnyObject>(schema: YupSchema<T>): T => {
  const shape = schema.fields;
  const data: Partial<T> = {};

  Object.keys(shape).forEach((key) => {
    const field = shape[key];

    if (field instanceof yup.StringSchema) {
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
      data[key as keyof T] = generateTestData(field) as any;
    }
  });

  return data as T;
};

export default generateTestData;
