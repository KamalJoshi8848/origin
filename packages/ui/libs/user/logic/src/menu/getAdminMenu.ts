import { TFunction } from 'i18next';
import { TMenuSection } from '@energyweb/origin-ui-core';

export type TGetAdminMenuArgs = {
  t: TFunction;
  isOpen: boolean;
  showSection: boolean;
  showUsers: boolean;
  showClaims: boolean;
  showAllOrgs: boolean;
  menuButtonClass?: string;
  selectedMenuItemClass?: string;
};

type TUseAdminMenuFn = (args?: TGetAdminMenuArgs) => TMenuSection;

export const getAdminMenu: TUseAdminMenuFn = ({
  t,
  isOpen,
  showSection,
  showUsers,
  showAllOrgs,
  showClaims,
  menuButtonClass,
  selectedMenuItemClass,
}) => {
  return {
    isOpen,
    sectionTitle: t('navigation.admin.sectionTitle'),
    rootUrl: '/admin',
    show: showSection,
    menuList: [
      {
        url: 'users',
        label: t('navigation.admin.users'),
        show: showUsers,
      },
      {
        url: 'organizations',
        label: t('navigation.admin.organizations'),
        show: showAllOrgs,
      },
      {
        url: 'claims',
        label: t('navigation.admin.claims'),
        show: showClaims,
      },
    ],
    menuButtonClass,
    selectedMenuItemClass,
  };
};
