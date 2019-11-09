import { BotServiceData } from '../BotService';
import { Command } from '../entity/Command';
import { Message } from '../entity/Message';
import { Service } from '../Service';

/* eslint-disable no-magic-numbers */
export enum FilterBehavior {
  /**
   * Drop the entity and skip any further processing.
   */
  Drop = 0x00,

  /**
   * Allow the entity and perform full processing.
   */
  Allow = 0x80,

  /**
   * Ignore the entity, providing no opinion on what should be done with it.
   */
  Ignore = 0xFF,
}

export type FilterData = BotServiceData;

export type FilterValue = Command | Message;

/**
 * Filters take commands, incoming events, and messages to determine if they should continue through the system or
 * be discarded.
 */
export interface Filter extends Service {
  check(val: FilterValue): Promise<FilterBehavior>;
}

/**
 * Check a filter behavior.
 *
 * - In strict mode, only `Allow` is allowed.
 * - In loose mode, only `Drop` is dropped.
 * - Ignore varies: it is dropped in strict mode and allowed otherwise.
 */
export function checkFilter(behavior: FilterBehavior, strict: boolean) {
  if (strict) {
    return behavior === FilterBehavior.Allow;
  } else {
    return behavior !== FilterBehavior.Drop;
  }
}
