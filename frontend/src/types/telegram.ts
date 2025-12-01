export type Invoice = {
  id: string;
  userId: string;
  serverId: string;
  serverTelegramId: string;
  roleApplicableTime: number;
  token: string;
  expiresOn: Date;
};

export type User = {
  id: string;
  telegramId: string;
};

export type Server = {
  id: string;
  serverTelegramId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  costInUsdc: string;
};

export type MyServer = {
  id: string;
  serverTelegramId: string;
  serverName: string;
  walletAddresses: string;
};

export type RoleAssigned = {
  userId: string;
  username: string;
  txnLink: string;
  serverId: string;
  createdAt: Date;
  expiresOn: Date;
  active: boolean;
};
