import { Filter, FilterBehavior, FilterData, FilterValue } from '.';
import { Message } from '../entity/Message';
import { doesExist } from '../utils';
import { BaseFilter, BaseFilterOptions } from './BaseFilter';

export interface SourceFilterData extends FilterData {
  type?: string;
}

export class SourceFilter extends BaseFilter<SourceFilterData> implements Filter {
  public readonly type?: string;

  constructor(options: BaseFilterOptions<SourceFilterData>) {
    super(options, 'isolex#/definitions/service-filter-source');
  }

  public async check(value: FilterValue): Promise<FilterBehavior> {
    if (Message.isMessage(value)) {
      return this.filterMessage(value);
    }

    return FilterBehavior.Ignore;
  }

  public async filterMessage(msg: Message): Promise<FilterBehavior> {
    if (doesExist(this.type) && msg.type !== this.type) {
      return FilterBehavior.Drop;
    }

    return FilterBehavior.Allow;
  }
}
