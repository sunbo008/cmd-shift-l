/** CSS modules ambient for tsc. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
