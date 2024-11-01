export interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  remaining: number;
  lastMigrated?: {
    id: string;
    timestamp: Date;
  };
  lastError?: {
    id: string;
    error: string;
    timestamp: Date;
  };
}

export interface DataConsistencyStats {
  prestamos: {
    old: number;
    new: number;
    inconsistencies: number;
  };
  pagos: {
    old: number;
    new: number;
    inconsistencies: number;
  };
  lastCheck: Date;
}
