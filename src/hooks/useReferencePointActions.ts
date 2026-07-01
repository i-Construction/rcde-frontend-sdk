import { useCallback } from "react";
import { Vector3 } from "three";
import { useReferencePoint } from "../contexts/referencePoint";
import { GlobalStateContext } from "../contexts/state";

export type ReferencePointComponent = 0 | 1 | 2;

export const useReferencePointActions = () => {
  const state = GlobalStateContext.useSelector((s) => s);
  const actor = GlobalStateContext.useActorRef();
  const { point, change, save } = useReferencePoint();
  const isReferencePointMode = state.matches("reference_point");

  const openReferencePoint = useCallback(() => {
    actor.send({ type: "REFERENCE_POINT" });
  }, [actor]);

  const closeReferencePoint = useCallback(() => {
    actor.send({ type: "IDLE" });
  }, [actor]);

  const toggleReferencePoint = useCallback(() => {
    actor.send({ type: isReferencePointMode ? "IDLE" : "REFERENCE_POINT" });
  }, [actor, isReferencePointMode]);

  const changeReferencePointComponent = useCallback(
    (component: ReferencePointComponent, value: number) => {
      if (Number.isNaN(value)) return;

      const nextPoint = point.clone();
      nextPoint.setComponent(component, value);
      change(nextPoint);
    },
    [point, change]
  );

  const changeReferencePoint = useCallback(
    (nextPoint: Vector3) => {
      change(nextPoint);
    },
    [change]
  );

  const saveReferencePoint = useCallback(() => {
    save(point);
  }, [point, save]);

  return {
    point,
    isReferencePointMode,
    openReferencePoint,
    closeReferencePoint,
    toggleReferencePoint,
    changeReferencePointComponent,
    changeReferencePoint,
    saveReferencePoint,
  };
};
