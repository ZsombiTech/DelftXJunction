import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import { type Zone } from "../../types";

interface HeatmapZonesResponse extends Array<Zone> {}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const zonesApi = createApi({
  reducerPath: "zonesApi",
  baseQuery: fetchBaseQuery({
    // Use env var if set, otherwise fall back to localhost backend (common dev default).
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
      // Defensive transform: ensure we return an array of zones even if backend
      // returns unexpected content (HTML index page, etc.). This avoids the
      // "Unexpected token '<'" JSON parse crash in dev when VITE_API_URL is unset.
      transformResponse: (raw: unknown) => {
        if (Array.isArray(raw)) return raw as HeatmapZonesResponse;
        // If backend returned HTML or something else, log and return empty list
        // so UI can handle the absence of zones gracefully.
        // eslint-disable-next-line no-console
        console.warn("getHeatmapZones: unexpected response", raw);
        return [] as HeatmapZonesResponse;
      },
    }),
  }),
});

export const { useGetHeatmapZonesQuery } = zonesApi;
