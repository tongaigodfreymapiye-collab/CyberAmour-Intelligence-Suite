import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Trash2, BellRing, Globe as GlobeIcon, Cloud, Sun, CloudRain, Snowflake, CloudLightning, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { playAlarmSoundByType } from '../utils/sounds';

interface Alarm {
  id: string;
  time: string; // HH:mm format
  label: string;
  active: boolean;
  timezone?: string;
  soundType?: string;
}

const WeatherIcon = ({ code, size = 16 }: { code: number, size?: number }) => {
  if (code >= 95) return <CloudLightning size={size} className="text-danger" />;
  if (code >= 71 && code <= 77) return <Snowflake size={size} className="text-white" />;
  if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-primary" />;
  if (code >= 1 && code <= 3) return <Cloud size={size} className="text-text-dim" />;
  return <Sun size={size} className="text-accent" />;
};

const TimezoneWeather = ({ tz }: { tz: string }) => {
  const [weather, setWeather] = useState<{temp: number, code: number} | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const cityName = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`);
          const weatherData = await weatherRes.json();
          if (isMounted && weatherData.current) {
            setWeather({
              temp: Math.round(weatherData.current.temperature_2m),
              code: weatherData.current.weather_code
            });
          }
        }
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchWeather();
    return () => { isMounted = false; };
  }, [tz]);

  if (!weather) return <div className="text-xs text-text-dim opacity-50 flex items-center gap-1"><Cloud size={14} /> --°C</div>;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-white bg-bg/50 px-2 py-0.5 rounded-full border border-border/50">
      <WeatherIcon code={weather.code} size={12} />
      {weather.temp}°C
    </div>
  );
};

const AnalogClock = ({ time, tz }: { time: Date, tz: string }) => {
  let h = 0, m = 0, s = 0;
  try {
    const dStr = time.toLocaleString('en-US', { timeZone: tz });
    const d = new Date(dStr);
    h = d.getHours() % 12;
    m = d.getMinutes();
    s = d.getSeconds();
  } catch(e) {}
  
  const hourAngle = (h * 30) + (m * 0.5);
  const minuteAngle = m * 6;
  const secondAngle = s * 6;

  return (
    <div className="relative w-14 h-14 rounded-full border-2 border-border/80 bg-surface flex items-center justify-center shrink-0">
      {/* Hours */}
      <div 
        className="absolute w-1 bg-white origin-bottom rounded-full"
        style={{ height: '25%', bottom: '50%', transform: `rotate(${hourAngle}deg)` }}
      />
      {/* Minutes */}
      <div 
        className="absolute w-0.5 bg-text-dim origin-bottom rounded-full"
        style={{ height: '35%', bottom: '50%', transform: `rotate(${minuteAngle}deg)` }}
      />
      {/* Seconds */}
      <div 
        className="absolute w-px bg-danger origin-bottom rounded-full"
        style={{ height: '40%', bottom: '50%', transform: `rotate(${secondAngle}deg)` }}
      />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-accent z-10" />
    </div>
  );
};

// Helper to extract exact components of date/time in a specific timezone
function getTzDetails(date: Date, timezone: string) {
  try {
    const tzName = timezone && timezone !== 'Local' ? timezone : undefined;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '1970';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const second = parts.find(p => p.type === 'second')?.value || '00';
    
    return {
      dateKey: `${year}-${month}-${day}`,
      timeString: `${hour}:${minute}`,
      second: parseInt(second, 10)
    };
  } catch (e) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds();
    return {
      dateKey: `${year}-${month}-${day}`,
      timeString: `${hour}:${minute}`,
      second
    };
  }
}

// Helper to determine precise absolute millisecond timestamp for a wall-clock time in a timezone
function getAbsoluteTimeForAlarm(baseDate: Date, timeStr: string, timezone: string): number {
  const [targetHour, targetMin] = timeStr.split(':').map(Number);
  
  if (!timezone || timezone === 'Local') {
    const d = new Date(baseDate);
    d.setHours(targetHour, targetMin, 0, 0);
    return d.getTime();
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(baseDate);
    const tY = parseInt(parts.find(p => p.type === 'year')?.value || '1970', 10);
    const tM = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1;
    const tD = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const tH = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const tMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    
    const localWall = new Date(tY, tM, tD, tH, tMin, 0, 0);
    const offsetMs = baseDate.getTime() - localWall.getTime();
    
    const targetLocalWall = new Date(tY, tM, tD, targetHour, targetMin, 0, 0);
    return targetLocalWall.getTime() + offsetMs;
  } catch (e) {
    const d = new Date(baseDate);
    d.setHours(targetHour, targetMin, 0, 0);
    return d.getTime();
  }
}

// Checks if a candidate alarm conflicts with any existing ones (including cross-timezone conversion)
function checkAlarmConflict(
  proposedTime: string,
  proposedTimezone: string,
  existingAlarms: Alarm[],
  timeOffset: number
) {
  if (!proposedTime) return null;
  
  const now = new Date(Date.now() + timeOffset);
  const proposedMs = getAbsoluteTimeForAlarm(now, proposedTime, proposedTimezone);
  
  for (const alarm of existingAlarms) {
    if (!alarm.active) continue;
    
    const existingMs = getAbsoluteTimeForAlarm(now, alarm.time, alarm.timezone || 'Local');
    const diffMs = Math.abs(proposedMs - existingMs);
    const diffMins = diffMs / (60 * 1000);
    
    if (diffMs === 0) {
      return {
        type: 'exact' as const,
        message: `CLASH: Sounds at the exact same physical instant as "${alarm.label || 'Alarm'}" triggers at ${alarm.time} (${alarm.timezone || 'Local'}).`,
        alarm
      };
    } else if (diffMins <= 5) {
      return {
        type: 'window' as const,
        message: `OVERLAP: Sounds within ${Math.ceil(diffMins)} minutes of active alarm: "${alarm.label || 'Alarm'}" at ${alarm.time} (${alarm.timezone || 'Local'}).`,
        alarm
      };
    }
  }
  return null;
}

// Computes conflicts present among all saved active alarms
function getAlarmsWithConflicts(alarms: Alarm[], timeOffset: number) {
  const now = new Date(Date.now() + timeOffset);
  const withConflicts: Record<string, string> = {};
  
  for (let i = 0; i < alarms.length; i++) {
    if (!alarms[i].active) continue;
    const currentMs = getAbsoluteTimeForAlarm(now, alarms[i].time, alarms[i].timezone || 'Local');
    
    for (let j = 0; j < alarms.length; j++) {
      if (i === j || !alarms[j].active) continue;
      const otherMs = getAbsoluteTimeForAlarm(now, alarms[j].time, alarms[j].timezone || 'Local');
      const diffMs = Math.abs(currentMs - otherMs);
      const diffMins = diffMs / (60 * 1000);
      
      if (diffMs === 0) {
        withConflicts[alarms[i].id] = `Physical time clash with "${alarms[j].label || 'unlabeled'}" (${alarms[j].time} in ${alarms[j].timezone || 'Local'})`;
        break;
      } else if (diffMins <= 5) {
        withConflicts[alarms[i].id] = `Overlaps within ${Math.ceil(diffMins)}m of "${alarms[j].label || 'unlabeled'}" (${alarms[j].time} in ${alarms[j].timezone || 'Local'})`;
        break;
      }
    }
  }
  return withConflicts;
}

export function WorldClock() {
  const [timezones, setTimezones] = useState<string[]>(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']);
  const [newTimezone, setNewTimezone] = useState('');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmSound, setNewAlarmSound] = useState('default');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [use24Hour, setUse24Hour] = useState(true);
  const [showAnalog, setShowAnalog] = useState(true);
  
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedTimezoneForAlarm, setSelectedTimezoneForAlarm] = useState('');
  const [triggeredAlarms, setTriggeredAlarms] = useState<Alarm[]>([]);
  const [timeOffset, setTimeOffset] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const triggeredOccurrencesRef = useRef<Record<string, boolean>>({});
  const [activeAlarmElapsedTime, setActiveAlarmElapsedTime] = useState(0);

  // Gentle wake alarm loop with 10-second fade-in
  useEffect(() => {
    if (triggeredAlarms.length === 0) {
      setActiveAlarmElapsedTime(0);
      return;
    }

    const alarmToPlay = triggeredAlarms[0];
    const soundType = alarmToPlay.soundType || 'default';
    const startTime = Date.now();
    let lastPlayTime = 0;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      setActiveAlarmElapsedTime(Math.min(elapsed, 10));

      // Play sound immediately and then repeat every 2 seconds
      if (now - lastPlayTime >= 2000) {
        lastPlayTime = now;
        const volMult = Math.min(0.1 + (elapsed / 10) * 0.9, 1.0);
        playAlarmSoundByType(soundType, volMult);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [triggeredAlarms]);

  const alarmConflicts = React.useMemo(() => {
    return getAlarmsWithConflicts(alarms, timeOffset);
  }, [alarms, timeOffset]);

  const conflictWarning = React.useMemo(() => {
    const activeTz = selectedTimezoneForAlarm || 'Local';
    return checkAlarmConflict(newAlarmTime, activeTz, alarms, timeOffset);
  }, [newAlarmTime, selectedTimezoneForAlarm, alarms, timeOffset]);

  useEffect(() => {
    let isMounted = true;
    const fetchNTPTime = async () => {
      try {
        const start = performance.now();
        // Fallback or use worldtimeapi for NTP approximation
        const res = await fetch('https://worldtimeapi.org/api/ip');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        const end = performance.now();
        const roundTrip = end - start;
        const serverTime = new Date(data.utc_datetime).getTime();
        const localTime = Date.now();
        
        // Calculate the difference between server time and our local time
        // Including half of the round trip time as network latency estimation
        const trueTime = serverTime + (roundTrip / 2);
        if (isMounted) {
          setTimeOffset(trueTime - localTime);
          setIsSynced(true);
        }
      } catch (e) {
        console.error('Failed to sync with time server', e);
        // Retry after a minute if failed
        if (isMounted) setTimeout(fetchNTPTime, 60000);
      }
    };

    fetchNTPTime();
    // Resync every hour
    const syncInterval = setInterval(fetchNTPTime, 3600000);
    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // Apply offset to ensure high precision timing
      const now = new Date(Date.now() + timeOffset);
      setCurrentTime(now);
      
      // Check alarms against high precision NTP-synchronized time
      alarms.forEach(alarm => {
        const tzInfo = getTzDetails(now, alarm.timezone || 'Local');
        
        // We track triggers for a specific minute on a specific date (e.g., "14:00")
        const occurrenceKey = `${alarm.id}-${tzInfo.dateKey}-${tzInfo.timeString}`;

        if (alarm.active && alarm.time === tzInfo.timeString) {
          if (!triggeredOccurrencesRef.current[occurrenceKey]) {
            triggeredOccurrencesRef.current[occurrenceKey] = true;
            setTriggeredAlarms(prev => {
              if (prev.some(a => a.id === alarm.id)) return prev;
              return [...prev, alarm];
            });
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms, timeOffset]);

  const addTimezone = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTimezone && !timezones.includes(newTimezone)) {
      try {
        // Validate timezone
        new Intl.DateTimeFormat('en-US', { timeZone: newTimezone });
        setTimezones([...timezones, newTimezone]);
        setNewTimezone('');
      } catch (err) {
        alert('Invalid timezone identifier. Try format like America/Los_Angeles');
      }
    }
  };

  const removeTimezone = (tz: string) => {
    setTimezones(timezones.filter(t => t !== tz));
  };

  const addAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlarmTime) {
      setAlarms([...alarms, {
        id: Math.random().toString(36).substring(7),
        time: newAlarmTime,
        label: newAlarmLabel,
        active: true,
        timezone: 'Local',
        soundType: newAlarmSound
      }]);
      setNewAlarmTime('');
      setNewAlarmLabel('');
      setNewAlarmSound('default');
    }
  };

  const handleModalAlarmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlarmTime && selectedTimezoneForAlarm) {
      setAlarms([...alarms, {
        id: Math.random().toString(36).substring(7),
        time: newAlarmTime,
        label: newAlarmLabel,
        active: true,
        timezone: selectedTimezoneForAlarm,
        soundType: newAlarmSound
      }]);
      setNewAlarmTime('');
      setNewAlarmLabel('');
      setNewAlarmSound('default');
      setShowAlarmModal(false);
      setSelectedTimezoneForAlarm('');
    }
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const removeAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const handleDismissAlarm = (id: string) => {
    setTriggeredAlarms(prev => prev.filter(a => a.id !== id));
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
  };

  const handleSnoozeAlarm = (alarm: Alarm) => {
    setTriggeredAlarms(prev => prev.filter(a => a.id !== alarm.id));
    const [hoursStr, minutesStr] = alarm.time.split(':');
    let timeInMins = parseInt(hoursStr) * 60 + parseInt(minutesStr);
    timeInMins += 5;
    const newHours = Math.floor(timeInMins / 60) % 24;
    const newMins = timeInMins % 60;
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, time: newTime } : a));
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <header className="mb-8 relative">
        <div className="absolute top-0 right-0 flex items-center gap-2 text-xs">
          {isSynced ? (
            <div className="flex items-center gap-1.5 text-primary" title={`Synced with NTP server. Offset: ${timeOffset}ms`}>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              NTP Synced
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-text-dim" title="Synchronizing with NTP server...">
              <div className="w-2 h-2 rounded-full bg-text-dim animate-pulse" />
              Syncing...
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <Clock className="text-accent" size={32} />
          World Clock & Alarms
        </h1>
        <p className="text-text-dim mt-2">Monitor threat events across global timezones.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World Clocks Section */}
        <section className="bg-surface/50 border border-border p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <GlobeIcon className="text-primary" size={20} />
              Timezones
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnalog(!showAnalog)}
                className="text-xs bg-bg border border-border px-3 py-1.5 rounded hover:bg-surface transition-colors"
                title="Toggle Analog Clock"
              >
                {showAnalog ? 'Hide Analog' : 'Show Analog'}
              </button>
              <button
                onClick={() => setUse24Hour(!use24Hour)}
                className="text-xs bg-bg border border-border px-3 py-1.5 rounded hover:bg-surface transition-colors"
              >
                {use24Hour ? '12-Hour Format' : '24-Hour Format'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {timezones.map(tz => {
              let timeString = '';
              let dateString = '';
              try {
                timeString = new Intl.DateTimeFormat('en-US', {
                  timeZone: tz,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: !use24Hour
                }).format(currentTime);
                dateString = new Intl.DateTimeFormat('en-US', {
                  timeZone: tz,
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }).format(currentTime);
              } catch (e) {
                timeString = 'Error';
              }
              
              const cityName = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
              
              return (
                <div key={tz} className="bg-bg/50 border border-border/50 p-4 rounded-xl relative group flex flex-col justify-between">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      onClick={() => removeTimezone(tz)}
                      className="text-text-dim hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2 pr-6">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-white truncate max-w-[140px]">{cityName}</div>
                          <button 
                            onClick={() => {
                              setSelectedTimezoneForAlarm(tz);
                              setShowAlarmModal(true);
                            }}
                            className="text-text-dim hover:text-accent transition-colors shrink-0"
                            title="Set Alarm for this Timezone"
                          >
                            <BellRing size={16} />
                          </button>
                        </div>
                        <div className="text-xs text-text-dim truncate max-w-[150px]">{tz}</div>
                        <div className="mt-1">
                          <TimezoneWeather tz={tz} />
                        </div>
                      </div>
                      {showAnalog && <AnalogClock time={currentTime} tz={tz} />}
                    </div>
                    <div className="mt-auto pt-2 border-t border-border/30">
                      <div className="text-2xl font-mono text-white mb-0.5 font-bold">{timeString}</div>
                      <div className="text-xs text-text-dim">{dateString}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={addTimezone} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Asia/Singapore" 
              value={newTimezone}
              onChange={(e) => setNewTimezone(e.target.value)}
              className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
            <button type="submit" className="bg-primary hover:bg-primary-hover text-black p-2 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </form>
        </section>

        {/* Alarms Section */}
        <section className="bg-surface/50 border border-border p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <BellRing className="text-accent" size={20} />
              Alarms
            </h2>
            {isSynced && (
              <span className="text-[10px] uppercase font-mono tracking-wider text-primary border border-primary/20 bg-primary/10 rounded px-2 py-0.5 animate-pulse flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-primary" />
                NTP Trigger Engaged
              </span>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {alarms.length === 0 ? (
              <div className="text-center py-6 text-text-dim bg-bg/30 rounded-xl border border-border/30 border-dashed">
                No active alarms
              </div>
            ) : (
              alarms.map(alarm => (
                <motion.div 
                  layout
                  key={alarm.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${alarm.active ? 'bg-primary/5 border-primary/20' : 'bg-bg/30 border-border/30 opacity-60'}`}
                >
                  <div>
                    <div className="text-2xl font-mono font-bold text-white leading-none mb-1">{alarm.time}</div>
                    <div className="text-xs text-text-dim mt-1">
                      {alarm.timezone && alarm.timezone !== 'Local' ? (
                        <span className="text-accent border border-accent/20 bg-accent/10 rounded px-1.5 py-0.5 mr-2">
                          {alarm.timezone.split('/').pop()?.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-primary border border-primary/20 bg-primary/10 rounded px-1.5 py-0.5 mr-2">
                          Local Time
                        </span>
                      )}
                      {alarm.label && <span>{alarm.label}</span>}
                    </div>
                    {alarmConflicts[alarm.id] && (
                      <div className="mt-2 text-[10px] font-medium flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-2 py-1 max-w-xs text-left animate-pulse">
                        <span>⚠️</span>
                        <span>{alarmConflicts[alarm.id]}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleAlarm(alarm.id)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${alarm.active ? 'bg-primary' : 'bg-border'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${alarm.active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <button 
                      onClick={() => removeAlarm(alarm.id)}
                      className="text-text-dim hover:text-danger transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <form onSubmit={addAlarm} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 bg-bg/20 p-2 rounded-xl border border-border/40">
              <span className="text-xs text-text-dim font-medium ml-1">Presets:</span>
              <button
                type="button"
                onClick={() => { setNewAlarmTime('07:00'); setNewAlarmLabel('Wake up'); }}
                className="text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1 rounded-full text-white transition-all hover:border-accent flex items-center gap-1.5"
              >
                <span>🌅</span> Wake up (07:00)
              </button>
              <button
                type="button"
                onClick={() => { setNewAlarmTime('09:00'); setNewAlarmLabel('Work start'); }}
                className="text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1 rounded-full text-white transition-all hover:border-accent flex items-center gap-1.5"
              >
                <span>💼</span> Work start (09:00)
              </button>
              <button
                type="button"
                onClick={() => { setNewAlarmTime('14:00'); setNewAlarmLabel('Meeting'); }}
                className="text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1 rounded-full text-white transition-all hover:border-accent flex items-center gap-1.5"
              >
                <span>🤝</span> Meeting (14:00)
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="time" 
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                required
                className="bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
              <input 
                type="text" 
                placeholder="Alarm Label (Optional)" 
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <select 
                  value={newAlarmSound}
                  onChange={(e) => setNewAlarmSound(e.target.value)}
                  className="bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="default">Default</option>
                  <option value="chime">Chime</option>
                  <option value="siren">Siren</option>
                  <option value="subtle_beep">Subtle Beep</option>
                </select>
                <button
                  type="button"
                  onClick={() => playAlarmSoundByType(newAlarmSound)}
                  className="bg-bg border border-border hover:bg-surface text-text-dim hover:text-accent rounded-lg px-3 py-2 transition-colors flex items-center justify-center shrink-0"
                  title="Preview Sound"
                >
                  <Play size={16} className="fill-current" />
                </button>
              </div>
            </div>
            {conflictWarning && !showAlarmModal && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 text-left">
                <span className="text-sm mt-0.5">⚠️</span>
                <div>
                  <span className="font-bold block mb-0.5">Schedule Overlap Alert</span>
                  {conflictWarning.message}
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-accent hover:bg-accent/80 text-black font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Plus size={18} />
              Set Alarm
            </button>
          </form>
        </section>
      </div>

      {/* Alarm Setup Modal */}
      {showAlarmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <BellRing className="text-accent" size={20} />
              Set Alarm for {selectedTimezoneForAlarm.split('/').pop()?.replace(/_/g, ' ')}
            </h3>
            <form onSubmit={handleModalAlarmAdd} className="space-y-4">
              <div className="space-y-2 border-b border-border/40 pb-3">
                <span className="block text-xs font-semibold text-text-dim text-left">Quick Presets</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewAlarmTime('07:00'); setNewAlarmLabel('Wake up'); }}
                    className="flex-1 text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1.5 rounded-lg text-white transition-all hover:border-accent flex items-center justify-center gap-1.5"
                  >
                    🌅 Wake up
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewAlarmTime('09:00'); setNewAlarmLabel('Work start'); }}
                    className="flex-1 text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1.5 rounded-lg text-white transition-all hover:border-accent flex items-center justify-center gap-1.5"
                  >
                    💼 Work
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewAlarmTime('14:00'); setNewAlarmLabel('Meeting'); }}
                    className="flex-1 text-xs bg-bg hover:bg-surface border border-border px-2.5 py-1.5 rounded-lg text-white transition-all hover:border-accent flex items-center justify-center gap-1.5"
                  >
                    🤝 Meeting
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1 text-left">Time ({selectedTimezoneForAlarm} time)</label>
                <input 
                  type="time" 
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  required
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1 text-left">Label (Optional)</label>
                <input 
                  type="text" 
                  placeholder="E.g. Team Meeting" 
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1 text-left">Sound</label>
                <div className="flex gap-2">
                  <select 
                    value={newAlarmSound}
                    onChange={(e) => setNewAlarmSound(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="default">Default</option>
                    <option value="chime">Chime</option>
                    <option value="siren">Siren</option>
                    <option value="subtle_beep">Subtle Beep</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => playAlarmSoundByType(newAlarmSound)}
                    className="bg-bg border border-border hover:bg-surface text-text-dim hover:text-accent rounded-lg px-4 py-2 transition-colors flex items-center justify-center shrink-0"
                    title="Preview Sound"
                  >
                    <Play size={18} className="fill-current" />
                  </button>
                </div>
              </div>
              {conflictWarning && showAlarmModal && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 text-left">
                  <span className="text-sm mt-0.5">⚠️</span>
                  <div>
                    <span className="font-bold block mb-0.5">Schedule Overlap Alert</span>
                    {conflictWarning.message}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAlarmModal(false);
                    setNewAlarmTime('');
                    setNewAlarmLabel('');
                    setNewAlarmSound('default');
                  }}
                  className="flex-1 bg-bg hover:bg-surface border border-border text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-accent hover:bg-accent/80 text-black font-bold py-2 rounded-lg transition-colors">
                  Save Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Triggered Alarms Overlay */}
      {triggeredAlarms.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          {triggeredAlarms.map((alarm, index) => (
            <div 
              key={alarm.id} 
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: index }}
            >
              <div className="relative bg-surface/95 border border-accent/50 p-8 rounded-3xl w-full max-w-sm pointer-events-auto flex flex-col items-center animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)]">
                <BellRing size={64} className="text-accent mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-white text-center mb-2">ALARM</h2>
                <div className="text-xl text-primary font-mono font-bold mb-1">
                  {alarm.time} {alarm.timezone && alarm.timezone !== 'Local' ? `(${alarm.timezone.split('/').pop()?.replace(/_/g, ' ')})` : '(Local)'}
                </div>
                {alarm.label && <div className="text-lg text-text-dim text-center mb-4">{alarm.label}</div>}
                
                {/* Visual Volume Fade-in Progress Bar */}
                <div className="w-full bg-muted/20 border border-border/40 rounded-xl p-3 text-left mb-6">
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 text-text-dim">
                    <span className="flex items-center gap-1">
                      <span className={`${activeAlarmElapsedTime >= 10 ? 'text-primary' : 'text-accent animate-pulse'}`}>
                        {activeAlarmElapsedTime >= 10 ? '🔊 Maximum Volume' : '🔅 Gentle Wake (Fading In)'}
                      </span>
                    </span>
                    <span>{Math.round(Math.min(0.1 + (activeAlarmElapsedTime / 10) * 0.9, 1.0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-bg/50 h-1.5 rounded-full overflow-hidden border border-border/20">
                    <div 
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${Math.min(0.1 + (activeAlarmElapsedTime / 10) * 0.9, 1.0) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex w-full gap-4 mt-2">
                  <button 
                    onClick={() => handleDismissAlarm(alarm.id)}
                    className="flex-1 bg-bg hover:bg-bg/80 border border-border text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => handleSnoozeAlarm(alarm)}
                    className="flex-1 bg-accent hover:bg-accent/80 text-black font-bold py-3 rounded-xl transition-colors shadow-lg"
                  >
                    Snooze (5m)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
