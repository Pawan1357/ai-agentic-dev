interface EnvironmentVariables {
  PORT?: string;
  MONGODB_URI?: string;
}

export function validateEnvironment(config: EnvironmentVariables): EnvironmentVariables {
  const normalized: EnvironmentVariables = {
    PORT: config.PORT ?? '3000',
    MONGODB_URI: config.MONGODB_URI ?? 'mongodb://localhost:27017/assessment',
  };

  const port = Number(normalized.PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Environment validation failed: PORT must be an integer between 1 and 65535');
  }

  if (!normalized.MONGODB_URI || !/^mongodb(\+srv)?:\/\//.test(normalized.MONGODB_URI)) {
    throw new Error('Environment validation failed: MONGODB_URI must be a valid MongoDB connection string');
  }

  return normalized;
}
