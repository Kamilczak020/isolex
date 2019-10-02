import { BaseOptions, Container, Inject, Logger } from 'noicejs';
import { Connection, ConnectionOptions, createConnection, Repository } from 'typeorm';

import { BaseService, BaseServiceOptions, INJECT_LOGGER } from '../BaseService';
import { ServiceLifecycle } from '../Service';
import { mustExist } from '../utils';
import { classLogger } from '../utils/logger';
import { StorageLogger, StorageLoggerOptions } from '../utils/logger/StorageLogger';

export interface StorageData {
  migrate: boolean;
  orm: ConnectionOptions;
}

export interface StorageOptions extends BaseServiceOptions<StorageData> {
  [INJECT_LOGGER]: Logger;
  data: StorageData;
}

@Inject(INJECT_LOGGER)
export class Storage extends BaseService<StorageData> implements ServiceLifecycle {
  protected connection?: Connection;
  protected container: Container;
  protected logger: Logger;

  constructor(options: StorageOptions) {
    super(options, 'isolex#/definitions/service-storage');

    this.container = options.container;
    this.logger = classLogger(options[INJECT_LOGGER], Storage);
  }

  public async start(): Promise<void> {
    this.logger.info('connecting to storage');
    const storageLogger = await this.container.create(StorageLogger);
    const entities = await this.container.create<Array<Function>, BaseOptions>('entities');
    const migrations = await this.container.create<Array<Function>, BaseOptions>('migrations');

    this.connection = await createConnection({
      ...this.data.orm,
      entities,
      logger: storageLogger,
      migrations,
    });

    if (this.data.migrate) {
      this.logger.info('running pending database migrations');
      await this.connection.runMigrations();
      this.logger.info('database migrations complete');
    }
  }

  public async stop() {
    return mustExist(this.connection).close();
  }

  public getRepository<TEntity>(ctor: Function | (new () => TEntity)): Repository<TEntity> {
    return mustExist(this.connection).getRepository(ctor);
  }

  public getCustomRepository<TRepo>(ctor: Function | (new () => TRepo)): TRepo {
    return mustExist(this.connection).getCustomRepository(ctor);
  }
}
