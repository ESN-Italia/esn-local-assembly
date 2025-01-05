import { Component, Input, OnInit } from '@angular/core';
import { IDEAStorageService } from '@idea-ionic/common';

import { AppService } from '../app.service';

import { environment as env } from '@env';
import { AlertButton } from '@ionic/angular';

@Component({
  selector: 'auth-page',
  templateUrl: 'auth.page.html',
  styleUrls: ['auth.page.scss']
})
export class AuthPage implements OnInit {
  @Input() token: string;
  @Input() data: string;
  @Input() codes: string;
  isAlertOpen = false;
  alertButtons: AlertButton[];

  title = this.app.configurations?.appTitle ?? env.idea.app.defaultTitle;
  version = env.idea.app.version;

  constructor(private storage: IDEAStorageService, public app: AppService) {}
  async ngOnInit(): Promise<void> {
    // complete the flow from ESN Accounts
    if (this.token) {
      const user = parseJWT(this.token);
      const tokenExpiresAt = user.exp * 1000;
      if (tokenExpiresAt > Date.now()) {
        await this.storage.set('token', this.token);
        await this.storage.set('tokenExpiresAt', tokenExpiresAt);
        await this.storage.set('user', user);
      }
      window.location.assign('');
    }
  }
  ionViewDidEnter(): void {
    if (this.codes) {
      const codesList = this.codes.split(',');
      console.log('codesList', codesList);
      this.alertButtons = codesList.map(code => ({
        text: `section code: ${code}`,
        handler: () => {
          this.isAlertOpen = false;
          const apiLoginURL = `https://${env.idea.api.url}/${env.idea.api.stage}/login`;
          const localhost = location.hostname.startsWith('localhost') ? '?localhost=8100' : '';
          window.location.assign(`${apiLoginURL}${localhost}&cs=${code}&data=${this.data}`);
        }
      }));
      this.isAlertOpen = true;
    }
  }
  startLoginFlowWithESNAccounts(): void {
    const apiLoginURL = `https://${env.idea.api.url}/${env.idea.api.stage}/login`;
    const localhost = location.hostname.startsWith('localhost') ? '?localhost=8100' : '';
    window.location.assign(`https://accounts.esn.org/cas/login?service=${apiLoginURL}${localhost}`);
  }
}

/**
 * Parse a JWT token without using external libraries.
 */
const parseJWT = (token: string): any => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};
