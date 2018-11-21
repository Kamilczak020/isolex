import { Connection, Repository } from 'typeorm';

import { Role } from 'src/entity/auth/Role';
import { Token } from 'src/entity/auth/Token';
import { User } from 'src/entity/auth/User';
import { Command } from 'src/entity/Command';

import { BaseController } from './BaseController';
import { Controller, ControllerData } from './Controller';

export interface AuthControllerData extends ControllerData {

}

export class AuthController extends BaseController<AuthControllerData> implements Controller {
  protected storage: Connection;
  protected roleRepository: Repository<Role>;
  protected tokenRepository: Repository<Token>;
  protected userRepository: Repository<User>;

  public async handle(cmd: Command): Promise<void> {
    /* noop */
  }
}