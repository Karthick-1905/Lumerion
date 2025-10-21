import type { Request, Response } from "express";
import { jest } from "@jest/globals";

type MockedResponse = Response & {
  statusCode?: number;
  payload?: unknown;
};

type MockedRequest<TBody = any, TParams = any, TQuery = any> = Request & {
  body: TBody;
  params: TParams;
  query: TQuery;
  cookies: Record<string, string>;
};

export function createMockRequest<TBody = any, TParams = any, TQuery = any>(
  overrides: Partial<MockedRequest<TBody, TParams, TQuery>> = {},
): MockedRequest<TBody, TParams, TQuery> {
  return {
    body: {} as TBody,
    params: {} as TParams,
    query: {} as TQuery,
    headers: {},
    get: jest.fn(),
    cookies: {},
    ...overrides,
  } as MockedRequest<TBody, TParams, TQuery>;
}

export function createMockResponse(): MockedResponse {
  const res = {
    statusCode: 200,
    payload: undefined as unknown,
  } as Partial<MockedResponse>;

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as MockedResponse;
  }) as MockedResponse["status"];

  res.json = jest.fn((payload: unknown) => {
    res.payload = payload;
    return res as MockedResponse;
  }) as MockedResponse["json"];

  res.send = jest.fn((payload?: unknown) => {
    if (payload !== undefined) {
      res.payload = payload;
    }
    return res as MockedResponse;
  }) as MockedResponse["send"];

  res.cookie = jest.fn(() => res as MockedResponse) as MockedResponse["cookie"];
  res.clearCookie = jest.fn(() => res as MockedResponse) as MockedResponse["clearCookie"];

  return res as MockedResponse;
}
