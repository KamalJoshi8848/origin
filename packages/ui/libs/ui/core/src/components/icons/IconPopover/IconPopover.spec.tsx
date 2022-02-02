import React from 'react';
import { render } from '@testing-library/react';
import { composeStories } from '@storybook/testing-react';
import { IconSize } from './IconPopover';
import { Info } from '@mui/icons-material';

import * as stories from './IconPopover.stories';
const { Default: IconPopover } = composeStories(stories);

describe('IconPopover', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <IconPopover
        iconSize={IconSize.Large}
        icon={Info}
        popoverText={['This is popover text', 'Which is multiline']}
      />
    );
    expect(baseElement).toBeTruthy();
  });

  it('should match snapshot', () => {
    const { baseElement } = render(
      <IconPopover
        iconSize={IconSize.Large}
        icon={Info}
        popoverText={['This is popover text', 'Which is multiline']}
      />
    );
    expect(baseElement).toMatchSnapshot();
  });
});
