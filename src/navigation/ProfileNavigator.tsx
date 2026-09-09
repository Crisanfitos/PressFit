import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import PhysicalProgressScreen from '../screens/PhysicalProgressScreen';
import PlateSettingsScreen from '../screens/PlateSettingsScreen';

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PhysicalProgress: undefined;
    PlateSettings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="PhysicalProgress" component={PhysicalProgressScreen} />
            <Stack.Screen name="PlateSettings" component={PlateSettingsScreen} />
        </Stack.Navigator>
    );
};

export default ProfileNavigator;
