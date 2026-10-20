import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

type AnyRecord = Record<string, any>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __inMemoryDbStore?: Map<any, AnyRecord[]>;
  __inMemoryDbSeq?: Map<any, number>;
};

function getColMeta(col: any): { table: any; key: string } | null {
  if (!col || typeof col !== "object") return null;
  for (const tbl of Object.values(schema)) {
    if (tbl && typeof tbl === "object") {
      for (const [k, v] of Object.entries(tbl)) {
        if (v === col) {
          return { table: tbl, key: k };
        }
      }
    }
  }
  if (typeof col.name === "string") {
    const camel = col.name.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    return { table: col.table, key: camel };
  }
  return null;
}

function evalCondition(cond: any, row: AnyRecord, joinedMap?: Map<any, AnyRecord | null>): boolean {
  if (!cond) return true;
  const chunks: any[] = cond.queryChunks;
  if (!Array.isArray(chunks)) return true;

  // Unwrap single nested SQL chunk if parent has only empty StringChunks around it
  const meaningful = chunks.filter((c) => {
    if (c && Array.isArray(c.value) && c.value.every((s: any) => typeof s === "string" && s.trim() === "" || s === "(" || s === ")")) {
      return false;
    }
    return true;
  });

  if (meaningful.length === 1 && meaningful[0]?.queryChunks) {
    return evalCondition(meaningful[0], row, joinedMap);
  }

  // Check if top-level chunks contain " and " or " or "
  const hasLogicalOp = chunks.some(
    (c) => c && Array.isArray(c.value) && c.value.some((s: any) => typeof s === "string" && (/^\s+and\s+$/i.test(s) || /^\s+or\s+$/i.test(s)))
  );

  if (hasLogicalOp) {
    let result: boolean | null = null;
    let currentOp: "and" | "or" = "and";
    for (const c of chunks) {
      if (c && Array.isArray(c.value)) {
        const text = c.value.join("");
        if (/^\s+and\s+$/i.test(text)) {
          currentOp = "and";
        } else if (/^\s+or\s+$/i.test(text)) {
          currentOp = "or";
        }
      } else if (c && Array.isArray(c.queryChunks)) {
        const val = evalCondition(c, row, joinedMap);
        if (result === null) {
          result = val;
        } else if (currentOp === "and") {
          result = result && val;
        } else {
          result = result || val;
        }
      }
    }
    return result ?? true;
  }

  // Binary comparison e.g. eq(col, paramOrCol)
  let leftVal: any = undefined;
  let rightVal: any = undefined;
  let foundLeft = false;

  const resolveOperand = (item: any) => {
    const meta = getColMeta(item);
    if (meta) {
      if (joinedMap && joinedMap.has(meta.table)) {
        const tblRow = joinedMap.get(meta.table);
        return tblRow ? tblRow[meta.key] : undefined;
      }
      return row[meta.key];
    }
    if (item && typeof item === "object" && "value" in item && "encoder" in item) {
      return item.value;
    }
    return item;
  };

  for (const c of chunks) {
    if (c && Array.isArray(c.value) && !("encoder" in c)) {
      continue;
    }
    if (!foundLeft) {
      leftVal = resolveOperand(c);
      foundLeft = true;
    } else {
      rightVal = resolveOperand(c);
      break;
    }
  }

  if (foundLeft) {
    return leftVal === rightVal;
  }
  return true;
}

function createInMemoryDb() {
  if (!globalForDb.__inMemoryDbStore) {
    globalForDb.__inMemoryDbStore = new Map();
  }
  if (!globalForDb.__inMemoryDbSeq) {
    globalForDb.__inMemoryDbSeq = new Map();
  }
  const store = globalForDb.__inMemoryDbStore;
  const seq = globalForDb.__inMemoryDbSeq;

  const getTableRows = (table: any): AnyRecord[] => {
    if (!store.has(table)) {
      store.set(table, []);
    }
    return store.get(table)!;
  };

  const applyDefaults = (table: any, input: AnyRecord): AnyRecord => {
    const record: AnyRecord = { ...input };
    const nextId = (seq.get(table) || 0) + 1;
    seq.set(table, nextId);
    if (record.id === undefined) {
      record.id = nextId;
    }
    if (table && typeof table === "object") {
      for (const [k, col] of Object.entries(table as AnyRecord)) {
        if (k === "id" || !col || typeof col !== "object") continue;
        if (record[k] === undefined) {
          if ("default" in col && col.default !== undefined) {
            record[k] = col.default;
          } else if (col.hasDefault) {
            record[k] = new Date();
          } else {
            record[k] = null;
          }
        }
      }
    }
    return record;
  };

  const buildSelectBuilder = (selection?: AnyRecord) => {
    let fromTable: any = null;
    let joinTable: any = null;
    let joinCond: any = null;
    let whereCond: any = null;
    let orderClause: any = null;
    let limitCount: number | null = null;

    const executeSelect = async () => {
      const baseRows = [...getTableRows(fromTable)];

      // Count aggregate check
      if (selection) {
        const entries = Object.entries(selection);
        if (
          entries.length === 1 &&
          entries[0][1]?.queryChunks?.some(
            (c: any) => Array.isArray(c?.value) && c.value.join("").toLowerCase().includes("count")
          )
        ) {
          const filtered = whereCond ? baseRows.filter((r) => evalCondition(whereCond, r)) : baseRows;
          return [{ [entries[0][0]]: filtered.length }];
        }
      }

      let working: Array<{ base: AnyRecord; joined: Map<any, AnyRecord | null> }> = baseRows.map((r) => {
        const map = new Map<any, AnyRecord | null>();
        map.set(fromTable, r);
        if (joinTable) {
          const joinRows = getTableRows(joinTable);
          const matched =
            joinRows.find((jr) => {
              const tempMap = new Map<any, AnyRecord | null>();
              tempMap.set(fromTable, r);
              tempMap.set(joinTable, jr);
              return evalCondition(joinCond, r, tempMap);
            }) || null;
          map.set(joinTable, matched);
        }
        return { base: r, joined: map };
      });

      if (whereCond) {
        working = working.filter((item) => evalCondition(whereCond, item.base, item.joined));
      }

      if (orderClause) {
        const chunks: any[] = orderClause.queryChunks || [];
        let sortKey = "id";
        let isDesc = false;
        for (const c of chunks) {
          const meta = getColMeta(c);
          if (meta) sortKey = meta.key;
          if (c && Array.isArray(c.value) && c.value.join("").toLowerCase().includes("desc")) {
            isDesc = true;
          }
        }
        working.sort((a, b) => {
          const va = a.base[sortKey];
          const vb = b.base[sortKey];
          const na = va instanceof Date ? va.getTime() : va;
          const nb = vb instanceof Date ? vb.getTime() : vb;
          if (na < nb) return isDesc ? 1 : -1;
          if (na > nb) return isDesc ? -1 : 1;
          return isDesc ? b.base.id - a.base.id : a.base.id - b.base.id;
        });
      }

      if (limitCount !== null) {
        working = working.slice(0, limitCount);
      }

      if (!selection) {
        return working.map((w) => ({ ...w.base }));
      }

      return working.map((w) => {
        const projected: AnyRecord = {};
        for (const [alias, col] of Object.entries(selection)) {
          const meta = getColMeta(col);
          if (meta) {
            const tblRow = w.joined.get(meta.table) ?? w.base;
            projected[alias] = tblRow ? tblRow[meta.key] : null;
          } else {
            projected[alias] = w.base[alias];
          }
        }
        return projected;
      });
    };

    const builder: any = {
      from(tbl: any) {
        fromTable = tbl;
        return builder;
      },
      leftJoin(tbl: any, cond: any) {
        joinTable = tbl;
        joinCond = cond;
        return builder;
      },
      where(cond: any) {
        whereCond = cond;
        return builder;
      },
      orderBy(ord: any) {
        orderClause = ord;
        return builder;
      },
      limit(n: number) {
        limitCount = n;
        return builder;
      },
      then(onFulfilled?: any, onRejected?: any) {
        return executeSelect().then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  const mockDb: any = {
    select: (selection?: AnyRecord) => buildSelectBuilder(selection),
    insert: (table: any) => ({
      values: (valOrArr: AnyRecord | AnyRecord[]) => {
        const items = Array.isArray(valOrArr) ? valOrArr : [valOrArr];
        const tableRows = getTableRows(table);
        const inserted = items.map((item) => {
          const rec = applyDefaults(table, item);
          tableRows.push(rec);
          return { ...rec };
        });
        const promise = Promise.resolve(inserted);
        return {
          returning: () => promise,
          then: promise.then.bind(promise),
        };
      },
    }),
    update: (table: any) => ({
      set: (updates: AnyRecord) => {
        let whereCond: any = null;
        const executeUpdate = async () => {
          const tableRows = getTableRows(table);
          const updated: AnyRecord[] = [];
          for (const row of tableRows) {
            if (!whereCond || evalCondition(whereCond, row)) {
              Object.assign(row, updates);
              updated.push({ ...row });
            }
          }
          return updated;
        };
        const updateBuilder: any = {
          where(cond: any) {
            whereCond = cond;
            return updateBuilder;
          },
          returning() {
            return executeUpdate();
          },
          then(onFulfilled?: any, onRejected?: any) {
            return executeUpdate().then(onFulfilled, onRejected);
          },
        };
        return updateBuilder;
      },
    }),
    delete: (table: any) => {
      let whereCond: any = null;
      const executeDelete = async () => {
        const tableRows = getTableRows(table);
        const remaining: AnyRecord[] = [];
        const deleted: AnyRecord[] = [];
        for (const row of tableRows) {
          if (!whereCond || evalCondition(whereCond, row)) {
            deleted.push({ ...row });
          } else {
            remaining.push(row);
          }
        }
        store.set(table, remaining);
        return deleted;
      };
      const deleteBuilder: any = {
        where(cond: any) {
          whereCond = cond;
          return deleteBuilder;
        },
        returning() {
          return executeDelete();
        },
        then(onFulfilled?: any, onRejected?: any) {
          return executeDelete().then(onFulfilled, onRejected);
        },
      };
      return deleteBuilder;
    },
    execute: async () => ({ rows: [{ "?column?": 1 }] }),
  };

  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  return new Proxy(mockDb, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "query") return new Proxy({}, { get: () => noOp });
      return async () => [];
    },
  });
}

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>>;

try {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  db = drizzle(pool, { schema });
} catch {
  console.warn("[AI Studio] Database not connected — using in-memory mock");
  db = createInMemoryDb() as unknown as ReturnType<typeof drizzle<typeof schema>>;
}

export { pool, db };
