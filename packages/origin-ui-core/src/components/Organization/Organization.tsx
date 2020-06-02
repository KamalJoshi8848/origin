import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink, Route, Redirect } from 'react-router-dom';
import { Role, isRole } from '@energyweb/origin-backend-core';

import { PageContent } from '../PageContent/PageContent';
import { useLinks } from '../../utils/routing';
import { getUserOffchain } from '../../features/users/selectors';
import { OrganizationForm } from './OrganizationForm';
import { OrganizationTable } from './OrganizationTable';
import { OrganizationView } from './OrganizationView';
import { OrganizationInvite } from './OrganizationInvite';
import { OrganizationInvitations } from './OrganizationInvitations';
import { OrganizationUsersTable } from './OrganizationUsersTable';

export const roleNames = {
    [Role.OrganizationUser]: 'organization.invitations.roles.member',
    [Role.OrganizationDeviceManager]: 'organization.invitations.roles.deviceManager',
    [Role.OrganizationAdmin]: 'organization.invitations.roles.admin'
};

export function Organization() {
    const userOffchain = useSelector(getUserOffchain);

    const { getOrganizationLink } = useLinks();

    const isLoggedIn = Boolean(userOffchain);

    const Menu = [
        {
            key: 'organization-users',
            label: 'Members',
            component: OrganizationUsersTable,
            hide: !isLoggedIn || !isRole(userOffchain, Role.OrganizationAdmin)
        },
        {
            key: 'organization-invitations',
            label: 'Invitations',
            component: OrganizationInvitations,
            hide: !isLoggedIn
        },
        {
            key: 'organization-invite',
            label: 'Invite',
            component: OrganizationInvite,
            hide:
                !isLoggedIn ||
                !isRole(userOffchain, Role.OrganizationAdmin) ||
                !userOffchain?.organization
        },
        {
            key: 'organization-register',
            label: 'Register',
            component: OrganizationForm,
            hide: !isLoggedIn || userOffchain?.organization
        },
        {
            key: 'organization-table',
            label: 'All organizations',
            component: OrganizationTable,
            hide: !isLoggedIn
        },
        {
            key: 'organization-view',
            label: 'View',
            component: OrganizationView,
            hide: true
        }
    ];

    const firstNotHiddenRoute = Menu.filter((i) => !i.hide)[0]?.key;

    return (
        <div className="PageWrapper">
            <div className="PageNav">
                <ul className="NavMenu nav">
                    {Menu.map((menu) => {
                        if (menu.hide) {
                            return null;
                        }

                        return (
                            <li key={menu.key}>
                                <NavLink
                                    exact={true}
                                    to={`${getOrganizationLink()}/${menu.key}`}
                                    activeClassName="active"
                                >
                                    {menu.label}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <Route
                path={`${getOrganizationLink()}/:key/:id?`}
                render={(props) => {
                    const key = props.match.params.key;
                    const matches = Menu.filter((item) => {
                        return item.key === key;
                    });

                    return (
                        <PageContent
                            menu={matches.length > 0 ? matches[0] : null}
                            redirectPath={getOrganizationLink()}
                        />
                    );
                }}
            />

            {firstNotHiddenRoute && (
                <Route
                    exact={true}
                    path={`${getOrganizationLink()}`}
                    render={() => (
                        <Redirect
                            to={{
                                pathname: `${getOrganizationLink()}/${firstNotHiddenRoute}`
                            }}
                        />
                    )}
                />
            )}
        </div>
    );
}
