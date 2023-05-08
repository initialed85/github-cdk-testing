interface Environment {
  readonly name: string;
  readonly stackFactory?: (env: Environment) => void;
}

export let environments: Environment[] = [
  {
    name: "prod",
  },
];
