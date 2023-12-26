import { Component, Input } from '@angular/core';
import { IonRefresher } from '@ionic/angular';
import { IDEALoadingService, IDEAMessageService } from '@idea-ionic/common';

import { AppService } from '@app/app.service';
import { VotingService } from './voting.service';

import { Voter, VotingSession } from '@models/votingSession.model';

@Component({
  selector: 'voting-session',
  templateUrl: 'votingSession.page.html',
  styleUrls: ['votingSession.page.scss']
})
export class VotingSessionPage {
  @Input() sessionId: string;
  votingSession: VotingSession;

  absentVoters: Voter[];

  constructor(
    private loading: IDEALoadingService,
    private message: IDEAMessageService,
    private _voting: VotingService,
    public app: AppService
  ) {}
  async ionViewWillEnter(): Promise<void> {
    try {
      await this.loading.show();
      await this.loadResources();
    } catch (error) {
      this.message.error('COMMON.NOT_FOUND');
    } finally {
      this.loading.hide();
    }
  }
  private async loadResources(): Promise<void> {
    this.votingSession = await this._voting.getById(this.sessionId);
    if (this.votingSession.results) this.absentVoters = this.votingSession.getAbsentVoters();
  }
  async handleRefresh(refresh: IonRefresher): Promise<void> {
    await this.loadResources();
    refresh.complete();
  }

  manageSession(): void {
    this.app.goToInTabs(['voting', this.votingSession.sessionId, 'manage']);
  }

  wasVoterAbsent(voter: Voter): boolean {
    return this.absentVoters.some(x => x.id === voter.id);
  }

  downloadResults(): void {
    // @todo use this.votingSession.results
    // filename const filename = `${this.votingSession.name.replace(/[^\w\s]/g, '')} - ${this.t._('VOTING.RESULTS')}.xlsx`;
  }
}
