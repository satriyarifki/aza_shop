export type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN";
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "Bearer";
  user: User;
};
