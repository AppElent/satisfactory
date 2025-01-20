// import { Outlet, RouteObject } from 'react-router-dom';

// import PaperbaseLayout from '@/layouts/paperbase/Layout';
// import HomePage from '@/pages/home';
// import MyRecipeOverviewPage from '@/pages/recipes/my-recipe-overview';
// import RecipeDetailsPage from '@/pages/recipes/recipe-details';
// import RecipeOverviewPage from '@/pages/recipes/recipe-overview';
import appRoutes from '@/routes/appRoutes';
import { Home as HomeIcon } from '@mui/icons-material';
import { RouteObject } from 'react-router-dom';
//import { PathItem } from './paths';

export type CustomRouteObject = RouteObject & {
  id: string;
  label: string;
  Icon: JSX.Element;
  translationKey?: string;
  category?: string;
  children?: CustomRouteObject[] | any;
};

export const routes: CustomRouteObject[] = [
  {
    id: 'home',
    label: 'Home',
    Icon: <HomeIcon fontSize="inherit" />,
    path: 'app',
    children: [
      {
        id: 'homeIndex',
        index: true,
      },
      // {
      //   id: 'recipes',
      //   label: 'Recipes',
      //   translationKey: 'foodhub:menu.allrecipes',
      //   Icon: <FlatwareIcon fontSize="inherit" />,
      //   category: 'recipes',
      //   path: 'recipes',
      //   element: <Outlet />,
      //   children: [
      //     {
      //       id: 'recipesIndex',
      //       index: true,
      //     },
      //     {
      //       id: 'myRecipes',
      //       label: 'My recipes',
      //       translationKey: 'foodhub:menu.myRecipes',
      //       Icon: <FlatwareIcon fontSize="inherit" />,
      //       category: 'recipes',
      //       path: 'my',
      //       element: <Outlet />,
      //       children: [
      //         {
      //           id: 'myRecipesIndex',
      //           index: true,
      //         },
      //         {
      //           id: 'myRecipeDetails',
      //           label: 'Recipe details',
      //           Icon: <FlatwareIcon fontSize="inherit" />,
      //           path: ':id',
      //         },
      //       ],
      //     },
      //     {
      //       id: 'recipeDetails',
      //       label: 'Recipe details',
      //       Icon: <FlatwareIcon fontSize="inherit" />,
      //       path: ':id',
      //     },
      //   ],
      // },
      // {
      //   id: 'satisfactory',
      //   label: 'Satisfactory',
      //   Icon: <BarChartIcon fontSize="inherit" />,
      //   // category: 'satisfactory',
      //   path: 'satisfactory',
      //   element: <Outlet />,
      //   children: [
      //     {
      //       id: 'satisfactoryIndex',
      //       index: true,
      //     },
      //     {
      //       id: 'satisfactoryCodex',
      //       label: 'Codex',
      //       Icon: <BarChartIcon fontSize="inherit" />,
      //       // category: 'satisfactory',
      //       path: 'codex',
      //       element: <Outlet />,
      //       children: [
      //         {
      //           id: 'codexIndex',
      //           index: true,
      //         },
      //         {
      //           id: 'products',
      //           label: 'Products',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'products',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'recipes',
      //           label: 'Recipes',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'recipes',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'generators',
      //           label: 'Generators',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'generators',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'buildables',
      //           label: 'Buildables',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'buildables',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'buildings',
      //           label: 'Buildings',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'buildings',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'schematics',
      //           label: 'Schematics',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'schematics',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'belts',
      //           label: 'Belts',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'belts',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'miners',
      //           label: 'Miners',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'miners',
      //           category: 'satisfactory',
      //         },
      //         {
      //           id: 'resources',
      //           label: 'Resources',
      //           Icon: <BarChartIcon fontSize="inherit" />,
      //           path: 'resources',
      //           category: 'satisfactory',
      //         },
      //       ],
      //     },
      //     {
      //       id: 'calculator',
      //       label: 'Calculator',
      //       Icon: <BarChartIcon fontSize="inherit" />,
      //       path: 'calculator',
      //       category: 'satisfactory',
      //     },
      //     {
      //       id: 'games',
      //       label: 'Games',
      //       Icon: <BarChartIcon fontSize="inherit" />,
      //       path: 'games',
      //       category: 'satisfactory',
      //     },
      //     {
      //       id: 'rawData',
      //       label: 'Raw data',
      //       Icon: <BarChartIcon fontSize="inherit" />,
      //       path: 'raw-data',
      //       category: 'satisfactory',
      //     },
      //   ],
      // },
      // {
      //   path: 'recipes/:id',
      //   element: <RecipeDetailsPage />,
      // },
      ...appRoutes,
    ],
  },
  //   ...defaultRoutes,
];

// const routes2 = generateRouteObjects(routes);
// console.log('ROUTES', routes2);

export const paths = getAllPaths(routes);

// Function to create a flat list of all paths with custom properties
function getAllPaths(routes: CustomRouteObject[], parentPath: string = ''): any[] {
  return routes.flatMap((route) => {
    const currentPath = route.path
      ? `${parentPath}/${route.path}`.replace(/\/+/g, '/')
      : parentPath;
    const { children, ...routeInfo } = route;
    const currentRoute = { ...routeInfo, to: currentPath };
    const childrenPaths = children ? getAllPaths(children, currentPath) : [];
    return [currentRoute, ...childrenPaths];
  });
}

export default routes;
