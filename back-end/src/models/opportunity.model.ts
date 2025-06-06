import { Attachment, epochISOString, Resource } from 'idea-toolbox';

import { User } from './user.model';

/**
 * An opportunity (open call) to which users can apply to.
 */
export class Opportunity extends Resource {
  /**
   * The code of the section from ESN Accounts
   */
  sectionCode: string;
  /**
   * The ID of the opportunity.
   */
  opportunityId: string;
  /**
   * A brief description (title) of the opportunity.
   */
  name: string;
  /**
   * A full-length description of the opportunity (content).
   */
  content: string;
  /**
   * The timestamp of creation.
   */
  createdAt: epochISOString;
  /**
   * The creation year. To use in indexes for archive queries.
   */
  yearOfCreation: number;
  /**
   * The timestamp of last update.
   */
  updatedAt?: epochISOString;
  /**
   * The timestamp since when the opportunity is considered published.
   * If not set, it's a draft; drafts are displayed only to administrators.
   * If set in the future, it means the publishing has been scheduled.
   */
  publishedSince?: string;
  /**
   * The timestamp when the opportunity will close. Note: it's a sparse index for queries.
   */
  willCloseAt?: epochISOString;
  /**
   * The timestamp when the opportunity was closed. A opportunity which is closed cannot accept new applications.
   */
  closedAt?: epochISOString;
  /**
   * The timestamp when the opportunity was archived. A opportunity archived is also closed.
   */
  archivedAt?: epochISOString;
  /**
   * The attachments to the opportunity.
   */
  attachments: Attachment[];
  /**
   * The list of the expected attachments.
   */
  expectedAttachments: OpportunityApplicationAttachment[];
  /**
   * The current total number of applicants to this opportunity.
   */
  numOfApplications: number;
  /**
   * The contact email for questions; if not set, the button won't be enabled.
   */
  contactEmail: string;
  /**
   * The IDs of the users that can manage this specific opportunity, extending the ones set in the Configurations.
   */
  additionalManagersIds: string[];

  load(x: any): void {
    super.load(x);
    this.sectionCode = this.clean(x.sectionCode,String);
    this.opportunityId = this.clean(x.opportunityId, String);
    this.name = this.clean(x.name, String);
    this.content = this.clean(x.content, String);
    this.createdAt = this.clean(x.createdAt, d => new Date(d).toISOString(), new Date().toISOString());
    this.yearOfCreation = new Date(this.createdAt).getFullYear();
    if (x.updatedAt) this.updatedAt = this.clean(x.updatedAt, d => new Date(d).toISOString());
    if (x.publishedSince) this.publishedSince = this.clean(x.publishedSince, d => new Date(d).toISOString());
    else delete this.publishedSince;
    if (x.willCloseAt) this.willCloseAt = this.clean(x.willCloseAt, d => new Date(d).toISOString());
    else delete this.willCloseAt;
    if (x.closedAt) this.closedAt = this.clean(x.closedAt, d => new Date(d).toISOString());
    if (x.archivedAt) this.archivedAt = this.clean(x.archivedAt, d => new Date(d).toISOString());
    this.attachments = this.cleanArray(x.attachments, a => new Attachment(a));
    this.expectedAttachments = this.cleanArray(x.expectedAttachments, ea => new OpportunityApplicationAttachment(ea));
    this.numOfApplications = this.clean(x.numOfApplications, Number, 0);
    this.contactEmail = this.clean(x.contactEmail, String);
    this.additionalManagersIds = this.cleanArray(x.additionalManagersIds, String).map(x => x.toLowerCase());
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.sectionCode = safeData.sectionCode;
    this.opportunityId = safeData.opportunityId;
    this.createdAt = safeData.createdAt;
    this.yearOfCreation = safeData.yearOfCreation;
    if (safeData.updatedAt) this.updatedAt = safeData.updatedAt;
    if (safeData.closedAt) this.closedAt = safeData.closedAt;
    if (safeData.archivedAt) this.archivedAt = safeData.archivedAt;
    this.numOfApplications = safeData.numOfApplications;
  }

  validate(): string[] {
    const e = super.validate();
    if (this.iE(this.name)) e.push('name');
    if (this.publishedSince && this.iE(this.publishedSince, 'date')) e.push('publishedSince');
    if (this.willCloseAt && (this.iE(this.willCloseAt, 'date') || this.willCloseAt < new Date().toISOString()))
      e.push('willCloseAt');
    return e;
  }

  /**
   * Whether the opportunity is a draft (hence visible only to administrators); otherwise, it's considered published.
   */
  isDraft(): boolean {
    return !this.publishedSince || this.publishedSince > new Date().toISOString();
  }

  /**
   * Whether the opportunity is closed (extra check since this operation could be automated).
   */
  isClosed(): boolean {
    if (this.isArchived()) return true;
    return !!this.closedAt || (this.willCloseAt && this.willCloseAt < new Date().toISOString());
  }
  /**
   * Whether the opportunity is archived.
   */
  isArchived(): boolean {
    return !!this.archivedAt;
  }

  /**
   * Whether the user can manage the opportunity.
   */
  canUserManage(user: User): boolean {
    if(user.sectionCode !== this.sectionCode) return false;
    return user.canManageOpportunities || this.additionalManagersIds.includes(user.userId);
  }
}

/**
 * The expected attachments for the application to an opportunity.
 */
export class OpportunityApplicationAttachment extends Resource {
  /**
   * The attachment name.
   */
  name: string;
  /**
   * Whether the attachment is required (or optional).
   */
  required: boolean;

  load(x: any): void {
    this.name = this.clean(x.name, String);
    this.required = this.clean(x.required, Boolean, false);
  }
}
