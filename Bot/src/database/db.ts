import fs from "fs";
import path from "path";

const dbPath = path.join(__dirname, "data.json");

let data: Record<string, any> = {};

if (fs.existsSync(dbPath)) {
  try {
    data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    data = {};
  }
}

function save() {
  fs.writeFileSync(
    dbPath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function getPath(key: string) {
  return key.split(".");
}

function getValue(key: string) {
  const parts = getPath(key);

  let current: any = data;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function setValue(key: string, value: any) {
  const parts = getPath(key);

  let current: any = data;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    if (
      !current[part] ||
      typeof current[part] !== "object"
    ) {
      current[part] = {};
    }

    current = current[part];
  }

  current[parts[parts.length - 1]] = value;

  save();
}

function deleteValue(key: string) {
  const parts = getPath(key);

  let current: any = data;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return;

    current = current[parts[i]];
  }

  delete current[parts[parts.length - 1]];

  save();
}

export const db = {
  async get(key: string) {
    return getValue(key);
  },

  async set(key: string, value: any) {
    setValue(key, value);
  },

  async delete(key: string) {
    deleteValue(key);
  },

  async has(key: string) {
    return getValue(key) !== undefined;
  },
};
