---
description: Automatically generate a basic React Native component template for PressFit Expo.
---
# Creating a React Native component

When instructed to run this skill or generate a standard component, perform the following structural steps:

1. Identify the requested component name and path (e.g., `src/components/MyNewComponent.tsx`).
2. Generate the boiler plate including:
   - React Native imports (`View`, `Text`, `StyleSheet` by default).
   - Props interface typing (`MyNewComponentProps`).
   - The functional component stub.
   - Default `StyleSheet.create({ container: { } })`.
3. Provide the result directly and ask if further complex logic (like Controller connection) should be added.
