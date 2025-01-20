import generateTestData from '@/utils/generate-test-data';
import * as Yup from 'yup';

export const issueYupSchema = Yup.object().shape({
  title: Yup.string().required('Title is required').default(''),
  description: Yup.string().required('Description is required').default(''),
  images: Yup.array().of(Yup.string()).optional().default([]),
});

export type Issue = Yup.InferType<typeof issueYupSchema>;

export const getIssueTestData = (count: number): Issue | Issue[] => {
  // If number is 1, return a single object
  if (count === 1) {
    return {
      ...generateTestData(issueYupSchema),
    };
  } else if (count > 1) {
    return Array.from({ length: count }, () => {
      return {
        ...generateTestData(issueYupSchema),
      };
    });
  } else {
    throw new Error('Count must be greater than 0');
  }
};

export const issueFields = {
  title: {
    name: 'title',
    label: 'Title',
  },
  description: {
    name: 'description',
    label: 'Description',
  },
};

// Or the other way around:
// let schema: Yup.ObjectSchema<Dummy> = dummyYupSchema;
