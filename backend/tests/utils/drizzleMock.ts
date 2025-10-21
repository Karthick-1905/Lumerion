import { jest } from "@jest/globals";

type QueryOp<T = unknown> = {
  resolved?: T;
  returning?: T;
};

type PromiseLikeResult<T> = {
  then: Promise<T>["then"];
  catch: Promise<T>["catch"];
  finally: Promise<T>["finally"];
};

function createPromiseLike<T>(value: T): PromiseLikeResult<T> {
  const promise = Promise.resolve(value);
  return {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };
}

function createSelectBuilder<T>(value: T) {
  const builder: any = {
    from: jest.fn(() => builder),
    innerJoin: jest.fn(() => builder),
    leftJoin: jest.fn(() => builder),
    where: jest.fn(() => builder),
    orderBy: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    offset: jest.fn(() => builder),
    groupBy: jest.fn(() => builder),
    having: jest.fn(() => builder),
    distinct: jest.fn(() => builder),
    ...createPromiseLike(value),
  };
  return builder;
}

function createInsertBuilder<T>(op: QueryOp<T>) {
  const builder: any = {
    values: jest.fn(() => builder),
    returning: jest.fn(() => createPromiseLike(op.returning ?? [])),
    onConflictDoNothing: jest.fn(() => builder),
    ...createPromiseLike(op.resolved ?? []),
  };
  return builder;
}

function createUpdateBuilder<T>(op: QueryOp<T>) {
  const builder: any = {
    set: jest.fn(() => builder),
    where: jest.fn(() => builder),
    returning: jest.fn(() => createPromiseLike(op.returning ?? [])),
    ...createPromiseLike(op.resolved ?? []),
  };
  return builder;
}

function createDeleteBuilder<T>(op: QueryOp<T>) {
  const builder: any = {
    where: jest.fn(() => createPromiseLike(op.resolved ?? [])),
    ...createPromiseLike(op.resolved ?? []),
  };
  return builder;
}

type QueueEntry<T = unknown> = QueryOp<T> | T;

class OperationQueue<T = unknown> {
  private queue: QueueEntry<T>[] = [];

  enqueue(value: QueueEntry<T>) {
    this.queue.push(value);
  }

  dequeue(defaultValue: QueueEntry<T>): QueueEntry<T> {
    return this.queue.length > 0 ? this.queue.shift()! : defaultValue;
  }

  clear() {
    this.queue = [];
  }
}

const selectQueue = new OperationQueue<any>();
const insertQueue = new OperationQueue<QueryOp<any>>();
const updateQueue = new OperationQueue<QueryOp<any>>();
const deleteQueue = new OperationQueue<QueryOp<any>>();

const defaultTransaction = async <T>(callback: (tx: any) => Promise<T> | T) => {
  const tx = {
    select: mockDb.select,
    insert: mockDb.insert,
    update: mockDb.update,
    delete: mockDb.delete,
    query: mockDb.query,
  };
  return callback(tx);
};

export const mockDb: any = {
  query: {
    users: {
      findFirst: jest.fn(),
    },
    userEmailVerification: {
      findFirst: jest.fn(),
    },
    passwordResetTokens: {
      findFirst: jest.fn(),
    },
    learningPath: {
      findFirst: jest.fn(),
    },
    friendRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userFriend: {
      findFirst: jest.fn(),
    },
    studyGroup: {
      findFirst: jest.fn(),
    },
    studyGroupMembership: {
      findFirst: jest.fn(),
    },
  },
  select: jest.fn(() => createSelectBuilder([])),
  insert: jest.fn(() => createInsertBuilder({ resolved: [] })),
  update: jest.fn(() => createUpdateBuilder({ resolved: [] })),
  delete: jest.fn(() => createDeleteBuilder({ resolved: [] })),
  transaction: jest.fn(defaultTransaction),
};

export function resetDbMocks() {
  selectQueue.clear();
  insertQueue.clear();
  updateQueue.clear();
  deleteQueue.clear();

  mockDb.select.mockReset();
  mockDb.insert.mockReset();
  mockDb.update.mockReset();
  mockDb.delete.mockReset();
  mockDb.transaction.mockReset();

  mockDb.select.mockImplementation(() => createSelectBuilder([]));
  mockDb.insert.mockImplementation(() => createInsertBuilder({ resolved: [] }));
  mockDb.update.mockImplementation(() => createUpdateBuilder({ resolved: [] }));
  mockDb.delete.mockImplementation(() => createDeleteBuilder({ resolved: [] }));
  mockDb.transaction.mockImplementation(defaultTransaction);

  Object.values(mockDb.query).forEach((table) => {
    Object.values(table).forEach((fn) => fn.mockReset());
  });
}

export function setTransactionImplementation(
  implementation: (callback: (tx: any) => any) => any,
) {
  mockDb.transaction.mockImplementation(async (callback: (tx: any) => any) =>
    implementation(callback),
  );
}

export function enqueueSelectResult<T>(value: T) {
  selectQueue.enqueue(value);
  mockDb.select.mockImplementation(() => {
    const result = selectQueue.dequeue([]);
    return createSelectBuilder(result);
  });
}

export function enqueueInsertOperation<T>(operation: QueryOp<T>) {
  insertQueue.enqueue(operation);
  mockDb.insert.mockImplementation(() => {
    const op = insertQueue.dequeue({ resolved: [] });
    return createInsertBuilder(op);
  });
}

export function enqueueUpdateOperation<T>(operation: QueryOp<T>) {
  updateQueue.enqueue(operation);
  mockDb.update.mockImplementation(() => {
    const op = updateQueue.dequeue({ resolved: [] });
    return createUpdateBuilder(op);
  });
}

export function enqueueDeleteOperation<T>(operation: QueryOp<T>) {
  deleteQueue.enqueue(operation);
  mockDb.delete.mockImplementation(() => {
    const op = deleteQueue.dequeue({ resolved: [] });
    return createDeleteBuilder(op);
  });
}

resetDbMocks();
