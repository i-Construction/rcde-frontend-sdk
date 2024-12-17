import { createActorContext } from "@xstate/react";
import { rootMachine } from "../states/rootMachine";

export const GlobalStateContext = createActorContext(rootMachine);
