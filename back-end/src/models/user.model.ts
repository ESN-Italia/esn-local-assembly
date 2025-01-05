import { Resource } from 'idea-toolbox';

import { UsersOriginDisplayOptions } from './configurations.model';

/**
 * The list of interesting roles on which to assign permissions in the platform.
 */
export enum UserRoles {
  INTERNATIONAL_BOARD = 'INTERNATIONAL_BOARD',
  INTERNATIONAL_SECRETARIAT = 'INTERNATIONAL_SECRETARIAT',
  INTERNATIONAL_LEVEL = 'INTERNATIONAL_LEVEL',
  INTERNATIONAL_GA_CT = 'INTERNATIONAL_GA_CT',
  INTERNATIONAL_AB = 'INTERNATIONAL_AB',
  INTERNATIONAL_AC = 'INTERNATIONAL_AC',
  NATIONAL_BOARD = 'NATIONAL_BOARD',
  NATIONAL_LEVEL = 'NATIONAL_LEVEL',
  LOCAL_BOARD = 'LOCAL_BOARD',
  LOCAL_LEVEL = 'LOCAL_LEVEL'
}

/**
 * The map between the platform's roles with the (known) interesting roles on ESN Accounts.
 * Roles that ends with "*" are intended to be: "any role with that prefix".
 * Note: all roles are lower-cased (since they will be handled with a case-insensitive logic).
 */
export const ESN_ACCOUNTS_ROLES_MAP: { [userRole: string]: string[] } = {
  INTERNATIONAL_BOARD: [
    'international.president',
    'international.vicepresident',
    'international.treasurer',
    'international.webprojectadministrator',
    'international.externalrelations'
  ],
  INTERNATIONAL_SECRETARIAT: ['international.officestaff'],
  INTERNATIONAL_GA_CT: ['international.cnrsecretary', 'international.agmchair', 'international.cnradmin'],
  INTERNATIONAL_AB: ['international.ab.*'],
  INTERNATIONAL_AC: ['international.ac.*'],
  INTERNATIONAL_LEVEL: ['international.*'],
  NATIONAL_BOARD: ['national.regularboardmember'],
  NATIONAL_LEVEL: ['national.*'],
  LOCAL_BOARD: ['local.regularboardmember'],
  LOCAL_LEVEL: ['local.*']
};
export const ITALIAN_SECTIONS_NAMES: { [key: string]: string} = {
  'it-anco-esa': 'ESN Ancona',
  'it-aqui-esn': "ESN L'Aquila",
  'it-bari-esn': 'ESN Bari',
  'it-bene-esn': 'ESN Maleventum',
  'it-berg-esn': 'ESN Bergamo',
  'it-bocc-esn': 'ESN Milano Bocconi',
  'it-bolo-esn': 'ESN Bologna',
  'it-bres-esn': 'ESN Brescia',
  'it-cagl-esn': 'ESN Cagliari',
  'it-came-aur': 'ESN A.U.R.E. Camerino',
  'it-camp-esn': 'ESN Unimol',
  'it-cata-ase': 'ESN Catania',
  'it-cose-esn': 'ESN Cosenza',
  'it-ferr-esn': 'ESN Ferrara',
  'it-flor-esn': 'ESN Florentia',
  'it-fogg-esn': 'ESN Foggia',
  'it-geno-esn': 'ESN GEG Genova',
  'it-insu-esn': 'ESN Insubria',
  'it-lecc-lis': 'ESN Lecce',
  'it-mace-esn': 'ESN Macerata',
  'it-mess-esn': 'ESN Messina',
  'it-mila-bic': 'ESN Milano-Bicocca',
  'it-mila-iul': 'ESN Milano IULM',
  'it-mila-pol': 'ESN Politecnico Milano',
  'it-mila-sta': 'ESN Milano Statale',
  'it-mila-uca': 'ESN Milano Unicatt',
  'it-mode-esn': 'ESN Modena e Reggio Emilia',
  'it-napo-esn': 'ESN Napoli',
  'it-pado-esn': 'ESN Padova',
  'it-pale-esn': 'ESN Palermo',
  'it-parm-asi': 'ESN ASSI Parma',
  'it-pavi-esn': 'ESN STEP Pavia',
  'it-peru-pep': 'ESN Perugia',
  'it-pesc-ase': 'ESN Chieti Pescara',
  'it-pisa-esn': 'ESN Pisa',
  'it-pote-esn': 'ESN Sui-Generis Basilicata',
  'it-rave-esn': 'ESN Ravenna',
  'it-reca-esn': 'ESN Reggio Calabria',
  'it-rimi-esn': 'ESN Rimini',
  'it-roma-ase': 'ESN Roma ASE',
  'it-roma-lui': 'ESN Roma LUISS',
  'it-roma-tre': 'ESN Roma Tre',
  'it-sale-esn': 'ESN Salerno',
  'it-sass-esn': 'ESN Sassari',
  'it-sien-ges': 'ESN Siena GES',
  'it-tava-esn': 'ESN Udine',
  'it-tera-esn': 'ESN Teramo',
  'it-tori-esn': 'ESN Torino',
  'it-tren-esn': 'ESN Trento',
  'it-trie-esn': 'ESN Trieste',
  'it-urbi-esn': 'ESN Urbino',
  'it-vene-mam': 'ESN Venezia',
  'it-vero-esn': 'ESN ASE Verona'
};
export class User extends Resource {
  /**
   * Username in ESN Accounts (lowercase).
   */
  userId: string;
  /**
   * Email address.
   */
  email: string;
  /**
   * First name.
   */
  firstName: string;
  /**
   * Last name.
   */
  lastName: string;
  /**
   * Section code in ESN Accounts.
   */
  roles: string[];
  /**
   * Section code in ESN Accounts.
   */
  sectionCode: string;
  /**
   * ESN Section.
   */
  section: string;
  /**
   * ESN Country.
   */
  country: string;
  /**
   * The URL to the user's avatar.
   */
  avatarURL: string;
  /**
   * Whether the user is administrator, based on the platform's configurations.
   * A change in this permission will require a new sign-in to take full place.
   */
  isAdministrator: boolean;
  /**
   * Whether the user can manage opportunities, based on the platform's configurations.
   * A change in this permission will require a new sign-in to take full place.
   */
  canManageOpportunities: boolean;
  /**
   * Whether the user can manage the dashboard, based on the platform's configurations.
   * A change in this permission will require a new sign-in to take full place.
   */
  canManageDashboard: boolean;

  /**
   * Whether the user has one of the allowed roles.
   */
  static isAllowedBasedOnRoles = (user: User, allowedRoles: UserRoles[]): boolean => {
    const allowedESNAccountsRoles: string[] = [];
    for (const role of allowedRoles) allowedESNAccountsRoles.push(...ESN_ACCOUNTS_ROLES_MAP[role]);

    return user.roles
      .map(userRole => userRole.toLowerCase())
      .some(userRole =>
        allowedESNAccountsRoles.some(allowedRole =>
          allowedRole.endsWith('*')
            ? userRole.startsWith(allowedRole.slice(0, allowedRole.length - 1))
            : allowedRole === userRole
        )
      );
  };

  load(x: any): void {
    super.load(x);
    this.userId = this.clean(x.userId, String)?.toLowerCase();
    this.email = this.clean(x.email, String);
    this.firstName = this.clean(x.firstName, String);
    this.lastName = this.clean(x.lastName, String);
    this.roles = this.cleanArray(x.roles, String);
    this.sectionCode = this.clean(x.sectionCode, String);
    this.section = this.clean(x.section, String);
    this.country = this.clean(x.country, String);
    this.avatarURL = this.clean(x.avatarURL, String);
    this.isAdministrator = this.clean(x.isAdministrator, Boolean);
    this.canManageOpportunities = this.clean(x.canManageOpportunities, Boolean);
    this.canManageDashboard = this.clean(x.canManageDashboard, Boolean);
  }

  /**
   * Get a string representing the origin of the user.
   */
  getOrigin(displayOption: UsersOriginDisplayOptions = UsersOriginDisplayOptions.BOTH): string {
    return getUserOrigin(this, displayOption);
  }
}

/**
 * Get a string representing the origin of a user.
 */
export const getUserOrigin = (
  user: { country?: string; section?: string },
  displayOption: UsersOriginDisplayOptions
): string => {
  if (displayOption === UsersOriginDisplayOptions.COUNTRY) return user.country;
  if (displayOption === UsersOriginDisplayOptions.SECTION) return user.section;
  if (displayOption === UsersOriginDisplayOptions.BOTH) {
    if (user.country === user.section) return user.section;
    return [user.country, user.section].filter(x => x).join(' - ');
  } else return null;
};
