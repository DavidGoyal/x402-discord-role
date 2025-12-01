export type Invoice = {
  id: string;
  userId: string;
  serverId: string;
  roleId: string;
  serverDiscordId: string;
  roleApplicableTime: number;
  token: string;
  expiresOn: Date;
};

export type User = {
  id: string;
  discordId: string;
};

export type Server = {
  id: string;
  serverDiscordId: string;
  serverName: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  defaultChannelId: string;
  roles: Role[];
};

export type Role = {
  id: string;
  roleDiscordId: string;
  roleName: string;
  costInUsdc: string;
  roleApplicableTime: number;
};

export type MyServer = {
  id: string;
  serverDiscordId: string;
  serverName: string;
  roleCount: number;
  walletAddresses: string;
};

export type RoleAssigned = {
  userId: string;
  roleDiscordId: string;
  username: string;
  txnLink: string;
  serverDiscordId: string;
  createdAt: Date;
  expiresOn: Date;
  active: boolean;
  role: {
    roleName: string;
    roleApplicableTime: number;
    costInUsdc: string;
  };
};
