import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { IDEALoadingService, IDEAMessageService, IDEATranslationsService } from '@idea-ionic/common';

import { AppService } from '@app/app.service';
import { AssemblyEventsService } from './events.service';

import { AssemblyEvent } from '@models/event.model';

@Component({
  selector: 'event',
  templateUrl: 'event.page.html',
  styleUrls: ['event.page.scss']
})
export class EventPage {
  @Input() eventId = 'new';
  event: AssemblyEvent;

  editMode = UXMode.VIEW;
  UXMode = UXMode;
  errors = new Set<string>();
  entityBeforeChange: AssemblyEvent;

  constructor(
    private location: Location,
    private alertCtrl: AlertController,
    private loading: IDEALoadingService,
    private message: IDEAMessageService,
    private t: IDEATranslationsService,
    private _events: AssemblyEventsService,
    public app: AppService
  ) {}
  async ionViewWillEnter(): Promise<void> {
    try {
      await this.loading.show();
      if (this.eventId !== 'new') {
        this.event = await this._events.getById(this.eventId);
        this.editMode = UXMode.VIEW;
      } else {
        this.event = new AssemblyEvent();
        this.editMode = UXMode.INSERT;
      }
    } catch (error) {
      this.message.error('COMMON.NOT_FOUND');
    } finally {
      this.loading.hide();
    }
  }

  async save(): Promise<void> {
    this.errors = new Set(this.event.validate());
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');

    try {
      await this.loading.show();
      let result: AssemblyEvent;
      if (this.editMode === UXMode.INSERT) result = await this._events.insert(this.event);
      else result = await this._events.update(this.event);
      this.event.load(result);
      this.location.replaceState(this.location.path().replace('/new', '/'.concat(this.event.eventId)));
      this.editMode = UXMode.VIEW;
      this.message.success('COMMON.OPERATION_COMPLETED');
    } catch (err) {
      this.message.error('COMMON.OPERATION_FAILED');
    } finally {
      this.loading.hide();
    }
  }
  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async archiveEvent(archive = true): Promise<void> {
    const doArchive = async (): Promise<void> => {
      try {
        await this.loading.show();
        if (archive) await this._events.archive(this.event);
        else await this._events.unarchive(this.event);
        this.message.success('COMMON.OPERATION_COMPLETED');
        this.app.closePage();
      } catch (error) {
        this.message.error('COMMON.OPERATION_FAILED');
      } finally {
        this.loading.hide();
      }
    };
    const header = this.t._('COMMON.ARE_YOU_SURE');
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      { text: this.t._('COMMON.CONFIRM'), role: 'destructive', handler: doArchive }
    ];
    const alert = await this.alertCtrl.create({ header, buttons });
    alert.present();
  }
  async deleteEvent(): Promise<void> {
    const doDelete = async (): Promise<void> => {
      try {
        await this.loading.show();
        await this._events.delete(this.event);
        this.message.success('COMMON.OPERATION_COMPLETED');
        this.app.closePage();
      } catch (error) {
        if (error.message === 'Event is used') this.message.error('EVENTS.CANT_DELETE_IF_USED_ERROR');
        else this.message.error('COMMON.OPERATION_FAILED');
      } finally {
        this.loading.hide();
      }
    };
    const header = this.t._('COMMON.ARE_YOU_SURE');
    const subHeader = this.t._('COMMON.ACTION_IS_IRREVERSIBLE');
    const message = this.t._('EVENTS.CANT_DELETE_IF_USED_WARNING');
    const buttons = [
      { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
      { text: this.t._('COMMON.DELETE'), role: 'destructive', handler: doDelete }
    ];
    const alert = await this.alertCtrl.create({ header, subHeader, message, buttons });
    alert.present();
  }

  enterEditMode(): void {
    this.entityBeforeChange = new AssemblyEvent(this.event);
    this.editMode = UXMode.EDIT;
  }
  exitEditMode(): void {
    if (this.editMode === UXMode.INSERT) this.app.closePage();
    else {
      this.event = this.entityBeforeChange;
      this.errors = new Set<string>();
      this.editMode = UXMode.VIEW;
    }
  }
}

export enum UXMode {
  VIEW,
  INSERT,
  EDIT
}
