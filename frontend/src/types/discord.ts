export type Invoice = {
  id: string;
  userId: string;
  serverId: string;
  roleId: string;
  roleApplicableTime: number;
  token: string;
  expiresAt: Date;
};

export type User = {
  id: string;
  discordId: string;
};

export type Server = {
  id: string;
  serverId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  defaultChannelId: string;
  channels: Channel[];
};

export type Channel = {
  id: string;
  channelId: string;
  costInUsdc: string;
  roleId: string;
  roleApplicableTime: number;
};

export type MyServer = {
  id: string;
  serverId: string;
  serverName: string;
  channelCount: number;
  walletAddresses: string;
};

export type RoleAssigned = {
  userId: string;
  roleId: string;
  username: string;
  txnLink: string;
  serverId: string;
  createdAt: Date;
  expiryTime: Date;
  active: boolean;
  channel: {
    roleName: string;
    roleApplicableTime: number;
    channelName: string;
    costInUsdc: string;
  };
};
