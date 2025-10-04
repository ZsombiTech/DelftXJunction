/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type RootState } from "../store";
import { userSlice } from "../slices/userSlice";
import { type User } from "../../types";

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginProps {
  email: string;
  password: string;
}

interface RegisterResponse {
  token: string;
  user: User;
}

interface RegisterProps {
  email: string;
  password: string;
  passwordConfirm: string;
  lastName: string;
  firstName: string;
  phoneNumber: string;
  language: string;
}

interface ForgotPasswordProps {
  email: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_APP_BACKEND_URL}/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.token;
      headers.set("Authorization", `Bearer ${token}`);

      return headers;
    },
  }),
  endpoints: (builder) => ({
    loginUser: builder.mutation<LoginResponse, LoginProps>({
      query(data) {
        return {
          url: "login",
          method: "POST",
          body: data,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          await dispatch(userSlice.actions.setUser(data.user));
          await dispatch(userSlice.actions.setToken(data.token));
        } catch (error: any) {
          // Error handling is now done in components to avoid duplicates
        }
      },
    }),

    registerUser: builder.mutation<RegisterResponse, RegisterProps>({
      query(data) {
        return {
          url: "register",
          method: "POST",
          body: data,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          await dispatch(userSlice.actions.setUser(data.user));
          await dispatch(userSlice.actions.setToken(data.token));
        } catch (error: any) {
          // Error handling is now done in components to avoid duplicates
        }
      },
    }),

    forgotPassword: builder.mutation<void, ForgotPasswordProps>({
      query(data) {
        return {
          url: "change_password",
          method: "POST",
          body: data,
        };
      },
    }),

    getMe: builder.query<LoginResponse, void>({
      query: () => {
        return {
          url: "",
          method: "GET",
          timeout: 5000,
        };
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          await dispatch(userSlice.actions.setUser(data.user));
        } catch (error) {
          await dispatch(userSlice.actions.logOut());
        }
      },
    }),
  }),
});

export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useForgotPasswordMutation,
  useLazyGetMeQuery,
} = userApi;
