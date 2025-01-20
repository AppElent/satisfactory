import { LocaleObject } from 'yup';

export const languageOptions = {
  en: {
    icon: '/assets/flags/flag-uk.svg',
    label: 'English',
  },
  // de: {
  //   icon: '/assets/flags/flag-de.svg',
  //   label: 'German',
  // },
  // es: {
  //   icon: '/assets/flags/flag-es.svg',
  //   label: 'Spanish',
  // },
  nl: {
    icon: '/assets/flags/flag-nl.webp',
    label: 'Nederlands',
  },
};

export const localeSettings: LocaleObject = {
  mixed: {
    default: 'common:errors.default',
    required: ({ path }) => ({ key: 'common:errors.fieldRequired', values: { field: path } }),
    defined: ({ path }) => ({ key: 'common:errors.fieldDefined', values: { field: path } }),
    notNull: ({ path }) => ({ key: 'common:errors.fieldNotNull', values: { field: path } }),
    oneOf: ({ path, values }) => ({
      key: 'common:errors.fieldOneOf',
      values: { field: path, values },
    }),
    notOneOf: ({ path, values }) => ({
      key: 'common:errors.fieldNotOneOf',
      values: { field: path, values },
    }),
  },
  string: {
    // email: 'field_invalid_email',
    // url: 'field_invalid_url',
    length: ({ path, length }) => ({
      key: 'common:errors.stringLength',
      values: { field: path, length },
    }),
    min: ({ min, path }) => ({
      key: 'common:errors.fieldMin',
      values: { length: min, field: path },
    }),
    max: ({ max, path }) => ({
      key: 'common:errors.fieldMax',
      values: { length: max, field: path },
    }),
    email: ({ path }) => ({ key: 'common:errors.fieldEmail', values: { field: path } }),
    url: ({ path }) => ({ key: 'common:errors.fieldUrl', values: { field: path } }),
    uuid: ({ path }) => ({ key: 'common:errors.fieldUuid', values: { field: path } }),
    trim: ({ path }) => ({ key: 'common:errors.fieldTrim', values: { field: path } }),
    lowercase: ({ path }) => ({ key: 'common:errors.fieldLowercase', values: { field: path } }),
    uppercase: ({ path }) => ({ key: 'common:errors.fieldUppercase', values: { field: path } }),
  },
  number: {
    min: ({ min, path }) => ({
      key: 'common:errors.fieldMinValue',
      values: { length: min, field: path },
    }),
    max: ({ max, path }) => ({
      key: 'common:errors.fieldMaxValue',
      values: { length: max, field: path },
    }),
    lessThan: ({ path, less }) => ({
      key: 'common:errors.fieldMinValueLength',
      values: { field: path, length: less },
    }),
    moreThan: ({ path, more }) => ({
      key: 'common:errors.fieldMaxValueLength',
      values: { field: path, length: more },
    }),
    positive: ({ path }) => ({ key: 'common:errors.fieldPositive', values: { field: path } }),
    negative: ({ path }) => ({ key: 'common:errors.fieldNegative', values: { field: path } }),
    integer: ({ path }) => ({ key: 'common:errors.fieldInteger', values: { field: path } }),
  },
  date: {
    min: ({ min, path }) => ({
      key: 'common:errors.fieldMinDate',
      values: { length: min, field: path },
    }),
    max: ({ max, path }) => ({
      key: 'common:errors.fieldMaxDate',
      values: { length: max, field: path },
    }),
  },
  boolean: {
    isValue: ({ path, value }) => ({
      key: 'common:errors.fieldBoolean',
      values: { field: path, value },
    }),
  },
  object: {
    noUnknown: ({ path }) => ({ key: 'common:errors.fieldNoUnknown', values: { field: path } }),
  },
  array: {
    min: ({ min, path }) => ({
      key: 'common:errors.fieldMinArray',
      values: { length: min, field: path },
    }),
    max: ({ max, path }) => ({
      key: 'common:errors.fieldMaxArray',
      values: { length: max, field: path },
    }),
    length: ({ length, path }) => ({
      key: 'common:errors.fieldLengthArray',
      values: { length, field: path },
    }),
  },
  // use functions to generate an error object that includes the value from the schema
  // number: {
  //   min: ({ min }) => ({ key: 'field_too_short', values: { min } }),
  //   max: ({ max }) => ({ key: 'field_too_big', values: { max } }),
  // },
};

export const namespaces = ['foodhub'];
