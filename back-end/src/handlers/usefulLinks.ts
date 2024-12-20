///
/// IMPORTS
///

import { DynamoDB, HandledError, ResourceController } from 'idea-aws';

import { addStatisticEntry } from './statistics';

import { User } from '../models/user.model';
import { UsefulLink } from '../models/usefulLink.model';
import { AssemblyEventAttached } from '../models/event.model';
import { StatisticEntityTypes } from '../models/statistic.model';

///
/// CONSTANTS, ENVIRONMENT VARIABLES, HANDLER
///

const PROJECT = process.env.PROJECT;
const DDB_TABLES = { usefulLinks: process.env.DDB_TABLE_usefulLinks, events: process.env.DDB_TABLE_events };
const ddb = new DynamoDB();

export const handler = (ev: any, _: any, cb: any): Promise<void> => new UsefulLinks(ev, cb).handleRequest();

///
/// RESOURCE CONTROLLER
///

class UsefulLinks extends ResourceController {
  galaxyUser: User;
  usefulLink: UsefulLink;

  constructor(event: any, callback: any) {
    super(event, callback, { resourceId: 'linkId' });
    this.galaxyUser = new User(event.requestContext.authorizer.lambda.user);
  }

  protected async checkAuthBeforeRequest(): Promise<void> {
    if (!this.resourceId) return;

    try {
      this.usefulLink = new UsefulLink(
        await ddb.get({
          TableName: DDB_TABLES.usefulLinks,
          Key: { sectionCode: this.galaxyUser.sectionCode, linkId: this.resourceId }
        })
      );
    } catch (err) {
      throw new HandledError('Link not found');
    }
  }

  protected async getResources(): Promise<UsefulLink[]> {
    let usefulLinks: UsefulLink[] = await ddb.query({
      TableName: DDB_TABLES.usefulLinks,
      KeyConditionExpression: 'sectionCode = :sectionCode',
      ExpressionAttributeValues: { ':sectionCode': this.galaxyUser.sectionCode }
    });
    usefulLinks = usefulLinks.map(x => new UsefulLink(x)).sort((a, b): number => a.sort - b.sort);

    await addStatisticEntry(this.galaxyUser, StatisticEntityTypes.USEFUL_LINKS);

    return usefulLinks;
  }

  private async putSafeResource(opts: { noOverwrite: boolean }): Promise<UsefulLink> {
    const errors = this.usefulLink.validate();
    if (errors.length) throw new HandledError(`Invalid fields: ${errors.join(', ')}`);

    if (this.usefulLink.event?.eventId) {
      try {
        this.usefulLink.event = new AssemblyEventAttached(
          await ddb.get({
            TableName: DDB_TABLES.events,
            Key: { sectionCode: this.usefulLink.sectionCode, eventId: this.usefulLink.event.eventId }
          })
        );
      } catch (error) {
        throw new HandledError('Event not found');
      }
    }

    const putParams: any = { TableName: DDB_TABLES.usefulLinks, Item: this.usefulLink };
    if (opts.noOverwrite) putParams.ConditionExpression = 'attribute_not_exists(linkId)';
    await ddb.put(putParams);

    return this.usefulLink;
  }

  protected async postResources(): Promise<UsefulLink> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    this.usefulLink = new UsefulLink(this.body);
    this.usefulLink.linkId = await ddb.IUNID(PROJECT);

    return await this.putSafeResource({ noOverwrite: true });
  }

  protected async getResource(): Promise<UsefulLink> {
    await addStatisticEntry(this.galaxyUser, StatisticEntityTypes.USEFUL_LINKS, this.resourceId);
    return this.usefulLink;
  }

  protected async putResource(): Promise<UsefulLink> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    const oldLink = new UsefulLink(this.usefulLink);
    this.usefulLink.safeLoad(this.body, oldLink);

    return await this.putSafeResource({ noOverwrite: false });
  }

  protected async patchResource(): Promise<void> {
    switch (this.body.action) {
      case 'SWAP_SORT':
        return await this.swapSort(this.body.otherLinkId);
      default:
        throw new HandledError('Unsupported action');
    }
  }
  private async swapSort(otherLinkId: string): Promise<void> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');
    if (this.usefulLink.linkId === otherLinkId) throw new HandledError('Same link');

    const otherLink = new UsefulLink(
      await ddb.get({
        TableName: DDB_TABLES.usefulLinks,
        Key: { sectionCode: this.galaxyUser.sectionCode, linkId: otherLinkId }
      })
    );

    const swapLinkSort = otherLink.sort;
    otherLink.sort = this.usefulLink.sort;
    this.usefulLink.sort = swapLinkSort;

    await ddb.transactWrites([
      { Put: { TableName: DDB_TABLES.usefulLinks, Item: this.usefulLink } },
      { Put: { TableName: DDB_TABLES.usefulLinks, Item: otherLink } }
    ]);
  }

  protected async deleteResource(): Promise<void> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    await ddb.delete({
      TableName: DDB_TABLES.usefulLinks,
      Key: { sectionCode: this.galaxyUser.sectionCode, linkId: this.usefulLink.linkId }
    });
  }
}
