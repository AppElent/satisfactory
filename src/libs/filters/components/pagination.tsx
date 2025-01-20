import { Pagination as DPagination } from '@mui/material';

interface PaginationProps {
  filter: {
    pages: number;
    page: number;
    setPage: (page: number) => void;
  };
  muiPaginationProps?: PaginationProps;
}

const Pagination = ({ filter }: PaginationProps) => {
  //const pageOrZero = filter.page - 1 < 0 ? 0 : filter.page - 1;
  return (
    <DPagination
      count={filter.pages || 0}
      page={filter.page}
      onChange={(_e, newPage) => {
        filter.setPage(newPage);
      }}
    />
  );
};

export default Pagination;
