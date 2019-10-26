import { ChecksListForRefResponse, ReposGetCombinedStatusForRefResponse, Response } from '@octokit/rest';
import { expect } from 'chai';
import { ineeda } from 'ineeda';
import { spy } from 'sinon';

import { Bot } from '../../../src/Bot';
import { INJECT_BOT } from '../../../src/BotService';
import { GithubCommitController } from '../../../src/controller/github/CommitController';
import { STATUS_SUCCESS } from '../../../src/endpoint/BaseEndpoint';
import { Command } from '../../../src/entity/Command';
import { Context } from '../../../src/entity/Context';
import { Transform } from '../../../src/transform';
import { GithubClient } from '../../../src/utils/github';
import { describeLeaks, itLeaks } from '../../helpers/async';
import { createService, createServiceContainer } from '../../helpers/container';

// tslint:disable:no-any
const TEST_TRANSFORM = 'test-transform';

interface ClientResponse<T> {
  (params: any): Promise<Response<T>>;
  endpoint: any;
}

describeLeaks('github commit controller', async () => {
  itLeaks('should fetch commit status data', async () => {
    const { container, services } = await createServiceContainer();
    services.bind(TEST_TRANSFORM).toInstance(ineeda<Transform>({
      check: () => Promise.resolve(true),
      transform: () => Promise.resolve({
        body: ['test'],
      }),
    }));

    const listForRef: ClientResponse<ChecksListForRefResponse> = (params: any) => Promise.resolve({
      [Symbol.iterator]: undefined as any,
      data: {
        check_runs: [],
        total_count: 0,
      },
      headers: {} as any,
      status: STATUS_SUCCESS,
    });
    listForRef.endpoint = undefined;

    const getCombinedStatusForRef: ClientResponse<ReposGetCombinedStatusForRefResponse> = (params: any) => Promise.resolve({
      [Symbol.iterator]: undefined as any,
      data: {
        commit_url: '',
        repository: {} as any,
        sha: '',
        state: '',
        statuses: [],
        total_count: 1,
        url: '',
      },
      headers: {} as any,
      status: STATUS_SUCCESS,
    });
    getCombinedStatusForRef.endpoint = undefined;

    services.bind(GithubClient).toInstance(ineeda<GithubClient>({
      client: {
        checks: {
          listForRef,
        },
        repos: {
          getCombinedStatusForRef,
        },
      },
    }));

    const sendMessage = spy();
    const ctrl = await createService(container, GithubCommitController, {
      [INJECT_BOT]: ineeda<Bot>({
        sendMessage,
      }),
      data: {
        client: {
          agent: '',
          app: {
            id: 0,
            key: '',
          },
          installation: {
            id: 0,
          },
        },
        filters: [],
        strict: false,
        transforms: [{
          data: {
            filters: [],
            strict: false,
          },
          metadata: {
            kind: TEST_TRANSFORM,
            name: TEST_TRANSFORM,
          },
        }],
      },
      metadata: {
        kind: 'github-commit-controller',
        name: 'test-controller',
      },
    });
    await ctrl.start();
    await ctrl.getCommit(ineeda<Command>({
      getHead: () => '',
      getHeadOrDefault: () => '',
    }), ineeda<Context>());

    expect(sendMessage).to.have.callCount(1);
  });
});