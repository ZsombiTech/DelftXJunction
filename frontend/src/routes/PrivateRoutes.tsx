import { type FC } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Timetable from "../pages/Timetable";
import EventPredicter from "../pages/EventPredicter";

export const PrivateRoutes: FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/eventpredicter" element={<EventPredicter />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Dashboard />} />

        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};
