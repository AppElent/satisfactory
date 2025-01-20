import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

let titleSuffix;

export const setPageTitleSuffix = (suffix) => {
  titleSuffix = suffix;
};

export const Seo = (props) => {
  const { title } = props;

  const fullTitle = titleSuffix ? (title ? title + ' | ' + titleSuffix : titleSuffix) : title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
  );
};

Seo.propTypes = {
  title: PropTypes.string,
};
