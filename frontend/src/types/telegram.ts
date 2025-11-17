export type Invoice = {
  id: string;
  userId: string;
  serverId: string;
  roleApplicableTime: number;
  token: string;
  expiresAt: Date;
};

export type User = {
  id: string;
  telegramId: string;
};

export type Server = {
  id: string;
  serverId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  costInUsdc: string;
};

export type MyServer = {
  id: string;
  serverId: string;
  serverName: string;
  walletAddresses: string;
};

export type RoleAssigned = {
  userId: string;
  username: string;
  txnLink: string;
  serverId: string;
  createdAt: Date;
  expiryTime: Date;
  active: boolean;
};
