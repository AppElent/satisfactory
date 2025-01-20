import { Box, Button, Paper } from '@mui/material';
// import { useState } from 'react';
import { useData } from '@/libs/data-sources';
import DefaultPaperbasePage from './DefaultPaperbasePage';

interface Settings {
  test: string;
}

const Settings = () => {
  const settings = useData<Settings, Settings>('settings');
  console.log(settings);

  return (
    <DefaultPaperbasePage title="Settings">
      <Box sx={{ flexGrow: 1 }}>
        {/* <ReactJson
          src={JSON.stringify(getSatisfactoryDataNew())}
          theme="monokai"
        /> */}
        <Paper sx={{ margin: 'auto', overflow: 'hidden', py: 2, px: 2 }}>
          {JSON.stringify(settings.data)}
          <Button
            onClick={() => {
              settings.actions.set({ test: 'test' }, 'id1');
            }}
          >
            Add data
          </Button>
        </Paper>
      </Box>
    </DefaultPaperbasePage>
  );
};

export default Settings;
