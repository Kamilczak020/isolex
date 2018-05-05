import { BaseOptions } from 'noicejs/Container';
import { Logger } from 'noicejs/logger/Logger';
import { Bot } from 'src/Bot';

export interface ServiceOptions<TConfig> extends BaseOptions {
  bot: Bot;
  config: TConfig;
  logger: Logger;
}

export interface Service {
  start(): Promise<void>;
  stop(): Promise<void>;
}