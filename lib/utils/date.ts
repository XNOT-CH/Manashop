/** Returns current datetime as MySQL-compatible string: "YYYY-MM-DD HH:MM:SS" */
export const mysqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");
