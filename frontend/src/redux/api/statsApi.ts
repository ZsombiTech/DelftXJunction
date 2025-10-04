import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import { userSlice } from "../slices/userSlice";
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
      console.log(`${import.meta.env.VITE_APP_BACKEND_URL}/info/me`);
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
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Optionally, you can dispatch actions to store statistics in the Redux state
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        }
      },
    }),
  }),
});

export const { useFetchStatisticsQuery } = statsApi;
