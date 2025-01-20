import { useTranslation } from 'react-i18next';

const NoImageAvailable = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        height: '160px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        color: '#888',
        fontSize: '14px',
      }}
    >
      {t('common:misc.noImageAvailable')}
    </div>
  );
};

export default NoImageAvailable;
