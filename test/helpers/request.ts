import { Response } from 'express';
import { ineeda } from 'ineeda';
import { Constructor } from 'noicejs';
import { spy } from 'sinon';
import { Repository } from 'typeorm';

import { Bot } from '../../src/Bot';
import { INJECT_BOT, INJECT_STORAGE } from '../../src/BotService';
import { EndpointData } from '../../src/endpoint';
import { BaseEndpoint, BaseEndpointOptions } from '../../src/endpoint/BaseEndpoint';
import { BotModule } from '../../src/module/BotModule';
import { Storage } from '../../src/storage';
import { createService, createServiceContainer } from '../helpers/container';
import { getTestLogger } from './logger';

const TEST_DATA = {
  filters: [],
  strict: false,
};

const TEST_METADATA = {
  kind: 'test-endpoint',
  name: 'test-endpoint',
};

export async function createEndpoint<
  TEndpoint extends BaseEndpoint<EndpointData>,
  TData extends EndpointData & object
>(
  epType: Constructor<TEndpoint, BaseEndpointOptions<TData>>,
  botReady: boolean,
  storageReady: boolean,
  data: Partial<TData> = {}
): Promise<TEndpoint> {
  const storage = ineeda<Storage>({
    get isConnected() {
      return storageReady;
    },
    set isConnected(val: boolean) { /* noop */ },
    getRepository() {
      return ineeda<Repository<{}>>();
    },
  });
  const bot = ineeda<Bot>({
    get isConnected() {
      return botReady;
    },
    set isConnected(val: boolean) { /* noop */ },
    getStorage() {
      return storage;
    },
  });

  const botModule = new BotModule({
    logger: getTestLogger(),
  });
  botModule.setBot(bot);

  const { container } = await createServiceContainer(botModule);
  return createService<TEndpoint, TData>(container, epType, {
    [INJECT_BOT]: bot,
    [INJECT_STORAGE]: storage,
    data: {
      ...TEST_DATA,
      ...data,
      // tslint:disable-next-line:no-any
    } as any,
    metadata: TEST_METADATA,
  });
}

export function createRequest() {
  const json = spy();
  const response = ineeda<Response>({
    json,
  });
  return { json, response };
}