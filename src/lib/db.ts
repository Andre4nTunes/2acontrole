import { Pool, QueryResult } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined. Please set it in .env.local or your deployment environment.");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function parseClientRow(row: any): Client {
  return {
    ...row,
    monthlyFee: Number(row.monthlyFee),
    dueDay: Number(row.dueDay),
    sortOrder: Number(row.sortOrder),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function parseExpenseRow(row: any): Expense {
  return {
    ...row,
    amount: Number(row.amount),
    dueDay: Number(row.dueDay),
    sortOrder: Number(row.sortOrder),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function parseClientPaymentRow(row: any): ClientPayment {
  return {
    ...row,
    clientId: Number(row.clientId),
    amount: Number(row.amount),
    paidAt: new Date(row.paidAt),
    createdAt: new Date(row.createdAt),
  };
}

function parseExpenseSettlementRow(row: any): ExpenseSettlement {
  return {
    ...row,
    expenseId: Number(row.expenseId),
    paidAt: new Date(row.paidAt),
    createdAt: new Date(row.createdAt),
  };
}

export type Client = {
  id: number;
  name: string;
  contact: string | null;
  monthlyFee: number;
  dueDay: number;
  sortOrder: number;
  active: boolean;
  deletedAt: Date | null;
  archivedFromCompetence: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientPayment = {
  id: number;
  clientId: number;
  competence: string;
  amount: number;
  note: string | null;
  paidAt: Date;
  createdAt: Date;
};

export type Expense = {
  id: number;
  name: string;
  category: string | null;
  amount: number;
  dueDay: number;
  sortOrder: number;
  active: boolean;
  deletedAt: Date | null;
  archivedFromCompetence: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseSettlement = {
  id: number;
  expenseId: number;
  competence: string;
  note: string | null;
  paidAt: Date;
  createdAt: Date;
};

export type User = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

export const db = {
  client: {
    async findFirst(options: {
      orderBy?: Record<string, "asc" | "desc">;
      select?: Record<string, boolean>;
    }): Promise<Partial<Client> | null> {
      const orderByClause = options.orderBy
        ? Object.entries(options.orderBy)
          .map(([key, value]) => `${quoteIdentifier(key)} ${value.toUpperCase()}`)
          .join(", ")
        : `${quoteIdentifier("id")} ASC`;

      const selectFields = options.select
        ? Object.keys(options.select).map((field) => quoteIdentifier(field))
        : ["*"];

      const query = `SELECT ${selectFields.join(", ")} FROM "Client" ORDER BY ${orderByClause} LIMIT 1`;
      const result = await pool.query(query);
      return result.rows[0] ? parseClientRow(result.rows[0]) : null;
    },

    async findMany(options: {
      where?: {
        OR?: Array<{
          archivedFromCompetence: null | { gt: string };
        }>;
      };
      orderBy?: Array<Record<string, "asc" | "desc">>;
    }): Promise<Client[]> {
      let query = `SELECT * FROM "Client"`;
      const params: any[] = [];

      // Build WHERE clause
      if (options.where?.OR) {
        const conditions = options.where.OR.map((or) => {
          if (or.archivedFromCompetence === null) {
            return `"archivedFromCompetence" IS NULL`;
          } else if (or.archivedFromCompetence && typeof or.archivedFromCompetence === 'object' && 'gt' in or.archivedFromCompetence) {
            params.push(or.archivedFromCompetence.gt);
            return `"archivedFromCompetence" > $${params.length}`;
          }
          return "";
        }).filter(Boolean);

        if (conditions.length > 0) {
          query += ` WHERE (${conditions.join(" OR ")})`;
        }
      }

      // Build ORDER BY clause
      if (options.orderBy && options.orderBy.length > 0) {
        const orderClauses = options.orderBy
          .flatMap((ob) =>
            Object.entries(ob).map(([key, value]) => `"${key}" ${value.toUpperCase()}`)
          )
          .join(", ");
        query += ` ORDER BY ${orderClauses}`;
      } else {
        query += ` ORDER BY "id" ASC`;
      }

      const result = await pool.query(query, params);
      return result.rows.map(parseClientRow);
    },

    async create(data: {
      name: string;
      contact: string | null;
      monthlyFee: number;
      dueDay: number;
      sortOrder: number;
    }): Promise<Client> {
      const query = `
        INSERT INTO "Client" (name, contact, "monthlyFee", "dueDay", "sortOrder", active, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.name,
        data.contact,
        data.monthlyFee,
        data.dueDay,
        data.sortOrder,
      ]);
      return parseClientRow(result.rows[0]);
    },

    async findUniqueOrThrow(options: {
      where: { id: number };
    }): Promise<Client> {
      const query = `SELECT * FROM "Client" WHERE id = $1`;
      const result = await pool.query(query, [options.where.id]);
      if (result.rows.length === 0) {
        throw new Error(`No Client found with id ${options.where.id}`);
      }
      return parseClientRow(result.rows[0]);
    },

    async update(options: {
      where: { id: number };
      data: Partial<Client>;
    }): Promise<Client> {
      const entries = Object.entries(options.data).filter(
        ([_, value]) => value !== undefined
      );
      const setClause = entries
        .map(([key], index) => `"${key}" = $${index + 1}`)
        .join(", ");

      const query = `
        UPDATE "Client"
        SET ${setClause}, "updatedAt" = NOW()
        WHERE id = $${entries.length + 1}
        RETURNING *
      `;

      const values = [...entries.map(([_, value]) => value), options.where.id];
      const result = await pool.query(query, values);
      return parseClientRow(result.rows[0]);
    },
  },

  clientPayment: {
    async findUnique(options: {
      where: { clientId_competence: { clientId: number; competence: string } };
    }): Promise<ClientPayment | null> {
      const query = `
        SELECT * FROM "ClientPayment"
        WHERE "clientId" = $1 AND competence = $2
      `;
      const result = await pool.query(query, [
        options.where.clientId_competence.clientId,
        options.where.clientId_competence.competence,
      ]);
      return result.rows[0] || null;
    },

    async findMany(options: {
      where?: { competence: string };
    }): Promise<ClientPayment[]> {
      let query = `SELECT * FROM "ClientPayment"`;
      const params: any[] = [];

      if (options.where?.competence) {
        params.push(options.where.competence);
        query += ` WHERE competence = $${params.length}`;
      }

      const result = await pool.query(query, params);
      return result.rows;
    },

    async delete(options: { where: { id: number } }): Promise<void> {
      const query = `DELETE FROM "ClientPayment" WHERE id = $1`;
      await pool.query(query, [options.where.id]);
    },

    async create(data: {
      clientId: number;
      competence: string;
      amount: number;
      note?: string;
    }): Promise<ClientPayment> {
      const query = `
        INSERT INTO "ClientPayment" ("clientId", competence, amount, note, "paidAt", "createdAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.clientId,
        data.competence,
        data.amount,
        data.note || null,
      ]);
      return result.rows[0];
    },
  },

  expense: {
    async findFirst(options: {
      orderBy?: Record<string, "asc" | "desc">;
      select?: Record<string, boolean>;
    }): Promise<Partial<Expense> | null> {
      const orderByClause = options.orderBy
        ? Object.entries(options.orderBy)
          .map(([key, value]) => `${quoteIdentifier(key)} ${value.toUpperCase()}`)
          .join(", ")
        : `${quoteIdentifier("id")} ASC`;

      const selectFields = options.select
        ? Object.keys(options.select).map((field) => quoteIdentifier(field))
        : ["*"];

      const query = `SELECT ${selectFields.join(", ")} FROM "Expense" ORDER BY ${orderByClause} LIMIT 1`;
      const result = await pool.query(query);
      return result.rows[0] ? parseExpenseRow(result.rows[0]) : null;
    },

    async findMany(options: {
      where?: {
        OR?: Array<{
          archivedFromCompetence: null | { gt: string };
        }>;
      };
      orderBy?: Array<Record<string, "asc" | "desc">>;
    }): Promise<Expense[]> {
      let query = `SELECT * FROM "Expense"`;
      const params: any[] = [];

      // Build WHERE clause
      if (options.where?.OR) {
        const conditions = options.where.OR.map((or) => {
          if (or.archivedFromCompetence === null) {
            return `"archivedFromCompetence" IS NULL`;
          } else if (or.archivedFromCompetence && typeof or.archivedFromCompetence === 'object' && 'gt' in or.archivedFromCompetence) {
            params.push(or.archivedFromCompetence.gt);
            return `"archivedFromCompetence" > $${params.length}`;
          }
          return "";
        }).filter(Boolean);

        if (conditions.length > 0) {
          query += ` WHERE (${conditions.join(" OR ")})`;
        }
      }

      // Build ORDER BY clause
      if (options.orderBy && options.orderBy.length > 0) {
        const orderClauses = options.orderBy
          .flatMap((ob) =>
            Object.entries(ob).map(([key, value]) => `"${key}" ${value.toUpperCase()}`)
          )
          .join(", ");
        query += ` ORDER BY ${orderClauses}`;
      } else {
        query += ` ORDER BY "id" ASC`;
      }

      const result = await pool.query(query, params);
      return result.rows.map(parseExpenseRow);
    },

    async create(data: {
      name: string;
      category: string | null;
      amount: number;
      dueDay: number;
      sortOrder: number;
    }): Promise<Expense> {
      const query = `
        INSERT INTO "Expense" (name, category, amount, "dueDay", "sortOrder", active, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.name,
        data.category,
        data.amount,
        data.dueDay,
        data.sortOrder,
      ]);
      return parseExpenseRow(result.rows[0]);
    },

    async findUniqueOrThrow(options: {
      where: { id: number };
    }): Promise<Expense> {
      const query = `SELECT * FROM "Expense" WHERE id = $1`;
      const result = await pool.query(query, [options.where.id]);
      if (result.rows.length === 0) {
        throw new Error(`No Expense found with id ${options.where.id}`);
      }
      return parseExpenseRow(result.rows[0]);
    },

    async update(options: {
      where: { id: number };
      data: Partial<Expense>;
    }): Promise<Expense> {
      const entries = Object.entries(options.data).filter(
        ([_, value]) => value !== undefined
      );
      const setClause = entries
        .map(([key], index) => `"${key}" = $${index + 1}`)
        .join(", ");

      const query = `
        UPDATE "Expense"
        SET ${setClause}, "updatedAt" = NOW()
        WHERE id = $${entries.length + 1}
        RETURNING *
      `;

      const values = [...entries.map(([_, value]) => value), options.where.id];
      const result = await pool.query(query, values);
      return parseExpenseRow(result.rows[0]);
    },
  },

  expenseSettlement: {
    async findUnique(options: {
      where: { expenseId_competence: { expenseId: number; competence: string } };
    }): Promise<ExpenseSettlement | null> {
      const query = `
        SELECT * FROM "ExpenseSettlement"
        WHERE "expenseId" = $1 AND competence = $2
      `;
      const result = await pool.query(query, [
        options.where.expenseId_competence.expenseId,
        options.where.expenseId_competence.competence,
      ]);
      return result.rows[0] || null;
    },

    async findMany(options: {
      where?: { competence: string };
    }): Promise<ExpenseSettlement[]> {
      let query = `SELECT * FROM "ExpenseSettlement"`;
      const params: any[] = [];

      if (options.where?.competence) {
        params.push(options.where.competence);
        query += ` WHERE competence = $${params.length}`;
      }

      const result = await pool.query(query, params);
      return result.rows;
    },

    async delete(options: { where: { id: number } }): Promise<void> {
      const query = `DELETE FROM "ExpenseSettlement" WHERE id = $1`;
      await pool.query(query, [options.where.id]);
    },

    async create(data: {
      expenseId: number;
      competence: string;
      note?: string;
    }): Promise<ExpenseSettlement> {
      const query = `
        INSERT INTO "ExpenseSettlement" ("expenseId", competence, note, "paidAt", "createdAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.expenseId,
        data.competence,
        data.note || null,
      ]);
      return result.rows[0];
    },
  },

  user: {
    async create(data: {
      username: string;
      email: string;
      passwordHash: string;
    }): Promise<User> {
      const query = `
        INSERT INTO "User" (username, email, "passwordHash", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.username,
        data.email,
        data.passwordHash,
      ]);
      return result.rows[0];
    },

    async findFirst(options: {
      where: { username?: string; email?: string };
    }): Promise<User | null> {
      let query = `SELECT * FROM "User" WHERE `;
      const params: any[] = [];

      if (options.where.username) {
        params.push(options.where.username);
        query += `username = $${params.length}`;
      } else if (options.where.email) {
        params.push(options.where.email);
        query += `email = $${params.length}`;
      }

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    },

    async findByIdOrThrow(id: number): Promise<User> {
      const query = `SELECT * FROM "User" WHERE id = $1`;
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error(`No User found with id ${id}`);
      }
      return result.rows[0];
    },
  },

  session: {
    async create(data: {
      token: string;
      userId: number;
      expiresAt: Date;
    }): Promise<Session> {
      const query = `
        INSERT INTO "Session" (token, "userId", "expiresAt", "createdAt")
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        data.token,
        data.userId,
        data.expiresAt,
      ]);
      return result.rows[0];
    },

    async findByToken(token: string): Promise<Session | null> {
      const query = `SELECT * FROM "Session" WHERE token = $1 AND "expiresAt" > NOW()`;
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    },

    async deleteMany(options: {
      where: { token: string };
    }): Promise<void> {
      const query = `DELETE FROM "Session" WHERE token = $1`;
      await pool.query(query, [options.where.token]);
    },
  },

  // Transaction helper
  async transaction<T>(
    callback: (db: any) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(db);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
