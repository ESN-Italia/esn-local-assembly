import { epochISOString, Resource } from 'idea-toolbox';

/**
 * An event for which a topic is discussed or an entity is linked to.
 * Note: it's  NOT named `Event` to avoid overlapping with standard classes.
 */
export class AssemblyEvent extends Resource {
  /**
   *  The code of the section in ESN Accounts
   */
  sectionCode: string;
  /**
   * The ID of the event.
   */
  eventId: string;
  /**
   * The name of the event.
   */
  name: string;
  /**
   * The timestamp when the topic was archived.
   */
  archivedAt?: epochISOString;

  load(x: any): void {
    super.load(x);
    this.sectionCode = this.clean(x.sectionCode,String);
    this.eventId = this.clean(x.eventId, String);
    this.name = this.clean(x.name, String);
    if (x.archivedAt) this.archivedAt = this.clean(x.archivedAt, d => new Date(d).toISOString());
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.sectionCode = safeData.sectionCode;
    this.eventId = safeData.eventId;
    if (safeData.archivedAt) this.archivedAt = safeData.archivedAt;
  }

  validate(): string[] {
    const e = super.validate();
    if (this.iE(this.name)) e.push('name');
    return e;
  }
}

/**
 * A brief representation of an Event.
 */
export class AssemblyEventAttached extends Resource {
  /**
   * The ID of the event.
   */
  eventId: string;
  /**
   * The name of the event.
   */
  name: string;

  load(x: any): void {
    super.load(x);
    this.eventId = this.clean(x.eventId, String);
    this.name = this.clean(x.name, String);
  }
}
