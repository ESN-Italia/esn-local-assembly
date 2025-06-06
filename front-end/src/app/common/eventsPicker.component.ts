import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IDEATranslationsModule } from '@idea-ionic/common';

import { AssemblyEventsService } from '@tabs/configurations/events/events.service';

import { AssemblyEvent, AssemblyEventAttached } from '@models/event.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  selector: 'app-events-picker',
  template: `
    <ion-item [lines]="lines" [color]="color">
      <ion-label position="stacked">
        {{ 'EVENTS.EVENT' | translate }} <ion-text class="obligatoryDot" *ngIf="obligatory"></ion-text>
      </ion-label>
      <ion-select
        interface="popover"
        [compareWith]="compareWithEvent"
        [(ngModel)]="event"
        (ngModelChange)="eventChange.emit($event)"
        [disabled]="!editMode || !events"
      >
        <ion-select-option *ngIf="!obligatory" [value]="null"></ion-select-option>
        <ion-select-option *ngFor="let event of events" [value]="event">{{ event.name }}</ion-select-option>
      </ion-select>
    </ion-item>
  `,
  styles: []
})
export class EventsPickerComponent implements OnInit {
  /**
   * The event picked.
   */
  @Input() event: AssemblyEventAttached;
  @Output() eventChange = new EventEmitter<AssemblyEventAttached>();
  /**
   * The color of the item.
   */
  @Input() color: string;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * Whether the component is editable.
   */
  @Input() editMode = false;
  /**
   * Whether picking the event is obligatory.
   */
  @Input() obligatory = false;

  events: AssemblyEvent[];

  constructor(private _events: AssemblyEventsService) {}
  async ngOnInit(): Promise<void> {
    this.events = await this._events.getList();
  }

  compareWithEvent(e1: AssemblyEventAttached, e2: AssemblyEventAttached): boolean {
    return e1 && e2 ? e1.eventId === e2.eventId : e1 === e2;
  }
}
