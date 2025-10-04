import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";

interface Timeslot {
  timeslot_id: number;
  user_id: number;
  earner_id?: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

interface StartTimeslotResponse {
  timeslot_id: number;
  user_id: number;
  start_time: string;
  is_active: boolean;
}

interface EndTimeslotResponse {
  timeslot_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ActiveTimeslotResponse {
  active_timeslot: Timeslot | null;
  timeslot_id?: number;
  user_id?: number;
  start_time?: string;
  is_active?: boolean;
}

interface ScheduleResponse {
  day: string;
  slots: {
    time: string;
    activity: string;
    instructor: string;
    duration: number;
    color: string;
  }[];
}

export const timeslotApi = createApi({
  reducerPath: "timeslotApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_APP_BACKEND_URL}/timeslots`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    startTimeslot: builder.mutation<StartTimeslotResponse, void>({
      query() {
        return {
          url: "/start",
          method: "POST",
        };
      },
    }),
    endTimeslot: builder.mutation<EndTimeslotResponse, number>({
      query(timeslotId) {
        return {
          url: `/end/${timeslotId}`,
          method: "POST",
        };
      },
    }),
    getActiveTimeslot: builder.query<ActiveTimeslotResponse, void>({
      query() {
        return {
          url: "/active",
          method: "GET",
        };
      },
    }),
    schedule: builder.query<ScheduleResponse[], void>({
      query() {
        return {
          url: "/schedule",
          method: "GET",
        };
      },
    }),
  }),
});

export const {
  useStartTimeslotMutation,
  useEndTimeslotMutation,
  useGetActiveTimeslotQuery,
  useLazyGetActiveTimeslotQuery,
  useScheduleQuery,
} = timeslotApi;
