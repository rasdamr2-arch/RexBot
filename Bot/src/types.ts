import { Client } from "discord.js";

export interface CustomClient extends Client {
  i8?: string;
  commands?: any;
  db?: any;
  config?: any;
  lang?: any;
}
