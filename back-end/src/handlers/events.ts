///
/// IMPORTS
///

import { DynamoDB, HandledError, ResourceController } from 'idea-aws';

import { AssemblyEvent } from '../models/event.model';
import { Topic } from '../models/topic.model';
import { User } from '../models/user.model';
import { VotingSession } from '../models/votingSession.model';

///
/// CONSTANTS, ENVIRONMENT VARIABLES, HANDLER
///

const PROJECT = process.env.PROJECT;
const DDB_TABLES = {
  events: process.env.DDB_TABLE_events,
  topics: process.env.DDB_TABLE_topics,
  questions: process.env.DDB_TABLE_questions,
  answers: process.env.DDB_TABLE_answers,
  votingSessions: process.env.DDB_TABLE_votingSessions
};
const ddb = new DynamoDB();

export const handler = (ev: any, _: any, cb: any): Promise<void> => new AssemblEvents(ev, cb).handleRequest();

///
/// RESOURCE CONTROLLER
///

class AssemblEvents extends ResourceController {
  galaxyUser: User;
  assemblyEvent: AssemblyEvent;

  constructor(event: any, callback: any) {
    super(event, callback, { resourceId: 'eventId' });
    this.galaxyUser = new User(event.requestContext.authorizer.lambda.user);
  }

  protected async checkAuthBeforeRequest(): Promise<void> {
    if (!this.resourceId) return;

    try {
      this.assemblyEvent = new AssemblyEvent(
        await ddb.get({
          TableName: DDB_TABLES.events,
          Key: { sectionCode: this.galaxyUser.sectionCode, eventId: this.resourceId }
        })
      );
    } catch (err) {
      throw new HandledError('Event not found');
    }
  }

  protected async getResources(): Promise<AssemblyEvent[]> {
    let events: AssemblyEvent[] = await ddb.query({
      TableName: DDB_TABLES.events,
      KeyConditionExpression: 'sectionCode = :sectionCode',
      ExpressionAttributeValues: { ':sectionCode': this.galaxyUser.sectionCode }
    });
    events = events.map(x => new AssemblyEvent(x));
    if (!this.queryParams.all) events = events.filter(x => !x.archivedAt);
    return events.sort((a, b): number => a.name.localeCompare(b.name));
  }

  private async putSafeResource(opts: { noOverwrite: boolean }): Promise<AssemblyEvent> {
    const errors = this.assemblyEvent.validate();
    if (errors.length) throw new HandledError(`Invalid fields: ${errors.join(', ')}`);

    const putParams: any = { TableName: DDB_TABLES.events, Item: this.assemblyEvent };
    if (opts.noOverwrite) putParams.ConditionExpression = 'attribute_not_exists(sectionCode) AND attribute_not_exists(eventId)';
    await ddb.put(putParams);

    return this.assemblyEvent;
  }

  protected async postResources(): Promise<AssemblyEvent> {
    if (!this.galaxyUser.isAdministrator) throw new HandledError('Unauthorized');

    this.assemblyEvent = new AssemblyEvent(this.body);
    this.assemblyEvent.eventId = await ddb.IUNID(PROJECT);

    return await this.putSafeResource({ noOverwrite: true });
  }

  protected async getResource(): Promise<AssemblyEvent> {
    return this.assemblyEvent;
  }

  protected async putResource(): Promise<AssemblyEvent> {
    if (!this.galaxyUser.isAdministrator) throw new HandledError('Unauthorized');

    const oldEvent = new AssemblyEvent(this.assemblyEvent);
    this.assemblyEvent.safeLoad(this.body, oldEvent);

    return await this.putSafeResource({ noOverwrite: false });
  }

  protected async patchResource(): Promise<AssemblyEvent> {
    switch (this.body.action) {
      case 'ARCHIVE':
        return await this.manageArchive(true);
      case 'UNARCHIVE':
        return await this.manageArchive(false);
      default:
        throw new HandledError('Unsupported action');
    }
  }
  private async manageArchive(archive: boolean): Promise<AssemblyEvent> {
    if (!this.galaxyUser.isAdministrator) throw new HandledError('Unauthorized');

    if (archive) this.assemblyEvent.archivedAt = new Date().toISOString();
    else delete this.assemblyEvent.archivedAt;

    await ddb.put({ TableName: DDB_TABLES.events, Item: this.assemblyEvent });
    return this.assemblyEvent;
  }

  protected async deleteResource(): Promise<void> {
    if (!this.galaxyUser.isAdministrator) throw new HandledError('Unauthorized');

    const topics: Topic[] = await ddb.query({
      TableName: DDB_TABLES.topics,
      IndexName: 'sectionCode-meta-index',
      KeyConditionExpression: 'sectionCode = :sectionCode',
      ExpressionAttributeValues: { ':sectionCode': this.galaxyUser.sectionCode }
    });
    const topicsWithEvent = topics.filter(x => x.event.eventId === this.assemblyEvent.eventId);
    if (topicsWithEvent.length > 0) throw new HandledError('Event is used');

    const votingSessions: VotingSession[] = await ddb.query({
      TableName: DDB_TABLES.votingSessions,
      IndexName: 'sectionCode-meta-index',
      KeyConditionExpression: 'sectionCode = :sectionCode',
      ExpressionAttributeValues: { ':sectionCode': this.galaxyUser.sectionCode }
    });
    const votingSessionsWithEvent = votingSessions.filter(x => x.event?.eventId === this.assemblyEvent.eventId);
    if (votingSessionsWithEvent.length > 0) throw new HandledError('Event is used');

    await ddb.delete({
      TableName: DDB_TABLES.events,
      Key: { sectionCode: this.assemblyEvent.sectionCode, eventId: this.assemblyEvent.eventId }
    });
  }
}
