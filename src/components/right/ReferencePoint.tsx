import { Close, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  List,
  ListItem,
  TextField,
} from '@mui/material';
import { ChangeEvent, FC, useCallback } from 'react';
import { useReferencePoint } from '../../contexts/referencePoint';
import { GlobalStateContext } from '../../contexts/state';

const ReferencePoint: FC = () => {
  const actor = GlobalStateContext.useActorRef();
  const { point, change, save } = useReferencePoint();

  const handleChange = useCallback(
    (component: number) => {
      return (e: ChangeEvent<HTMLInputElement>) => {
        const {
          target: { value },
        } = e;
        const n = Number(value);
        if (!Number.isNaN(n)) {
          const p = point.clone();
          p.setComponent(component, n);
          change(p);
        }
      };
    },
    [point, change]
  );

  const handleSaveClick = useCallback(() => {
    save(point);
  }, [point, save]);

  const handleCloseClick = useCallback(() => {
    actor.send({ type: "IDLE" });
  }, [actor]);

  return (
    <Box
      component="div"
      sx={{
        width: 1,
        height: 1,
      }}
    >
      <List>
        <ListItem>
          <FormControl
            sx={{
              width: 1,
            }}
          >
            <TextField
              id="x"
              label="X"
              size="small"
              fullWidth
              sx={{
                marginBottom: 1,
              }}
              type="number"
              value={point.x}
              onChange={handleChange(0)}
            />
            <TextField
              id="y"
              label="Y"
              size="small"
              fullWidth
              sx={{
                marginBottom: 1,
              }}
              type="number"
              value={point.y}
              onChange={handleChange(1)}
            />
            <TextField
              id="z"
              label="Z"
              size="small"
              fullWidth
              type="number"
              value={point.z}
              onChange={handleChange(2)}
            />
          </FormControl>
        </ListItem>
        <ListItem sx={{ display: "flex", flexDirection: "column" }}>
          <Button
            sx={{ marginBottom: 1 }}
            variant="contained"
            fullWidth
            startIcon={<Save />}
            onClick={handleSaveClick}
          >
            保存
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Close />}
            onClick={handleCloseClick}
          >
            閉じる
          </Button>
        </ListItem>
      </List>
    </Box>
  );
};

export { ReferencePoint };
