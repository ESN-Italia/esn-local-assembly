import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AppService } from '@app/app.service';

import { Topic } from '@models/topic.model';

@Component({
  selector: 'app-topic',
  templateUrl: 'topic.component.html',
  styleUrls: ['topic.component.scss']
})
export class TopicComponent {
  /**
   * The topic to show. If null, load a skeleton instead.
   */
  @Input() topic: Topic | null;
  /**
   * Whether to display the topic as a grid row.
   */
  @Input() row = false;
  /**
   * In case `row`, whether to display the header row.
   */
  @Input() header = false;
  /**
   * Trigger when a topic is selected.
   */
  @Output() select = new EventEmitter<void>();

  constructor(public app: AppService) {}
}
