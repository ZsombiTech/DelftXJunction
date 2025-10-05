/* eslint-disable @typescript-eslint/no-empty-object-type */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import { type Zone } from "../../types";

interface HeatmapZonesResponse extends Array<Zone> {}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const zonesApi = createApi({
  reducerPath: "zonesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getHeatmapZones: builder.query<HeatmapZonesResponse, void>({
      query: () => "/heatmap/zones",
      transformResponse: (raw: unknown) => {
        if (Array.isArray(raw)) return raw as HeatmapZonesResponse;
        console.warn("getHeatmapZones: unexpected response", raw);
        return [] as HeatmapZonesResponse;
      },
    }),
  }),
});

export const { useGetHeatmapZonesQuery } = zonesApi;
