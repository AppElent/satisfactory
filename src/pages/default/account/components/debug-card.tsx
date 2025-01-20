import { AppConfig, getLogLevel } from '@/config';
import { Card, CardContent, CardHeader, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';

const DebugCard = ({
  setDebug,
}: {
  setDebug: (level: AppConfig['settings']['logLevel']) => void;
}) => {
  const [logLevel, setLogLevel] = useState<AppConfig['settings']['logLevel']>(
    getLogLevel() || 'error'
  );

  useEffect(() => {
    setDebug(logLevel);
  }, [logLevel]);

  return (
    <Card>
      <CardHeader title="Debug Settings" />
      <CardContent>
        <TextField
          label="Log Level"
          value={logLevel}
          select
          fullWidth
          onChange={(e) => setLogLevel(e.target.value as AppConfig['settings']['logLevel'])}
        >
          <MenuItem value="error">Error</MenuItem>
          <MenuItem value="warn">Warn</MenuItem>
          <MenuItem value="info">Info</MenuItem>
          <MenuItem value="debug">Debug</MenuItem>
        </TextField>
      </CardContent>
    </Card>
  );
};

export default DebugCard;
