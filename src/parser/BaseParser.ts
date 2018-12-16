import { ChildService, ChildServiceOptions } from 'src/ChildService';
import { Command, CommandDataValue, CommandVerb } from 'src/entity/Command';
import { Context } from 'src/entity/Context';
import { Fragment } from 'src/entity/Fragment';
import { Message } from 'src/entity/Message';
import { Parser, ParserData, ParserOutputData } from 'src/parser/Parser';
import { dictToMap, getHeadOrDefault } from 'src/utils/Map';
import { Match } from 'src/utils/match';
import { BaseError } from 'noicejs';

export abstract class BaseParser<TData extends ParserData> extends ChildService<TData> implements Parser {
  protected matcher: Match;

  constructor(options: ChildServiceOptions<TData>) {
    super(options);

    this.matcher = new Match(options.data.match);
  }

  public async start() {
    /* noop */
  }

  public async stop() {
    /* noop */
  }

  public async match(msg: Message): Promise<boolean> {
    const results = this.matcher.match(msg);
    return results.matched;
  }

  public abstract parse(msg: Message): Promise<Array<Command>>;

  public abstract decode(msg: Message): Promise<any>;

  /**
   * Very simple, stateless completion. Merges data and sends a single command without attempting to parse or decode
   * the value. This does not support multiple arguments.
   */
  public async complete(context: Context, fragment: Fragment, value: CommandDataValue): Promise<Array<Command>> {
    const data = new Map(fragment.data).set(fragment.key, value);
    return [await this.createCommand(context, data, fragment)];
  }

  protected async createCommand(baseContext: Context, data: Map<string, Array<string>>, emit: Partial<ParserOutputData> = {}): Promise<Command> {
    if (emit === this.data.defaultCommand) {
      throw new BaseError('parser must not provide default command twice');
    }

    const context = baseContext.extend({
      parser: this,
    });
    const labels = new Map<string, string>([
      ...dictToMap(this.data.defaultCommand.labels),
      ...dictToMap(emit.labels),
    ]);
    const { noun, verb } = this.switchNounVerb(data, emit);
    this.logger.debug({ context, noun, verb }, 'emit command');

    return new Command({
      context,
      data,
      labels,
      noun,
      verb,
    });
  }

  protected switchNounVerb(data: Map<string, Array<string>>, emit: Partial<ParserOutputData>): {
    noun: string;
    verb: CommandVerb;
  } {
    const noun = emit.noun || this.data.defaultCommand.noun;
    const verb = emit.verb || this.data.defaultCommand.verb;
    if (this.data.preferData) {
      return {
        noun: getHeadOrDefault(data, 'noun', noun),
        verb: getHeadOrDefault(data, 'verb', verb) as CommandVerb,
      };
    } else {
      return {
        noun,
        verb,
      };
    }
  }
}
