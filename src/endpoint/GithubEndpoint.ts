import { Request, Response, Router } from 'express';

import { EndpointData } from '.';
import { BotServiceOptions } from '../BotService';
import { BaseEndpoint, BaseEndpointOptions } from './BaseEndpoint';
import { STATUS_SUCCESS } from './HealthEndpoint';

export interface GithubEndpointData extends EndpointData {
  secret: string;
}

export type GithubEndpointOptions = BaseEndpointOptions<GithubEndpointData>;

export class GithubEndpoint extends BaseEndpoint<GithubEndpointData> {
  constructor(options: BotServiceOptions<GithubEndpointData>) {
    super(options, 'isolex#/definitions/service-endpoint-github');
  }

  public get paths(): Array<string> {
    return [
      ...super.paths,
      '/github',
    ];
  }

  public async createRouter(): Promise<Router> {
    this.router.route('/webhook').get(this.nextRoute(this.postWebhook.bind(this)));
    return this.router;
  }

  public async postWebhook(req: Request, res: Response): Promise<void> {
    const eventType = req.header('X-GitHub-Event');
    const eventId = req.header('X-GitHub-Delivery');
    const eventData = req.body;
    this.logger.info({
      eventData,
      eventId,
      eventType,
    }, 'received github webhook');
    res.sendStatus(STATUS_SUCCESS);
  }
}