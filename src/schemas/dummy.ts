import generateTestData from '@/utils/generate-test-data';
import { faker } from '@faker-js/faker';
import * as Yup from 'yup';
// import { Schema } from '.';
// export const dummySchema: Schema = {
//   name: {
//     type: 'string',
//     required: true,
//     minLength: 3,
//   },
// };

export const dummyYupSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').min(3, 'Minimum 3 characters'),
  string: Yup.string().optional(),
  number: Yup.number().optional(),
  date: Yup.date().optional(),
  boolean: Yup.boolean().optional(),
  array: Yup.array().of(Yup.string().required()).optional(),
  object: Yup.object()
    .shape({
      stringKey: Yup.string().required('Key is required').min(3, 'Minimum 3 characters'),
      numberKey: Yup.number()
        .required('Key is required')
        .min(0, 'Minimum 0')
        .max(100, 'Maximum 100'),
      booleanKey: Yup.boolean().required('Key is required').default(false),
    })
    .optional(),
});

export type Dummy = Yup.InferType<typeof dummyYupSchema>;

export interface DummyWithId extends Dummy {
  id: string;
}

export default interface DummyBackup {
  name: string;
  number?: number;
  date?: Date;
  boolean?: boolean;
  array?: string[];
  object?: {
    stringKey: string;
    numberKey: number;
    booleanKey: boolean;
  };
}

export const dummyMockSchema = {
  name: () => faker.word.verb() + ' ' + faker.word.noun(),
};

export const getDummyTestData = (count: number): Dummy | Dummy[] => {
  // If number is 1, return a single object
  if (count === 1) {
    return {
      ...generateTestData(dummyYupSchema),
      name: faker.word.verb() + ' ' + faker.word.noun(),
    };
  } else if (count > 1) {
    return Array.from({ length: count }, () => {
      return {
        ...generateTestData(dummyYupSchema),
        name: faker.word.verb() + ' ' + faker.word.noun(),
      };
    });
  } else {
    throw new Error('Count must be greater than 0');
  }
};

// Or the other way around:
// let schema: Yup.ObjectSchema<Dummy> = dummyYupSchema;

export const DummyClass = class DummyClass implements Dummy {
  id: string;
  name: string;
  string?: string;
  number?: number;
  date?: Date;
  boolean?: boolean;
  array?: string[];
  object?: {
    stringKey: string;
    numberKey: number;
    booleanKey: boolean;
  };

  constructor(dummy: DummyWithId) {
    this.id = dummy.id;
    this.name = dummy.name;
    this.string = dummy.string;
    this.number = dummy.number;
    this.date = dummy.date;
    this.boolean = dummy.boolean;
    this.array = dummy.array;
    this.object = dummy.object;
  }

  toString = () => {
    return this.name;
  };

  toObject = () => {
    return {
      id: this.id,
      name: this.name,
      string: this.string,
      number: this.number,
      date: this.date,
      boolean: this.boolean,
      array: this.array,
      object: this.object,
    };
  };
};

export const dummyConverter = {
  fromFirestore: (snapshot: any) => {
    const data = snapshot.data();
    return new DummyClass({ ...data, id: snapshot.id });
  },
  toFirestore: (dummy: Dummy) => {
    const { name, string, number, date, boolean, array, object } = dummy;
    return { name, string, number, date, boolean, array, object };
  },
};
