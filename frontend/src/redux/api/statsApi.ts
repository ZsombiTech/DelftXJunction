/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";

interface StatisticsResponse {
  total_trips: number;
  total_earnings: number;
  total_distance_km: number;
  total_duration_mins: number;
  average_rating: number | null;
  experience_months: number | null;
  trips:
    | Array<{
        ride_id: string;
        start_time: string | null;
        end_time: string | null;
        pickup_lat: number | null;
        pickup_lon: number | null;
        drop_lat: number | null;
        drop_lon: number | null;
        distance_km: number | null;
        duration_mins: number | null;
        surge_multiplier: number | null;
        fare_amount: number | null;
        net_earnings: number | null;
        tips: number | null;
        payment_type: string | null;
        date: string | null;
      }>[]
    | null;
}

interface EventsRequest {
  latitude: number;
  longitude: number;
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
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        }
      },
    }),
    fetchEvents: builder.mutation<any, EventsRequest>({
      query: (data) => ({
        url: "events",
        method: "GET",
        params: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      }),
      async onQueryStarted(_, {}) {
        try {
          // await dispatch(statsSlice.actions.setStatistics(data));
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      },
    }),
  }),
});

export const { useFetchStatisticsQuery, useFetchEventsMutation } = statsApi;
