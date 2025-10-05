import React from "react";
import { useScheduleQuery } from "../redux/api/timeslotApi";
import LoadingScreen from "../components/LoadingScreen";

export type Timeslot = {
  time: string;
  activity: string;
  instructor: string;
  duration: number;
  color: string;
};

export type DaySchedule = {
  day: string;
  slots: Timeslot[];
};

const TimeslotCard: React.FC<{ slot: Timeslot }> = ({ slot }) => {
  const heightStyle = {
    height: `${slot.duration * 4}rem`,
    minHeight: "4rem",
  };

  return (
    <div
      className={`p-3 rounded-lg shadow-sm border bg-uber-gray-300 text-uber-black transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between`}
      style={heightStyle}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-sm leading-tight">
          {slot.activity}
        </span>
        <span className="text-xs opacity-80 mt-0.5">{slot.instructor}</span>
      </div>
      <span className="text-xs font-medium self-end">{slot.time}</span>
    </div>
  );
};

const DailyScheduleMobile: React.FC<{ day: string; slots: Timeslot[] }> = ({
  day,
  slots,
}) => (
  <div className="p-4 bg-white shadow-xl rounded-xl mb-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
      {day}
    </h2>
    <div className="space-y-4">
      {slots.length > 0 ? (
        slots.map((slot, index) => (
          <div key={index}>
            <TimeslotCard slot={slot} />
          </div>
        ))
      ) : (
        <p className="text-gray-500 italic">No classes scheduled.</p>
      )}
    </div>
  </div>
);
export default function Timetable() {
  const { data: timetableData, isLoading } = useScheduleQuery();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const allTimeSlots = [
    "07.00",
    "08.00",
    "09.00",
    "10.00",
    "11.00",
    "12.00",
    "13.00",
    "14.00",
    "15.00",
    "16.00",
    "17.00",
    "18.00",
    "19.00",
    "20.00",
    "21.00",
    "22.00",
    "23.00",
    "24.00",
  ];
  const timeLabels = allTimeSlots
    .map((time, index, arr) => ({
      start: time,
      end: arr[index + 1] || "",
    }))
    .slice(0, -1);

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gray-50 font-sans">
      <header className="mb-8 p-4 bg-white shadow-md rounded-xl md:p-6">
        <h1 className="text-3xl font-bold text-uber-black">Driving Schedule</h1>
        <p className="mt-2 text-uber-gray-500">
          Find your next session and book your spot.
        </p>
      </header>

      <div className="md:hidden space-y-4">
        {timetableData!.map((daySchedule) => (
          <DailyScheduleMobile
            key={daySchedule.day}
            day={daySchedule.day}
            slots={daySchedule.slots}
          />
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-xl overflow-x-auto">
        <div
          className="min-w-full grid border-b border-gray-200"
          style={{
            gridTemplateColumns: `70px repeat(${timetableData!.length}, 1fr)`,
          }}
        >
          <div className="sticky left-0 z-10 bg-gray-100 p-3 font-semibold text-center text-sm text-gray-800 border-r border-gray-200">
            Time
          </div>
          {timetableData!.map((daySchedule) => (
            <div
              key={daySchedule.day}
              className="p-3 font-semibold text-center text-sm text-gray-800 border-r border-gray-200 last:border-r-0 bg-gray-100"
            >
              {daySchedule.day}
            </div>
          ))}

          {timeLabels.map((timeLabel, timeIndex) => (
            <React.Fragment key={timeIndex}>
              <div
                className="sticky left-0 z-10 p-2 text-center text-xs font-medium text-gray-600 bg-white border-r border-gray-200 border-b flex items-start justify-center"
                style={{ height: "4rem" }}
              >
                {timeLabel.start}
              </div>

              {timetableData!.map((daySchedule, dayIndex) => {
                const slotsInThisHour = daySchedule.slots.filter((slot) => {
                  const [startHour] = slot.time
                    .split(" - ")[0]
                    .split(":")
                    .map(Number);
                  const [labelHour] = timeLabel.start.split(":").map(Number);

                  return startHour === labelHour;
                });

                return (
                  <div
                    key={dayIndex}
                    className="p-1 border-b border-gray-200 border-r last:border-r-0 min-h-[4rem]"
                    style={{ position: "relative" }}
                  >
                    {slotsInThisHour.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="absolute inset-x-1"
                        style={{ top: "0" }}
                      >
                        <TimeslotCard slot={slot} />
                      </div>
                    ))}

                    {!slotsInThisHour.length && <div className="h-full"></div>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
