import { createMachine } from "xstate";

export const rootMachine = createMachine(
  {
    id: "root",
    initial: "idle",
    states: {
      idle: {},
      appearance: {},
      reference_point: {},
      metric: {
        initial: "idle",
        states: {
          idle: {},
          create: {},
          translate: {},
        },
      },
      modeling: {
        initial: "idle",
        states: {
          idle: {},
          sphere: {},
          cube: {},
        },
      },
      transform: {
        initial: "idle",
        states: {
          idle: {},
          position: {},
          rotation: {},
        },
      },
    },
    on: {
      IDLE: {
        target: ".idle",
      },
      APPEARANCE: {
        target: ".appearance",
      },
      REFERENCE_POINT: {
        target: ".reference_point",
      },
      CREATE_METRIC: {
        target: ".metric.create",
      },
      TRANSLATE_METRIC: {
        target: ".metric.translate",
      },
      MODELING_SPHERE: {
        target: ".modeling.sphere",
      },
      MODELING_CUBE: {
        target: ".modeling.cube",
      },
      TRANSFORM_POSITION: {
        target: ".transform.position",
      },
      TRANSFORM_ROTATION: {
        target: ".transform.rotation",
      },
    },
  },
  {
    actions: {},
  }
);
