export const getEnvironment = (key: string): string => {
  const value: string | undefined = process?.env[key]?.trim();

  if (value === undefined || value.trim() === "") {
    throw new Error(`${key} env var is empty or unset`);
  }

  return value;
};
