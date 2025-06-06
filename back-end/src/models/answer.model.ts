import { epochISOString, Resource } from 'idea-toolbox';

import { Subject } from './subject.model';
import { Topic } from './topic.model';
import { User } from './user.model';

/**
 * An answer to a question.
 */
export class Answer extends Resource {
  /**
   * The ID of the question to which the answer is related.
   */
  questionId: string;
  /**
   * The ID of the answer.
   */
  answerId: string;
  /**
   * The full text of the answer.
   */
  text: string;
  /**
   * The creator of the answer.
   */
  creator: Subject;
  /**
   * The timestamp of creation.
   */
  createdAt: epochISOString;
  /**
   * The timestamp of last update.
   */
  updatedAt?: epochISOString;

  load(x: any): void {
    super.load(x);
    this.questionId = this.clean(x.questionId, String);
    this.answerId = this.clean(x.answerId, String);
    this.text = this.clean(x.text, String);
    this.creator = new Subject(x.creator);
    this.createdAt = this.clean(x.createdAt, d => new Date(d).toISOString(), new Date().toISOString());
    if (x.updatedAt) this.updatedAt = this.clean(x.updatedAt, d => new Date(d).toISOString());
  }

  safeLoad(newData: any, safeData: any): void {
    super.safeLoad(newData, safeData);
    this.questionId = safeData.questionId;
    this.answerId = safeData.answerId;
    this.creator = safeData.creator;
    this.createdAt = safeData.createdAt;
    if (safeData.updatedAt) this.updatedAt = safeData.updatedAt;
  }

  validate(): string[] {
    const e = super.validate();
    if (this.iE(this.text)) e.push('text');
    if (this.creator.validate().length) e.push('creator');
    return e;
  }

  /**
   * Whether the user is allowed to edit the answer.
   */
  canUserEdit(topic: Topic, user: User, excludeAdmin = false): boolean {
    if (topic.sectionCode !== user.sectionCode) return false;
    const timeCheck = !topic.acceptAnswersUntil || topic.acceptAnswersUntil > new Date().toISOString();
    const adminCheck = user.isAdministrator && !excludeAdmin;
    const creatorCheck = user.userId === this.creator.id;
    return !topic.isArchived() && timeCheck && (adminCheck || creatorCheck);
  }
}

/**
 * The act of clapping for an answer.
 */
export class AnswerClap extends Resource {
  /**
   * The ID of the question to which the answer is related.
   */
  questionId: string;
  /**
   * The ID of the answer clapped.
   */
  answerId: string;
  /**
   * The ID of the user who clapped.
   */
  userId: string;
  /**
   * The data of the user who clapped.
   * Note: older data may not have this field.
   */
  creator: Subject;
  /**
   * The timestamp of creation of the clap.
   * Note: older data may not have this field.
   */
  createdAt: epochISOString;

  load(x: any): void {
    super.load(x);
    this.questionId = this.clean(x.questionId, String);
    this.answerId = this.clean(x.answerId, String);
    this.userId = this.clean(x.userId, String);
    this.creator = new Subject(x.creator);
    this.createdAt = this.clean(x.createdAt, d => new Date(d).toISOString(), new Date().toISOString());
  }
}
