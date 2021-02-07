export const noTags = (name: string): boolean =>
  name === 'master' ||
    name === 'main' ||
    Boolean(name.match(/^\d+(\.\d+)?$/))
