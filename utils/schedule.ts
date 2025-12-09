
import React from 'react';
import { Program, ScheduleStatus } from '../types';

// ==========================================
// 1. IMAGE CONFIGURATION
// ==========================================

// UPDATED: Images are served from root based on user feedback (praisefm.vercel.app/logo.webp)
const BASE_PATH = ""; 

// UPDATED: Switched program logos to .webp for better performance
export const images: Record<string, string> = {
  default: `${BASE_PATH}/images/logo.png`,
  donate: `${BASE_PATH}/images/donatelogo.png`,
  
  // Standardized filenames updated to .webp
  midnight: `${BASE_PATH}/images/midnightgracelogo.webp`,
  worship: `${BASE_PATH}/images/praisefmworship.png`,
  morning: `${BASE_PATH}/images/morningshowlogo.webp`,
  sunday: `${BASE_PATH}/images/logosundaymorning.png`,
  midday: `${BASE_PATH}/images/middaygracelogo.webp`,
  nonstop: `${BASE_PATH}/images/logononstop.png`,
  futureArtists: `${BASE_PATH}/images/logofutureartists.png`,
  carpool: `${BASE_PATH}/images/logocarpool.png`,
  pop: `${BASE_PATH}/images/logopop.png`,
  liveShow: `${BASE_PATH}/images/logoliveshow.png`,
  classics: `${BASE_PATH}/images/logoclassics.png`,
  livingMessage: `${BASE_PATH}/images/livingthemessage.png`,
  magazine: `${BASE_PATH}/images/magazinelogo.png`,
  
  nonstop: `${BASE_PATH}/images/logononstop.png`,
  futureArtists: `${BASE_PATH}/images/logofutureartists.png`,
  carpool: `${BASE_PATH}/images/logocarpool.png`,
  pop: `${BASE_PATH}/images/logopop.png`,
  liveShow: `${BASE_PATH}/images/logoliveshow.png`,
  classics: `${BASE_PATH}/images/logoclassics.png`,
  livingMessage: `${BASE_PATH}/images/livingthemessage.webp`,
  magazine: `${BASE_PATH}/images/logomagazine.webp`,
};

// ==========================================
// 2. ERROR HANDLING / FALLBACK
// ==========================================

export const fallbackImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.currentTarget;
  // Basic fallback if not using ProgramImage component
  if (!img.src.includes("android-chrome")) {
     img.src = '/android-chrome-192x192.png';
  }
};

// ==========================================
// 3. SCHEDULE CONFIGURATION
// ==========================================

export const scheduleData: Program[] = [
  {
    start: "00:00",
    end: "06:00",
    name: "Midnight Grace",
    img: images.midnight,
    desc: "Daniel Brooks lays down the most soothing overnight praise vibes."
  },
  {
    start: "06:00",
    end: "07:00",
    name: "Praise FM Worship",
    img: images.worship,
    desc: "Praise FM plays the finest worship music."
  },
  {
    start: "07:00",
    end: "12:00",
    name: "Morning Show",
    img: images.morning,
    days: [1,2,3,4,5,6],
    desc: "Stancy Campbell kickstarts your day with uplifting praise and inspiration."
  },
  {
    start: "07:00",
    end: "12:00",
    name: "Sunday Morning With Christ",
    img: images.sunday,
    days: [0],
    desc: "Matt Riley shares spiritual insights and Sunday music."
  },
  {
    start: "12:00",
    end: "13:00",
    name: "Praise FM Worship",
    img: images.worship,
    desc: "Praise FM plays the finest worship music."
  },
  {
    start: "13:00",
    end: "16:00",
    name: "Midday Grace",
    img: images.midday,
    desc: "Michael Ray brings grace and tunes through the midday."
  },
  {
    start: "16:00",
    end: "17:00",
    name: "Praise FM Non Stop",
    img: images.nonstop,
    desc: "Praise FM with non-stop praise hits."
  },
  {
    start: "17:00",
    end: "18:00",
    name: "Future Artists",
    img: images.futureArtists,
    desc: "Sarah Jordan presents emerging artists."
  },
  {
    start: "18:00",
    end: "20:00",
    name: "Praise FM Carpool",
    img: images.carpool,
    days: [1,2,3,4,5,6], 
    desc: "Rachael Harris with praise tunes for your drive home."
  },
  {
    start: "20:00",
    end: "21:00",
    name: "Praise FM POP",
    img: images.pop,
    days: [1,2,4,5,6,0],
    desc: "Jordan Reys with all things pop and contemporary praise."
  },
  {
    start: "20:00",
    end: "21:00",
    name: "Praise FM Live Show",
    img: images.liveShow,
    days: [3],
    desc: "Live show with special guests and spontaneous moments."
  },
  {
    start: "21:00",
    end: "22:00",
    name: "Praise FM Classics",
    img: images.classics,
    desc: "Scott Turner takes you back with timeless worship classics."
  },
  {
    start: "22:00",
    end: "22:30",
    name: "Living The Message",
    img: images.livingMessage,
    days: [0],
    desc: "Deep dive into scripture and daily application."
  },
  {
    start: "22:00",
    end: "00:00",
    name: "Praise FM Worship",
    img: images.worship,
    days: [1,2,3,4,5,6],
    desc: "Praise FM plays the finest worship music."
  },
  {
    start: "22:30",
    end: "00:00",
    name: "Praise FM Worship",
    img: images.worship,
    days: [0],
    desc: "Praise FM plays the finest worship music."
  }
];

// ==========================================
// 4. UTILITY FUNCTIONS
// ==========================================

const hosts: Record<string, string> = {
  "Morning Show": "Stancy Campbell",
  "Midday Grace": "Michael Ray",
  "Praise FM Carpool": "Rachael Harris",
  "Praise FM POP": "Jordan Reys",
  "Sunday Morning With Christ": "Matt Riley",
  "Midnight Grace": "Daniel Brooks",
  "Praise FM Non Stop": "Praise FM",
  "Praise FM Worship": "Praise FM",
  "Future Artists": "Sarah Jordan",
  "Praise FM Live Show": "Various Hosts",
  "Praise FM Classics": "Scott Turner",
  "Living The Message": "Various Hosts"
};

export const formatProgramName = (p: Program | null) => {
  if (!p) return "Praise FM";
  const base = p.name.replace(/ \([^)]*\)$/, '').trim();
  
  const simpleTitles = [
      "Praise FM Non Stop", 
      "Praise FM POP", 
      "Praise FM Magazine", 
      "Praise FM Worship", 
      "Future Artists", 
      "Praise FM Live Show", 
      "Praise FM Classics", 
      "Living The Message"
  ];
  
  if (simpleTitles.includes(base)) return base;
  const host = hosts[base];
  return host ? `${base} with ${host}` : base;
};

export const formatTimeRange = (p: Program | null) => {
  if (!p) return "";
  const [sh, sm] = p.start.split(":").map(Number);
  const [eh, em] = p.end.split(":").map(Number);
  
  const formatAmPm = (h: number, m: number) => {
      const suffix = h >= 12 ? "PM" : "AM";
      const hour12 = ((h + 11) % 12) + 1;
      return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  return `${formatAmPm(sh, sm)} - ${formatAmPm(eh, em)}`;
};

function getChicagoTime(): { day: number, mins: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'long'
  });

  const parts = formatter.formatToParts(new Date());
  
  let hour = 0;
  let minute = 0;
  let weekday = "";

  parts.forEach(p => {
      if(p.type === 'hour') hour = parseInt(p.value === '24' ? '0' : p.value, 10);
      if(p.type === 'minute') minute = parseInt(p.value, 10);
      if(p.type === 'weekday') weekday = p.value;
  });

  const mins = hour * 60 + minute;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayIndex = days.indexOf(weekday);

  return { day: dayIndex === -1 ? 0 : dayIndex, mins };
}

function timeToMins(t: string) { 
  const [h,m] = t.split(":").map(Number); 
  return h*60+m; 
}

export const getCurrentAndNext = (): ScheduleStatus => {
  const { day, mins } = getChicagoTime();
  
  let current: Program | null = null;
  const future: { prog: Program, startMins: number, dayDiff: number }[] = [];

  for (let d = 0; d <= 1; d++) {
      const checkDay = (day + d) % 7;
      
      for (const p of scheduleData) {
          if (p.days && !p.days.includes(checkDay)) continue;

          const s = timeToMins(p.start);
          const e = timeToMins(p.end);
          const end = e <= s ? e + 1440 : e; 
          
          if (d === 0) {
              if (mins >= s && mins < end) {
                  if (!current) current = p;
              }
          }

          let minutesFromNow = (s + (d * 1440)) - mins;
          if (minutesFromNow < 0) continue;
          
          if (p === current && d === 0) continue;

          future.push({ prog: p, startMins: minutesFromNow, dayDiff: d });
      }
  }

  future.sort((a, b) => a.startMins - b.startMins);

  if (!current) {
      current = {
          start: "00:00",
          end: "24:00",
          name: "Praise FM",
          img: images.default,
          desc: "Non-stop Praise & Worship"
      };
  }

  let progress = 0;
  if (current && current.start && current.end !== "24:00") {
      const s = timeToMins(current.start);
      const e = timeToMins(current.end);
      const end = e <= s ? e + 1440 : e;
      const total = end - s;
      const elapsed = mins - s;
      progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  return {
      current,
      next1: future[0]?.prog || null,
      next2: future[1]?.prog || null,
      progress
  };
};

export const getNextPrograms = (): Program[] => {
    const { day, mins } = getChicagoTime();
    const future: { prog: Program, startMins: number }[] = [];

    for (let d = 0; d <= 2; d++) {
        const checkDay = (day + d) % 7;
        
        for (const p of scheduleData) {
            if (p.days && !p.days.includes(checkDay)) continue;

            const s = timeToMins(p.start);
            const absoluteStart = s + (d * 1440);
            
            if (absoluteStart > mins) {
                future.push({ prog: p, startMins: absoluteStart });
            }
        }
    }

    future.sort((a, b) => a.startMins - b.startMins);
    return future.slice(0, 5).map(f => f.prog);
};
