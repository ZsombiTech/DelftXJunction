import type { FC } from "react";
import { Outlet } from "react-router-dom";

const MainLayout: FC = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default MainLayout;
