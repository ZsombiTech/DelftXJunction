/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import type { DriverStats } from "../../services/chatgpt";

export const copilotApi = createApi({
  reducerPath: "copilotApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_APP_BACKEND_URL}/copilot`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      headers.set("Authorization", `Bearer ${token}`);

      return headers;
    },
  }),
  endpoints: (builder) => ({
    driverStats: builder.mutation<DriverStats, void>({
      query: () => ({
        url: "driver-stats",
        method: "GET",
      }),
      async onQueryStarted(_, {}) {
        try {
          // const { data } = await queryFulfilled;
          // Optionally, you can dispatch actions to store statistics in the Redux state
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch driver stats:", error);
        }
      },
    }),
  }),
});

export const { useDriverStatsMutation } = copilotApi;
