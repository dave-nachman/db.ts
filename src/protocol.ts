import * as t from "io-ts";

import { EncodeOptions } from "./codec";

export interface BaseClientMessage {
  kind: string;
  id: string;
}

export interface WriteMessage extends BaseClientMessage {
  kind: "write";
  id: string;
  payload: {
    data: object;
    options?: EncodeOptions;
  };
}

export interface ReadMessage extends BaseClientMessage {
  kind: "read";
  id: string;
  payload: {
    type: t.Type<object>;
    key: string;
    time?: number;
  };
}

export interface ReadAllMessage extends BaseClientMessage {
  kind: "readAll";
  id: string;
  payload: {
    type: t.Type<object>;
    time?: number;
  };
}

export interface AddTypeMessage extends BaseClientMessage {
  kind: "addType";
  id: string;
  payload: {
    type: t.Type<object>;
  };
}

export type ClientMessage =
  | WriteMessage
  | ReadMessage
  | ReadAllMessage
  | AddTypeMessage;

export interface AbstractServerMessage {
  kind: string;
}

export interface AckMessage extends AbstractServerMessage {
  kind: "ack";
  id: string;
  payload: {
    clientMessageId: string;
    value: any;
  };
}

export interface FailureMessage extends AbstractServerMessage {
  kind: "failure";g
  id: string;
  payload: {
    clientMessageId: string;
    value: string;
  };
}


export type ServerMessage = AckMessage | FailureMessage;
