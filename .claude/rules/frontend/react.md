# React Frontend Rules

- **State Management:** Prioritize functional state updates `setState(prev => ...)` when the new state depends on the old state.
- **Hooks:** Ensure exhaustive dependency arrays in `useMemo`, `useCallback`, and `useEffect`. Wait to memoize components until profiling finds a need.
- **Props Matching:** Use object destructuring for component props prominently, e.g. `const WorkoutCard = ({ title, duration }: WorkoutProps) => { ... }`.
- **Conditional Rendering:** Be careful with short-circuiting conditional rendering with numbers (`length && <Component/>`). Cast lengths to boolean or verify `length > 0`.
- **Ref forwarding:** Use `forwardRef` carefully and safely pass it downwards when required by parent abstractions.
