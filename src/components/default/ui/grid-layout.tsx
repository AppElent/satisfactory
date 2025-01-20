import { Grid } from '@mui/material';

interface GridLayoutProps {
  containerProps?: any;
  itemProps?: any;
  items: any[];
}

const GridLayout = ({ containerProps, itemProps, items }: GridLayoutProps) => {
  return (
    <Grid
      container
      spacing={1}
      {...containerProps}
    >
      {items.map((item, index) => {
        return (
          <Grid
            item
            xs={12}
            md={6}
            lg={4}
            {...itemProps}
            key={index}
          >
            {item}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GridLayout;
