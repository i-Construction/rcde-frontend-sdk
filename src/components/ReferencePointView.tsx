import { Box, Typography } from '@mui/material';
import { FC } from 'react';

export type ReferencePointViewProps = {
  point: {
    x: number;
    y: number;
    z: number;
  };
};

const ReferencePointView: FC<ReferencePointViewProps> = ({ point }) => {
  return (
    <Box
      component="div"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        alignContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          marginRight: 1,
          marginTop: '2px',
        }}
      >
        基準点
      </Typography>
      <code
        style={{
          fontSize: '0.75em',
        }}
      >
        ({truncate(point.x)}, {truncate(point.y)}, {truncate(point.z)})
      </code>
    </Box>
  );
};

const truncate = (n: number) => {
  return Math.floor(n * 10) / 10;
};

export { ReferencePointView };
