import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface SetInputProps {
    value: string | number;
    placeholder?: string;
    onChange: (value: string) => void;
    isEditable: boolean;
    colors: any;
    maxLength?: number;
    testID?: string;
}

const SetInput: React.FC<SetInputProps> = React.memo(({
    value,
    placeholder = '-',
    onChange,
    isEditable,
    colors,
    maxLength,
    testID = 'set-input',
}) => {
    // Local state to handle typing without triggering saves on each keystroke
    const [localValue, setLocalValue] = useState(
        value !== '' && value !== 0 ? String(value) : ''
    );

    // Sync local value when prop value changes externally
    useEffect(() => {
        const newValue = value !== '' && value !== 0 ? String(value) : '';
        setLocalValue(newValue);
    }, [value]);

    // Only save when user finishes editing (loses focus)
    const handleBlur = () => {
        if (localValue !== String(value)) {
            onChange(localValue);
        }
    };

    return (
        <TextInput
            testID={testID}
            style={[
                styles.input,
                {
                    backgroundColor: isEditable
                        ? (colors.surfaceContainerLowest || colors.inputBackground || colors.surface)
                        : (colors.surfaceContainerHigh || colors.surfaceHighlight || colors.surface),
                    borderColor: colors.outlineVariant || colors.border,
                    color: isEditable ? (colors.onSurface || colors.text) : (colors.onSurfaceVariant || colors.textSecondary),
                },
            ]}
            value={localValue}
            placeholder={placeholder}
            placeholderTextColor={colors.onSurfaceVariant || colors.textSecondary}
            keyboardType="numeric"
            editable={isEditable}
            onChangeText={setLocalValue}
            onBlur={handleBlur}
            maxLength={maxLength}
        />
    );
});

const styles = StyleSheet.create({
    input: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 2,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
});

SetInput.displayName = 'SetInput';

export default SetInput;
