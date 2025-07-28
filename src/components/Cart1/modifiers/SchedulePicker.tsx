"use client";
import React from "react";
import { Calendar, Clock } from "lucide-react";

interface Props {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
}

const SchedulePicker: React.FC<Props> = ({ date, time, onDateChange, onTimeChange }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
    <h3 className="text-lg font-semibold text-black mb-3">Schedule Service</h3>
    <div className="grid grid-cols-1 gap-3">
      {/* date */}
      <div className="border rounded-lg p-3">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Date
        </label>
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full mt-1 focus:outline-none"
        />
      </div>
      {/* time */}
      <div className="border rounded-lg p-3">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time
        </label>
        <select
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full mt-1 focus:outline-none"
        >
          <option value="">Select time</option>
          <option value="09:00 AM">09:00 AM</option>
          <option value="11:00 AM">11:00 AM</option>
          <option value="02:00 PM">02:00 PM</option>
          <option value="04:00 PM">04:00 PM</option>
        </select>
      </div>
    </div>
  </div>
);

export default SchedulePicker;
