import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import PhysicalProgressScreen from '../screens/PhysicalProgressScreen';

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PhysicalProgress: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="PhysicalProgress" component={PhysicalProgressScreen} />
        </Stack.Navigator>
    );
};

export default ProfileNavigator;
