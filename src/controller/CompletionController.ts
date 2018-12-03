import { BaseController } from './BaseController';
import { Controller, ControllerOptions } from './Controller';
import { Command, CommandVerb } from 'src/entity/Command';
import { Inject } from 'noicejs';
import { Connection, Repository } from 'typeorm';
import { Fragment } from 'src/entity/Fragment';
import { Message } from 'src/entity/Message';
import { TYPE_TEXT } from 'src/utils/Mime';
import { isNil } from 'lodash';
import { Parser } from 'src/parser/Parser';

export const NOUN_FRAGMENT = 'fragment';

export type CompletionControllerData = any;
export interface CompletionControllerOptions extends ControllerOptions<CompletionControllerData> {
  storage: Connection;
}

@Inject('storage')
export class CompletionController extends BaseController<CompletionControllerData> implements Controller {
  protected storage: Connection;
  protected fragmentRepository: Repository<Fragment>;

  constructor(options: CompletionControllerOptions) {
    super({
      ...options,
      nouns: [NOUN_FRAGMENT],
    });

    this.storage = options.storage;
    this.fragmentRepository = this.storage.getRepository(Fragment);
  }

  public async handle(cmd: Command): Promise<void> {
    this.logger.debug({ cmd }, 'completing command');

    switch (cmd.noun) {
      case NOUN_FRAGMENT:
        return this.handleFragment(cmd);
      default:
        return this.bot.send();
    }
  }

  public async handleFragment(cmd: Command): Promise<void> {
    switch (cmd.verb) {
      case CommandVerb.Create:
        return this.createFragment(cmd);
      case CommandVerb.Update:
        return this.updateFragment(cmd);
      default:
        return this.bot.send();
    }
  }

  public async createFragment(cmd: Command): Promise<void> {
    const key = cmd.getHead('key');
    const msg = cmd.getHeadOrDefault('msg', `missing required argument: ${key}`);
    const noun = cmd.getHead('noun');
    const parserId = cmd.getHead('parser');
    const verb = cmd.getHead('verb') as CommandVerb;

    const fragment = await this.fragmentRepository.save(Fragment.create({
      data: cmd.data,
      key,
      labels: cmd.labels,
      noun,
      parserId,
      verb,
    }));

    this.logger.debug({ fragment }, 'creating fragment for later completion');

    // @TODO: send this message elsewhere (not a direct reply)
    return this.bot.send(Message.reply(cmd.context, TYPE_TEXT, `${fragment.id} (${key}): ${msg}`));
  }

  public async updateFragment(cmd: Command): Promise<void> {
    const id = cmd.getHead('id');
    this.logger.debug({ id }, 'getting fragment to complete');

    const fragment = await this.fragmentRepository.findOne({
      id,
    });

    if (isNil(fragment)) {
      return this.bot.send(Message.reply(cmd.context, TYPE_TEXT, 'fragment not found'));
    }

    this.logger.debug({ fragment }, 'attempting to complete fragment');

    try {
      this.logger.debug({ parserId: fragment.parserId }, 'getting parser for fragment');
      const parser = await this.bot.getService<Parser>(fragment.parserId);
      const value = cmd.get('next');
      const commands = await parser.complete(cmd.context, fragment, value);
      return this.bot.execute(...commands);
    } catch (err) {
      this.logger.error(err, 'error completing fragment');
      return this.bot.send(Message.reply(cmd.context, TYPE_TEXT, 'error completing fragment'));
    }
  }
}