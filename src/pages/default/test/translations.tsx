import { Button } from '@mui/material';
import i18next from 'i18next';
import { showTranslations } from 'translation-check';
import DefaultPage from '../DefaultPage';

const Translations = () => {
  return (
    <DefaultPage>
      <Button
        variant="contained"
        onClick={() => showTranslations(i18next)}
      >
        Show translations
      </Button>
    </DefaultPage>
  );
};

export default Translations;
