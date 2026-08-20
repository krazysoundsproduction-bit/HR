import { AppEnv } from "./env.js";

export interface DatabaseRuntimeConfig {
  client: AppEnv["dbClient"];
  connectionUrl: string;
  healthLabel: string;
}

export const supportedDatabases = ["postgres", "mysql", "mongodb"] as const;

export function resolveDatabaseConfig(currentEnv: AppEnv): DatabaseRuntimeConfig {
  switch (currentEnv.dbClient) {
    case "mysql":
      return {
        client: "mysql",
        connectionUrl: currentEnv.mysqlUrl,
        healthLabel: "MySQL adapter configured"
      };
    case "mongodb":
      return {
        client: "mongodb",
        connectionUrl: currentEnv.mongodbUrl,
        healthLabel: "MongoDB adapter configured"
      };
    case "postgres":
    default:
      return {
        client: "postgres",
        connectionUrl: currentEnv.postgresUrl,
        healthLabel: "PostgreSQL adapter configured"
      };
  }
}
