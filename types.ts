export interface Program {
  start: string;
  end: string;
  name: string;
  img: string;
  days?: number[];
  desc: string;
}

export interface TrackInfo {
  title: string;
  artist: string;
  cover: string;
  key: string;
  startTime: number;
}

export interface ScheduleStatus {
  current: Program | null;
  next1: Program | null;
  next2: Program | null;
  progress: number;
}

export interface PlayerState {
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}