import { BlobService } from 'azure-storage';
import { CallSession, IEvent, IMiddlewareMap } from 'botbuilder-calling';
import { AzureBlobWriter, AzureBlobWriterOptions, BotLoggerOptions, BotLogWriter, BotLogWriterOptions, Callback, DocumentDbWriter, DocumentDbWriterOptions } from 'botbuilder-logging';
import { DocumentClient } from 'documentdb';
import { EventEmitter } from 'events';

export class BotCallLogger implements IMiddlewareMap {
  events = new EventEmitter();
  private writer: BotLogWriter;

  constructor(documentClient: DocumentClient, options: BotLoggerOptions) {
    const documentWriter = new DocumentDbWriter(documentClient, options.documents);
    const blobWriter = options.blobs ? new AzureBlobWriter(options.blobs.blobService, options.blobs.options) : null;
    this.writer = new BotLogWriter(documentWriter, blobWriter, options);
  }

  botbuilder(session: CallSession, next: Callback<void>): void {
    this.writer.enqueue(session, (err) => this.done(err));
    next();
  }

  receive(event: IEvent, next: Callback<void>): void {
    this.writer.enqueue(event, (err) => this.done(err));
    next();
  }

  send(event: IEvent, next: Callback<void>): void {
    this.writer.enqueue(event, (err) => this.done(err));
    next();
  }

  private done(err: Error): void {
    if (err) { this.events.emit('error', err); }
  }
}
