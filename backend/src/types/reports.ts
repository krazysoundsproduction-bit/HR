export interface ReportConfig {
  id: string;
  name: string;
  type: string;
  filters: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}
