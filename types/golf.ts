export interface BallMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  timestamp: Date;
  hole: number;
  distance?: number;
  playerId?: string;
}

export interface Player {
  id: string;
  name: string;
  scores: number[];
  totalScore: number;
  parTotal: number;
  ballsTracked: number;
}

export interface Hole {
  number: number;
  par: number;
  distance: number;
  description?: string;
}

export interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  players: Player[];
  course: string;
  holes: Hole[];
  ballMarkers: BallMarker[];
  isActive: boolean;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  holes: Hole[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface GameStatistics {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  totalBallsTracked: number;
  averageGameTime: string;
  bestRound: GameSession | null;
}