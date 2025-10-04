import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type User } from "../../types";

export interface UserState {
  user?: User;
  token?: string;
}

const initialState: UserState = {
  user: undefined,
  token: undefined,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logOut: (state) => {
      state.user = undefined;
      state.token = undefined;
      localStorage.removeItem("persist:auth");
    },
  },
});
