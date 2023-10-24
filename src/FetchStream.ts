import fetch, { RequestInit, Response } from "node-fetch";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { window } from "vscode";

export interface FetchStreamOptions {
  url: string;
  requestInit: RequestInit;
  onmessage: (data: string) => void;
  ondone?: () => void;
  onerror?: (response: Response) => void;
}

export class FetchStream {
  url: string;
  requestInit: RequestInit;
  onmessage: FetchStreamOptions["onmessage"];
  ondone: FetchStreamOptions["ondone"];
  onerror: FetchStreamOptions["onerror"];

  constructor(options: FetchStreamOptions) {
    this.url = options.url;
    this.requestInit = options.requestInit;
    this.onmessage = options.onmessage;
    this.ondone = options.ondone;
    this.onerror = options.onerror;
    this.createFetchRequest();
  }

  createFetchRequest() {
    const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        this.onmessage(event.data);
      }
    });
    console.warn("start");
    console.warn("url", this.url);
    console.warn("requestInit", this.requestInit);

    fetch(this.url, this.requestInit)
      .then((response) => {
        console.warn({ response });
        console.warn("body", response.body);
        return response.body;
        if (response.status === 200) {
          return response.body!;
        } else {
          return Promise.reject(response);
        }
      })
      .then(async (readableStream) => {
        console.warn(readableStream);
        if (!readableStream) {
          console.warn("readableStream 为 null");
          return Promise.reject(readableStream);
        }
        for await (const chunk of readableStream) {
          console.warn({ chunk });
          parser.feed(chunk.toString());
        }
      })
      .then(() => {
        this.ondone?.();
      })
      .catch((error) => {
        console.warn("报错了");
        console.error(error);
        window.showErrorMessage(`${error}`);
        window.setStatusBarMessage(`${error}`, 10000);
        this.onerror?.(error);
      });
  }
}
