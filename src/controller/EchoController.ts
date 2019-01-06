import { Inject } from 'noicejs';

import { CheckRBAC, Handler } from 'src/controller';
import { BaseController } from 'src/controller/BaseController';
import { Controller, ControllerData, ControllerOptions } from 'src/controller/Controller';
import { Command, CommandVerb } from 'src/entity/Command';

export const NOUN_ECHO = 'echo';

export type EchoControllerData = ControllerData;
export type EchoControllerOptions = ControllerOptions<EchoControllerData>;

@Inject()
export class EchoController extends BaseController<EchoControllerData> implements Controller {
  constructor(options: EchoControllerOptions) {
    super(options, 'isolex#/definitions/service-controller-echo', [NOUN_ECHO]);
  }

  @Handler(NOUN_ECHO, CommandVerb.Create)
  @CheckRBAC()
  public async createEcho(cmd: Command): Promise<void> {
    this.logger.debug({ cmd }, 'echoing command');
    return this.transformJSON(cmd, {});
  }
}
