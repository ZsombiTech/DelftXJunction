import { useNavigate } from "react-router-dom";
import {
  useLoginUserMutation,
  useRegisterUserMutation,
  useForgotPasswordMutation,
} from "../redux/api/userApi";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { userSlice } from "../redux/slices/userSlice";

interface AuthError {
  message: string;
}

interface AuthResult {
  error?: AuthError;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loginUser] = useLoginUserMutation();
  const [registerUser] = useRegisterUserMutation();
  const [forgotPasswordMutation] = useForgotPasswordMutation();

  const token = useAppSelector((state) => state.user.token);

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      await loginUser({ email, password }).unwrap();
      return {};
    } catch (err: any) {
      return {
        error: {
          message:
            err?.data?.message ||
            "Failed to sign in. Please check your credentials.",
        },
      };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    language?: string
  ): Promise<AuthResult> => {
    try {
      await registerUser({
        email,
        password,
        passwordConfirm: password,
        firstName: firstName || "",
        lastName: lastName || "",
        phoneNumber: phoneNumber || "",
        language: language || "en",
      }).unwrap();
      return {};
    } catch (err: any) {
      return {
        error: {
          message:
            err?.data?.message || "Failed to create account. Please try again.",
        },
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      await forgotPasswordMutation({ email }).unwrap();
      return {};
    } catch (err: any) {
      return {
        error: {
          message:
            err?.data?.message ||
            "Failed to send reset link. Please try again.",
        },
      };
    }
  };

  const signOut = () => {
    dispatch(userSlice.actions.logOut());
    navigate("/login");
  };

  const isLoggedIn = token !== undefined;

  const user = useAppSelector((state) => state.user.user);

  return {
    signIn,
    signUp,
    resetPassword,
    isLoggedIn,
    signOut,
    user,
  };
};
