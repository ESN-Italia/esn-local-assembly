///
/// IMPORTS
///

import { DynamoDB, HandledError, ResourceController } from 'idea-aws';

import { addStatisticEntry } from './statistics';

import { User } from '../models/user.model';
import { Communication } from '../models/communication.model';
import { AssemblyEventAttached } from '../models/event.model';
import { StatisticEntityTypes } from '../models/statistic.model';

///
/// CONSTANTS, ENVIRONMENT VARIABLES, HANDLER
///

const PROJECT = process.env.PROJECT;
const DDB_TABLES = { communications: process.env.DDB_TABLE_communications, events: process.env.DDB_TABLE_events };
const ddb = new DynamoDB();

export const handler = (ev: any, _: any, cb: any): Promise<void> => new Communications(ev, cb).handleRequest();

///
/// RESOURCE CONTROLLER
///

class Communications extends ResourceController {
  galaxyUser: User;
  communication: Communication;

  constructor(event: any, callback: any) {
    super(event, callback, { resourceId: 'communicationId' });
    this.galaxyUser = new User(event.requestContext.authorizer.lambda.user);
  }

  protected async checkAuthBeforeRequest(): Promise<void> {
    if (!this.resourceId) return;

    try {
      this.communication = new Communication(
        await ddb.get({
          TableName: DDB_TABLES.communications,
          Key: { sectionCode: this.galaxyUser.sectionCode, communicationId: this.resourceId }
        })
      );
    } catch (err) {
      throw new HandledError('Communication not found');
    }
  }

  protected async getResources(): Promise<Communication[]> {
    let communications: Communication[] = await ddb.query({
      TableName: DDB_TABLES.communications,
      KeyConditionExpression: 'sectionCode = :sectionCode',
      ExpressionAttributeValues: { ':sectionCode': this.galaxyUser.sectionCode }
    });
    communications = communications.map(x => new Communication(x));

    if (this.queryParams.year)
      communications = communications.filter(x => new Date(x.date).getFullYear().toString() === this.queryParams.year);
    else communications = communications.filter(x => !x.isArchived());

    communications = communications.sort((a, b): number => b.date.localeCompare(a.date));

    await addStatisticEntry(this.galaxyUser, StatisticEntityTypes.COMMUNICATIONS);

    return communications;
  }

  private async putSafeResource(opts: { noOverwrite: boolean }): Promise<Communication> {
    const errors = this.communication.validate();
    if (errors.length) throw new HandledError(`Invalid fields: ${errors.join(', ')}`);

    if (this.communication.event?.eventId) {
      try {
        this.communication.event = new AssemblyEventAttached(
          await ddb.get({
            TableName: DDB_TABLES.events,
            Key: { sectionCode: this.galaxyUser.sectionCode, eventId: this.communication.event.eventId }
          })
        );
      } catch (error) {
        throw new HandledError('Event not found');
      }
    }

    const putParams: any = { TableName: DDB_TABLES.communications, Item: this.communication };
    if (opts.noOverwrite) putParams.ConditionExpression = 'attribute_not_exists(communicationId)';
    await ddb.put(putParams);

    return this.communication;
  }

  protected async postResources(): Promise<Communication> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    this.communication = new Communication(this.body);
    this.communication.communicationId = await ddb.IUNID(PROJECT);
    if (this.galaxyUser.sectionCode !== this.communication.sectionCode) throw new HandledError('Unauthorized');
    return await this.putSafeResource({ noOverwrite: true });
  }

  protected async getResource(): Promise<Communication> {
    await addStatisticEntry(this.galaxyUser, StatisticEntityTypes.COMMUNICATIONS, this.resourceId);
    return this.communication;
  }

  protected async putResource(): Promise<Communication> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    const oldCommunication = new Communication(this.communication);
    this.communication.safeLoad(this.body, oldCommunication);

    return await this.putSafeResource({ noOverwrite: false });
  }

  protected async patchResource(): Promise<Communication> {
    switch (this.body.action) {
      case 'ARCHIVE':
        return await this.manageArchive(true);
      case 'UNARCHIVE':
        return await this.manageArchive(false);
      default:
        throw new HandledError('Unsupported action');
    }
  }
  private async manageArchive(archive: boolean): Promise<Communication> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    if (archive) this.communication.archivedAt = new Date().toISOString();
    else delete this.communication.archivedAt;

    await ddb.put({ TableName: DDB_TABLES.communications, Item: this.communication });
    return this.communication;
  }

  protected async deleteResource(): Promise<void> {
    if (!(this.galaxyUser.isAdministrator || this.galaxyUser.canManageDashboard))
      throw new HandledError('Unauthorized');

    await ddb.delete({
      TableName: DDB_TABLES.communications,
      Key: { sectionCode: this.galaxyUser.sectionCode, communicationId: this.communication.communicationId }
    });
  }
}
