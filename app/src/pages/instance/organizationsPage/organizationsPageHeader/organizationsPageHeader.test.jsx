import React from 'react';
import { shallow } from 'enzyme';
import { OrganizationsPageHeader } from './organizationsPageHeader';

jest.mock('react-intl', () => ({
  defineMessages: (messages) => messages,
  useIntl: () => ({
    formatMessage: ({ defaultMessage }) => defaultMessage,
  }),
}));

jest.mock('react-tracking', () => ({
  useTracking: () => ({
    trackEvent: jest.fn(),
  }),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => false),
}));

jest.mock('html-react-parser', () => (value) => value);

jest.mock('@reportportal/ui-kit', () => ({
  BaseIconButton: ({ children, ...rest }) => <button type="button" {...rest}>{children}</button>,
  Button: ({ children, icon, ...rest }) => (
    <button
      type="button"
      data-button-label={typeof children === 'string' ? children : ''}
      {...rest}
    >
      {icon}
      {children}
    </button>
  ),
  PlusIcon: () => <span>plus</span>,
}));

jest.mock('components/fields/searchField', () => ({
  SearchField: () => <div className="search-field" />,
}));

jest.mock('controllers/filter', () => ({
  withFilter: () => (Component) => Component,
}));

jest.mock('controllers/instance/organizations', () => ({
  organizationsListLoadingSelector: jest.fn(),
}));

jest.mock('components/filterEntities/containers', () => ({
  createFilterEntitiesURLContainer: () => () => null,
}));

jest.mock('hooks/useUserPermissions', () => ({
  useUserPermissions: () => ({
    canWorkWithOrganizationFilter: false,
    canWorkWithOrganizationsSorting: false,
    canExportOrganizations: false,
  }),
}));

jest.mock('./organizationsFilter', () => ({
  OrganizationsFilter: () => null,
}));

jest.mock('./organizationsSorting', () => ({
  OrganizationsSorting: () => null,
}));

jest.mock('./organizationsExport', () => ({
  OrganizationsExport: () => null,
}));

const createProps = (overrides = {}) => ({
  hasPermission: true,
  isEmpty: false,
  searchValue: '',
  setSearchValue: jest.fn(),
  openPanelView: jest.fn(),
  openTableView: jest.fn(),
  isOpenTableView: false,
  appliedFiltersCount: 0,
  setAppliedFiltersCount: jest.fn(),
  onCreateOrganization: jest.fn(),
  ...overrides,
});

describe('OrganizationsPageHeader', () => {
  test('renders enabled create button when permission is granted', () => {
    const onCreateOrganization = jest.fn();
    const wrapper = shallow(
      <OrganizationsPageHeader {...createProps({ onCreateOrganization })} />,
    );

    const createButton = wrapper.find('Button').first();

    expect(createButton.exists()).toBe(true);
    expect(createButton.prop('children')).toBe('Create Organization');
    expect(createButton.prop('disabled')).toBeFalsy();

    createButton.simulate('click');

    expect(onCreateOrganization).toHaveBeenCalledTimes(1);
  });

  test('does not render create button when permission is missing', () => {
    const wrapper = shallow(
      <OrganizationsPageHeader {...createProps({ hasPermission: false })} />,
    );

    expect(wrapper.find('Button')).toHaveLength(0);
  });
});