import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type StatsEarner, type StatsRider } from "../../types";

export interface StatsState {
  earnerStats?: StatsEarner;
  riderStats?: StatsRider;
}

const initialState: StatsState = {
  earnerStats: undefined,
  riderStats: undefined,
};

export const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {
    setEarnerStats: (state, action: PayloadAction<StatsEarner>) => {
      state.earnerStats = action.payload;
    },
    setRiderStats: (state, action: PayloadAction<StatsRider>) => {
      state.riderStats = action.payload;
    },
    clearStats: (state) => {
      state.earnerStats = undefined;
      state.riderStats = undefined;
    },
  },
});

export const { setEarnerStats, setRiderStats, clearStats } = statsSlice.actions;
export default statsSlice.reducer;
