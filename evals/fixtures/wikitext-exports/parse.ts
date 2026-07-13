export const tokens = (source: string) => source.split(/\s+/);
export const parse = (source: string) => ({ type: "root", source });
