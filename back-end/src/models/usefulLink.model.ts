import { Resource } from 'idea-toolbox';

import { AssemblyEventAttached } from './event.model';

/**
 * A useful link for the users to access more contents and information.
 */
export class UsefulLink extends Resource {
  /**
   * The code of the section from ESN Accounts
   */
  sectionCode: string;
  /**
   * The ID of the link.
   */
  linkId: string;
  /**
   * The title of the link.
   */
  name: string;
  /**
   * The URL of the link.
   */
  url: string;
  /**
   * The event to which the link refers to (if any).
   */
  event: AssemblyEventAttached | null;
  /**
   * The sort index to order the link in lists.
   */
  sort: number;

  load(x: any): void {
    super.load(x);
    this.sectionCode = this.clean(x.sectionCode, String);
    this.linkId = this.clean(x.linkId, String);
    this.name = this.clean(x.name, String);
    this.url = this.clean(x.url, String);
    this.event = x.event?.eventId ? new AssemblyEventAttached(x.event) : null;
    this.sort = this.clean(x.sort, Number, Date.now());
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.sectionCode = safeData.sectionCode;
    this.linkId = safeData.linkId;
    this.sort = safeData.sort;
  }

  validate(): string[] {
    const e = super.validate();
    if (this.iE(this.name)) e.push('name');
    if (this.iE(this.url, 'url')) e.push('url');
    return e;
  }
}
