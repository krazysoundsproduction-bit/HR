import dotenv from "dotenv";

dotenv.config();

export type SupportedDatabase = "postgres" | "mysql" | "mongodb";

export interface AppEnv {
  nodeEnv: string;
  port: number;
  dbClient: SupportedDatabase;
  postgresUrl: string;
  mysqlUrl: string;
  mongodbUrl: string;
}

const supportedDatabases: SupportedDatabase[] = ["postgres", "mysql", "mongodb"];

const requestedClient = process.env.DB_CLIENT as SupportedDatabase | undefined;

export const env: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  dbClient: supportedDatabases.includes(requestedClient ?? "postgres") ? requestedClient ?? "postgres" : "postgres",
  postgresUrl: process.env.POSTGRES_URL ?? "******localhost:5432/hr",
  mysqlUrl: process.env.MYSQL_URL ?? "******localhost:3306/hr",
  mongodbUrl: process.env.MONGODB_URL ?? "mongodb://localhost:27017/hr"
};
