import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface SetInputProps {
    value: string | number;
    placeholder?: string;
    onChange: (value: string) => void;
    isEditable: boolean;
    colors: any;
}

const SetInput: React.FC<SetInputProps> = ({
    value,
    placeholder = '-',
    onChange,
    isEditable,
    colors,
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
            style={[
                styles.input,
                {
                    backgroundColor: isEditable ? colors.inputBackground : colors.surfaceHighlight,
                    borderColor: colors.border,
                    color: isEditable ? colors.text : colors.textSecondary,
                },
            ]}
            value={localValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            editable={isEditable}
            onChangeText={setLocalValue}
            onBlur={handleBlur}
            selectTextOnFocus={localValue.length > 0}
        />
    );
};

const styles = StyleSheet.create({
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default SetInput;
