/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import { type StatsEarner, type StatsRider } from "../../types";

interface StatisticsResponse {
  earner: StatsEarner;
  rider: StatsRider;
}

export const statsApi = createApi({
  reducerPath: "statsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_APP_BACKEND_URL}/info`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    fetchStatistics: builder.query<StatisticsResponse, void>({
      query: () => ({
        url: "me",
        method: "GET",
      }),
      async onQueryStarted(_, {}) {
        try {
          // Optionally, you can dispatch actions to store statistics in the Redux state
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        }
      },
    }),
    fetchEvents: builder.mutation<any, void>({
      query: () => ({
        url: "events",
        method: "GET",
      }),
      async onQueryStarted(_, {}) {
        try {
          // Optionally, you can dispatch actions to store statistics in the Redux state
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      },
    }),
  }),
});

export const { useFetchStatisticsQuery, useFetchEventsMutation } = statsApi;
