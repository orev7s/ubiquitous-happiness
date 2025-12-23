export type InstanceType = 'free' | 'micro' | 'small' | 'medium' | 'large';

export interface KoyebAccount {
  id: number;
  api_key: string;
  app_id: string;
  name: string;
  instance_type: InstanceType;
  enabled: number;
  last_used_at: string | null;
  created_at: string;
}

export interface Deployment {
  id: number;
  user_id: string;
  service_id: string;
  service_name: string;
  koyeb_account_id: number;
  discord_token: string;
  discord_client_id: string;
  discord_owner_id: string;
  discord_guild_id: string | null;
  public_url: string | null;
  status: DeploymentStatus;
  created_at: string;
}

export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'stopped' | 'error' | 'deleted';

export interface DeploymentWithAccount extends Deployment {
  account_name: string;
}

export interface ServiceEnvVar {
  key: string;
  value: string;
}

export interface KoyebServiceDefinition {
  app_id: string;
  name: string;
  type: string;
  definition: {
    docker: {
      image: string;
    };
    env: ServiceEnvVar[];
    ports: Array<{ port: number; protocol: string }>;
    routes: Array<{ path: string; port?: number }>;
    instance_types: Array<{ type: string }>;
    regions?: string[];
    scaling?: {
      min: number;
      max: number;
    };
  };
}

export interface KoyebServiceResponse {
  service: {
    id: string;
    name: string;
    app_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export interface KoyebServiceDetails {
  id: string;
  name: string;
  status: string;
  app_id: string;
  created_at: string;
  updated_at: string;
  active_deployment?: {
    id: string;
    status: string;
    definition?: {
      env?: ServiceEnvVar[];
    };
  };
}

export interface KoyebDeploymentInfo {
  id: string;
  service_id: string;
  status: string;
  definition?: {
    env?: ServiceEnvVar[];
  };
}
