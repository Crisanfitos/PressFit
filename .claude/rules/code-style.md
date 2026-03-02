# Code Style Rules

- **Indentation:** Use 2 spaces for indentation.
- **Naming:** CamelCase for variables/functions (`fetchData`), PascalCase for React Components and types/interfaces (`WorkoutCard`, `UserType`), UPPER_SNAKE_CASE for constants (`MAX_ATTEMPTS`).
- **Typing:** Provide explicit return types on important context providers, services, and complex custom hooks.
- **Exports:** Prefer named exports for functions and hooks to ensure predictable imports. Use default exports for top-level React Navigation screens if preferred pattern matches.
- **Comments:** Keep comments to why rather than what, except for highly complex algorithms. JsDoc comments for exported utility functions are encouraged.
