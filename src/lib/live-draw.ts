export type LiveSlice = {
  boleto: number;
  nombre: string;
};

export type LiveEntry = LiveSlice & {
  intento: number;
};

export type LiveDrawPhase = "idle" | "spinning" | "revealing" | "ready" | "winner";

export type LiveDrawState = {
  active: boolean;
  phase: LiveDrawPhase;
  rotation: number;
  slices: LiveSlice[];
  eliminated: LiveEntry[];
  lastResult: LiveSlice | null;
  winner: LiveSlice | null;
  consolationPrize: string | null;
  attempt: number;
  totalAttempts: number;
  isResetting: boolean;
};

export const initialLiveDrawState: LiveDrawState = {
  active: false,
  phase: "idle",
  rotation: 0,
  slices: [],
  eliminated: [],
  lastResult: null,
  winner: null,
  consolationPrize: null,
  attempt: 1,
  totalAttempts: 1,
  isResetting: false,
};

export type LiveDrawAction =
  | { type: "spin"; slices: LiveSlice[]; rotation: number; attempt: number; totalAttempts: number; consolationPrize: string | null }
  | { type: "reveal-elimination"; entry: LiveEntry }
  | { type: "commit-elimination"; entry: LiveEntry }
  | { type: "reset" }
  | { type: "reset-complete" }
  | { type: "winner"; winner: LiveSlice };

export function liveDrawReducer(state: LiveDrawState, action: LiveDrawAction): LiveDrawState {
  switch (action.type) {
    case "spin":
      return {
        ...state,
        active: true,
        phase: "spinning",
        slices: action.slices,
        rotation: action.rotation,
        attempt: action.attempt,
        totalAttempts: action.totalAttempts,
        consolationPrize: action.consolationPrize,
        lastResult: null,
        winner: null,
        isResetting: false,
        eliminated: action.attempt === 1 ? [] : state.eliminated,
      };

    case "reveal-elimination":
      return {
        ...state,
        phase: "revealing",
        attempt: action.entry.intento,
        lastResult: action.entry,
        isResetting: false,
      };

    case "commit-elimination": {
      const alreadyCommitted = state.eliminated.some((entry) => entry.boleto === action.entry.boleto);
      return {
        ...state,
        eliminated: alreadyCommitted ? state.eliminated : [...state.eliminated, action.entry],
        slices: state.slices.filter((slice) => slice.boleto !== action.entry.boleto),
      };
    }

    case "reset":
      return { ...state, phase: "ready", rotation: 0, isResetting: true };

    case "reset-complete":
      return { ...state, isResetting: false };

    case "winner":
      return {
        ...state,
        phase: "winner",
        winner: action.winner,
        lastResult: null,
        consolationPrize: null,
        isResetting: false,
      };

    default:
      return state;
  }
}
