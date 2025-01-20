import { useParams } from 'react-router-dom';
import config from '.';
import { paths } from './routing';

export interface PathItem {
  id: string;
  label: string;
  translationKey?: string;
  to?: string;
  Icon: React.ReactNode;
  loginRequired?: boolean;
  category?: string;
}

const debug = config.settings?.logLevel === 'debug';

// TODO: fix
interface MenuCategory {
  id: string;
  label: string;
  translationKey?: string;
  collapsed?: boolean;
  showInMenu?: boolean | (() => boolean);
}

const menuCategories: MenuCategory[] = [
  {
    id: 'settings',
    label: 'Settings',
    translationKey: 'common:menu.settings',
  },
  {
    id: 'test',
    label: 'Test pages',
    collapsed: true,
    showInMenu: debug,
  },
];

export const getPath = (id: string, params?: { [key: string]: string | undefined }) => {
  const path = paths.find((path) => path.id === id);
  if (!path) {
    return null;
  }
  const pathCopy = { ...path };
  if (params) {
    let newPath = path.to;
    Object.keys(params).forEach((key) => {
      newPath = newPath.replace(`:${key}`, params[key]);
    });
    pathCopy.to = newPath;
  }

  return pathCopy;
};

export const useCurrentPath = () => {
  const params = useParams();
  let windowPath = window.location.pathname;
  Object.keys(params).forEach((key) => {
    windowPath = windowPath.replace(params[key] as string, `:${key}`);
  });
  const path = paths.find((path) => path.to === windowPath);
  return path || null;
};

const generateMenu = () => {
  const menu = menuCategories
    .filter(
      (c) =>
        c.showInMenu === undefined ||
        (typeof c.showInMenu === 'boolean' ? c.showInMenu : c.showInMenu())
    )
    .map((category) => {
      const items = paths.filter((path) => path.category === category.id);

      return {
        id: category.id,
        label: category.label,
        translationKey: category.translationKey,
        collapsed: category.collapsed,
        children: items.map((item) => ({
          id: item.id,
          label: item.label,
          translationKey: item.translationKey,
          Icon: item.Icon,
          loginRequired: item.loginRequired,
          to: item.to,
        })),
      };
    });

  return menu;
};

export const menu = generateMenu();

console.log('PATHS', paths);

export default paths;
