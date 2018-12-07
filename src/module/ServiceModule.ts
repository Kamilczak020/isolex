import { isNil, isString } from 'lodash';
import { Module, Provides } from 'noicejs';
import { Container, Contract } from 'noicejs/Container';
import { ModuleOptions, Provider } from 'noicejs/Module';

import { Bot } from 'src/Bot';
import { ChildServiceOptions } from 'src/ChildService';
import { NotFoundError } from 'src/error/NotFoundError';
import { Service, ServiceDefinition, ServiceMetadata } from 'src/Service';
import { mustGet } from 'src/utils/Map';

/**
 * This is a magical half-module service locator
 */

export class ServiceModule extends Module implements Service {
  protected container: Container;
  protected services: Map<string, Service>;

  public readonly id: string;
  public readonly kind: string;
  public readonly name: string;

  constructor() {
    super();

    this.services = new Map();
  }

  public async start() {
    for (const svc of this.services.values()) {
      await svc.start();
    }
  }

  public async stop() {
    for (const svc of this.services.values()) {
      await svc.stop();
    }
    this.services.clear();
  }

  public async configure(options: ModuleOptions): Promise<void> {
    await super.configure(options);
    this.container = options.container;
    this.logger.debug({ options }, 'configuring service module');
  }

  public get(contract: Contract<any>): Provider<any> {
    // defer to normal module for decorator-provided
    if (super.has(contract)) {
      return super.get(contract);
    }

    if (isString(contract) && this.services.has(contract)) {
      const value = this.services.get(contract);
      if (isNil(value)) {
        return {
          type: 0, //ProviderType.None,
          value: undefined,
        };
      } else {
        return {
          type: 3, //ProviderType.Instance,
          value,
        };
      }
    } else {
      return {
        type: 0, //ProviderType.None,
        value: undefined,
      };
    }
  }

  public has(contract: Contract<any>): boolean {
    return super.has(contract) || (isString(contract) && this.services.has(contract));
  }

  @Provides('services')
  public getServices() {
    this.logger.debug('getting services from service module');
    return this;
  }

  /**
   * These are all created the same way, so they should probably have a common base...
   */
  public async createService<TService extends Service, TData>(conf: ServiceDefinition<TData>): Promise<TService> {
    if (isNil(this.container)) {
      throw new NotFoundError('container not found');
    }

    const { metadata: { kind, name } } = conf;
    const tag = `${kind}:${name}`;

    if (this.services.has(tag)) {
      this.logger.info({ kind, tag }, 'fetching existing service');
      return mustGet(this.services, tag) as TService;
    }

    this.logger.info({ kind, tag }, 'creating unknown service');
    const svc = await this.container.create<TService, ChildServiceOptions<any>>(kind, {
      ...conf,
      logger: this.logger.child({
        kind,
      }),
      services: this,
    });

    this.logger.debug({ id: svc.id, kind, tag }, 'service created');
    this.services.set(tag, svc);

    return svc;
  }

  public getService<TService extends Service>(metadata: Partial<ServiceMetadata>): TService {
    for (const svc of this.services.values()) {
      if (svc.id === metadata.id || (svc.kind === metadata.kind && svc.name === metadata.name)) {
        return svc as TService;
      }
    }

    this.logger.error({ metadata }, 'service not found');
    throw new NotFoundError(`service not found`);
  }

  public listServices() {
    this.logger.debug('listing services');
    return this.services;
  }
}