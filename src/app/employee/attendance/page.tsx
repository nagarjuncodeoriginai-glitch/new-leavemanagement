"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock, LogIn, LogOut, CheckCircle2, XCircle,
  Timer, MapPin, ChevronLeft, ChevronRight,
  BarChart3, AlertCircle, Navigation, Wifi, WifiOff,
} from "lucide-react";

// Office Location: Kotla Arcade, Chitradurga, Karnataka
const OFFICE_LOCATION = {
  latitude: 14.2226,
  longitude: 76.3980,
  name: "Kotla Arcade, CK Pura, Chitradurga, Karnataka 577501",
  radiusMeters: 200, // 200m radius for check-in
};

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  status: "present" | "absent" | "late";
  hours: number;
  isAutoCheckin: boolean;
}

function getDistanceFromOffice(lat: number, lng: number): number {
  const R = 6371e3; // Earth radius in meters
  const p1 = (OFFICE_LOCATION.latitude * Math.PI) / 180;
  const p2 = (lat * Math.PI) / 180;
  const dLat = ((lat - OFFICE_LOCATION.latitude) * Math.PI) / 180;
  const dLng = ((lng - OFFICE_LOCATION.longitude) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getStorageKey(): string {
  const userData = localStorage.getItem("user");
  const empId = userData ? JSON.parse(userData).emp_id || "unknown" : "unknown";
  return `attendance_${empId}`;
}

function loadAttendance(): AttendanceRecord[] {
  try {
    const data = localStorage.getItem(getStorageKey());
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveAttendance(records: AttendanceRecord[]) {
  localStorage.setItem(getStorageKey(), JSON.stringify(records));
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState<"checking" | "in_office" | "outside" | "denied" | "unavailable">("checking");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Load attendance on mount
  useEffect(() => {
    setAttendance(loadAttendance());
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check location on mount and every 5 minutes
  const checkLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        const dist = getDistanceFromOffice(latitude, longitude);
        setDistance(Math.round(dist));
        setLocationStatus(dist <= OFFICE_LOCATION.radiusMeters ? "in_office" : "outside");
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    checkLocation();
    const interval = setInterval(checkLocation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkLocation]);

  // Auto check-in at 10:30 AM if in office
  useEffect(() => {
    if (locationStatus !== "in_office") return;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const today = getTodayStr();
    const todayRecord = attendance.find(r => r.date === today);

    if (hours === 10 && minutes >= 30 && minutes <= 35 && !todayRecord) {
      // Auto check-in
      const newRecord: AttendanceRecord = {
        date: today,
        checkIn: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        checkOut: null,
        checkInLocation: OFFICE_LOCATION.name,
        checkOutLocation: null,
        status: "present",
        hours: 0,
        isAutoCheckin: true,
      };
      const updated = [newRecord, ...attendance];
      setAttendance(updated);
      saveAttendance(updated);
    }
  }, [locationStatus, attendance, currentTime]);

  const todayRecord = attendance.find(r => r.date === getTodayStr());
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;

  const handleCheckIn = () => {
    if (!currentLocation) {
      checkLocation();
      return;
    }
    setCheckingIn(true);
    setTimeout(() => {
      const now = new Date();
      const today = getTodayStr();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 30);

      const locationName = locationStatus === "in_office"
        ? OFFICE_LOCATION.name
        : `Remote - ${distance}m from office (Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)})`;

      const existingIndex = attendance.findIndex(r => r.date === today);
      let updated: AttendanceRecord[];

      if (existingIndex >= 0) {
        updated = [...attendance];
        updated[existingIndex] = { ...updated[existingIndex], checkIn: timeStr, checkInLocation: locationName, status: isLate ? "late" : "present" };
      } else {
        const newRecord: AttendanceRecord = {
          date: today,
          checkIn: timeStr,
          checkOut: null,
          checkInLocation: locationName,
          checkOutLocation: null,
          status: isLate ? "late" : "present",
          hours: 0,
          isAutoCheckin: false,
        };
        updated = [newRecord, ...attendance.filter(r => r.date !== today)];
      }
      setAttendance(updated);
      saveAttendance(updated);
      setCheckingIn(false);
    }, 1500);
  };

  const handleCheckOut = () => {
    if (!todayRecord?.checkIn) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const locationName = currentLocation
      ? (locationStatus === "in_office" ? OFFICE_LOCATION.name : `Remote - ${distance}m from office`)
      : "Location unavailable";

    // Calculate hours
    const checkInParts = todayRecord.checkIn.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hoursWorked = 0;
    if (checkInParts) {
      let h = parseInt(checkInParts[1]);
      const m = parseInt(checkInParts[2]);
      const period = checkInParts[3];
      if (period) {
        if (period.toUpperCase() === "PM" && h !== 12) h += 12;
        if (period.toUpperCase() === "AM" && h === 12) h = 0;
      }
      const checkInDate = new Date();
      checkInDate.setHours(h, m, 0);
      hoursWorked = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    }

    const updated = attendance.map(r =>
      r.date === getTodayStr()
        ? { ...r, checkOut: timeStr, checkOutLocation: locationName, hours: Math.max(0, parseFloat(hoursWorked.toFixed(1))) }
        : r
    );
    setAttendance(updated);
    saveAttendance(updated);
  };

  // Stats
  const thisMonthRecords = attendance.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });
  const presentDays = thisMonthRecords.filter(a => a.status === "present").length;
  const lateDays = thisMonthRecords.filter(a => a.status === "late").length;
  const totalWorked = thisMonthRecords.filter(a => a.hours > 0).reduce((sum, a) => sum + a.hours, 0);
  const avgHours = (presentDays + lateDays) > 0 ? (totalWorked / (presentDays + lateDays)).toFixed(1) : "0.0";

  // Calendar
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const getDateStatus = (day: number): AttendanceRecord | null => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.find(a => a.date === dateStr) || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Attendance</h2>
        <p className="text-sm text-slate-500 mt-1">GPS-based check-in with live office location tracking</p>
      </div>

      {/* Check-in Card */}
      <motion.div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Clock */}
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold text-white font-mono tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-sm text-blue-200 mt-2">
                {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              {/* Location Status */}
              <div className="flex items-center gap-2 mt-3">
                {locationStatus === "in_office" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    <Navigation className="w-3 h-3" /> In Office ({distance}m)
                  </span>
                )}
                {locationStatus === "outside" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">
                    <MapPin className="w-3 h-3" /> Outside Office ({distance}m away)
                  </span>
                )}
                {locationStatus === "denied" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-medium">
                    <WifiOff className="w-3 h-3" /> Location Access Denied
                  </span>
                )}
                {locationStatus === "checking" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium">
                    <Wifi className="w-3 h-3 animate-pulse" /> Detecting Location...
                  </span>
                )}
              </div>
            </div>

            <div className="hidden md:block w-px h-20 bg-white/20" />

            {/* Check-in/out */}
            <div className="flex flex-col items-center gap-3">
              {!isCheckedIn ? (
                <motion.button onClick={handleCheckIn} disabled={checkingIn}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-2xl shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-500 transition-all flex items-center gap-3 disabled:opacity-50"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {checkingIn ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-6 h-6" />
                  )}
                  {checkingIn ? "Checking In..." : "Check In"}
                </motion.button>
              ) : (
                <motion.button onClick={handleCheckOut}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-lg shadow-2xl shadow-red-500/30 hover:from-red-400 hover:to-rose-500 transition-all flex items-center gap-3"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <LogOut className="w-6 h-6" /> Check Out
                </motion.button>
              )}
              {todayRecord?.checkIn && (
                <p className="text-xs text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Checked in at {todayRecord.checkIn}
                  {todayRecord.isAutoCheckin && " (Auto)"}
                </p>
              )}
              {todayRecord?.checkOut && (
                <p className="text-xs text-blue-300">Checked out at {todayRecord.checkOut} ({todayRecord.hours}h)</p>
              )}
            </div>

            {/* Office Info */}
            <div className="hidden lg:block ml-auto text-right">
              <p className="text-xs text-blue-200 font-medium">Office Location</p>
              <p className="text-[11px] text-blue-300/70 mt-1 max-w-[200px]">{OFFICE_LOCATION.name}</p>
              <p className="text-[10px] text-blue-400/50 mt-1">Auto check-in: 10:30 AM (if in office)</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Present Days", value: presentDays, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late Arrivals", value: lateDays, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Records", value: thisMonthRecords.length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg. Hours/Day", value: avgHours, icon: Timer, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <motion.div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Attendance Calendar</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
              <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">{monthNames[calendarMonth]} {calendarYear}</span>
              <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); }}
                className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth(calendarMonth, calendarYear) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
              const day = i + 1;
              const record = getDateStatus(day);
              const isToday = day === new Date().getDate() && calendarMonth === new Date().getMonth() && calendarYear === new Date().getFullYear();
              const dateObj = new Date(calendarYear, calendarMonth, day);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const isFuture = dateObj > new Date();
              return (
                <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  isToday ? "ring-2 ring-blue-500 ring-offset-1 bg-blue-50" :
                  record?.status === "present" ? "bg-emerald-50" :
                  record?.status === "late" ? "bg-amber-50" :
                  isWeekend ? "bg-slate-50" : ""
                }`}>
                  <span className={`${
                    isToday ? "text-blue-700 font-bold" :
                    isFuture ? "text-slate-300" :
                    isWeekend ? "text-slate-400" : "text-slate-700"
                  }`}>{day}</span>
                  {record && (
                    <div className={`w-2 h-2 rounded-full mt-0.5 ${
                      record.status === "present" ? "bg-emerald-500" : "bg-amber-500"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {[
              { label: "Present", color: "bg-emerald-500" },
              { label: "Late", color: "bg-amber-500" },
              { label: "Today", color: "bg-blue-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[11px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Records */}
        <motion.div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Records</h3>
            <span className="text-xs text-slate-400">{attendance.length} total</span>
          </div>
          {attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Clock className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No attendance records</p>
              <p className="text-xs mt-1">Your check-ins will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {attendance.slice(0, 15).map((record, i) => (
                <motion.div key={record.date} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    record.status === "present" ? "bg-emerald-50 border border-emerald-100" :
                    "bg-amber-50 border border-amber-100"
                  }`}>
                    {record.status === "present" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                     <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(record.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {record.checkIn}{record.checkOut ? ` - ${record.checkOut}` : " (active)"}
                      {record.isAutoCheckin && " [Auto]"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      record.status === "present" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                    }`}>{record.status}</span>
                    {record.hours > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">{record.hours}h</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Attendance Rate Footer */}
          {attendance.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-700">This Month</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {thisMonthRecords.length > 0 ? Math.round(((presentDays + lateDays) / thisMonthRecords.length) * 100) : 0}% attendance
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
