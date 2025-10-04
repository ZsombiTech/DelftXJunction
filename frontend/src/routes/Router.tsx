import { type FC, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLazyGetMeQuery } from "../redux/api/userApi";
import { PrivateRoutes } from "./PrivateRoutes";
import { PublicRoutes } from "./PublicRoutes";

export const Router: FC = () => {
  const { isLoggedIn } = useAuth();

  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    if (isLoggedIn) {
      getMe();
    }
  }, [getMe, isLoggedIn]);

  if (isLoggedIn) {
    return <PrivateRoutes />;
  }

  return <PublicRoutes />;
};
