import React from 'react';
import { Text, TextInput, Keyboard } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import KeyboardAwareContainer from '../../src/components/KeyboardAwareContainer';

jest.spyOn(Keyboard, 'dismiss');

describe('KeyboardAwareContainer Component (RNTL)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly when scrollable is true', async () => {
    const { getByTestId, getByText } = await render(
      <KeyboardAwareContainer testID="test-container">
        <Text>Child Text</Text>
      </KeyboardAwareContainer>
    );

    expect(getByTestId('test-container')).toBeTruthy();
    expect(getByText('Child Text')).toBeTruthy();
  });

  it('renders children correctly when scrollable is false', async () => {
    const { getByTestId, getByText } = await render(
      <KeyboardAwareContainer scrollable={false} testID="non-scroll-container">
        <Text>Static Content</Text>
      </KeyboardAwareContainer>
    );

    expect(getByTestId('non-scroll-container')).toBeTruthy();
    expect(getByText('Static Content')).toBeTruthy();
  });

  it('dismisses keyboard when touchable background is pressed', async () => {
    const { getByTestId } = await render(
      <KeyboardAwareContainer testID="dismiss-container">
        <TextInput testID="input" placeholder="Type here" />
      </KeyboardAwareContainer>
    );

    const touchable = getByTestId('keyboard-dismiss-touchable');
    fireEvent.press(touchable);

    expect(Keyboard.dismiss).toHaveBeenCalled();
  });

  it('does not render dismiss touchable when dismissOnClickOutside is false', async () => {
    const { queryByTestId, getByText } = await render(
      <KeyboardAwareContainer dismissOnClickOutside={false}>
        <Text>No dismiss touchable</Text>
      </KeyboardAwareContainer>
    );

    expect(queryByTestId('keyboard-dismiss-touchable')).toBeNull();
    expect(getByText('No dismiss touchable')).toBeTruthy();
  });
});
