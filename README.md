# template-vite-ts-react-app

Template for a Vite Typescript React app

# Creating template

1. Create vite app with

```
npm create vite@latest

```

2. Configs:

- tsconfig.app:
  - allowJs: true
  -
- vite.config:
  - @-root
- prettier.config - add
- Packages:
  - react-router-dom
  - prop-types
  - @mui/material
  - @mui/icons-material
  - @emotion/styled
  - react-helmet-async
  - firebase
  - formik
  - yup
  - @andypf/json-viewer
  - material-ui-confirm
  - use-query-params
  - react-easy-crop
- Devpackages:
  - prettier

3. main.tsx: HelmerProvider & BrowserRouter
4. App: Dashboard
5.

# Todo:

- TODO: Create mail datasource (with select etc)
- TODO: Create notion database datasource
- For recipe site:
  - TODO: Detail: Moeilijkheidsgraad, tijd, favorite, personen selector,
  - TODO: Overzicht: tijd,

# Default readme.md

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```

Default dependencies:

```
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
  },
  "devDependencies": {
    "@eslint/js": "^9.13.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "eslint": "^9.13.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.13",
    "globals": "^15.11.0",
    "typescript": "~5.6.2",
    "typescript-eslint": "^8.10.0",
    "vite": "^5.4.9"
  }

```

## Actions after starting template:

- Change title on HTML page
- Change package.json properties
- Change config folder
  Firebase configuration:

```
firebase init
# hosting
# public dir: dist

# create sites if needed
firebase hosting:sites:list
firebase hosting:sites:create appelent-stg
# Add targets
firebase target:apply hosting stg appelent-stg
firebase target:apply hosting prd appelent
```
