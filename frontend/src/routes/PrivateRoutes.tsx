import { type FC } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";

export const PrivateRoutes: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Dashboard />} />

        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};
