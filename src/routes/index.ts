import { RouteObject } from 'react-router-dom';

export type CustomRouteObject = RouteObject & {
  id: string;
  label: string;
  Icon: JSX.Element;
  translationKey?: string;
  category?: string;
  children?: CustomRouteObject[];
};

export function generateRouteObjects(routes: CustomRouteObject[]): RouteObject[] {
  return routes.map(
    ({
      id: _id,
      Icon: _Icon,
      translationKey: _translationKey,
      category: _category,
      children,
      ...route
    }) => {
      const routeObject: RouteObject = {
        ...route,
      };
      if (children) {
        routeObject.children = generateRouteObjects(children);
      }
      return routeObject;
    }
  );
}

//TODO: fix circular import
