import { jest } from "@jest/globals";

export default class RedisMock {
  on = jest.fn();
  quit = jest.fn(async () => undefined);
  disconnect = jest.fn();
}
