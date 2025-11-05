import { Queue, Worker, JobsOptions, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@cerberix/config';
import { DeliveryJob, DeliveryQueue } from './types';

const connection = new IORedis(config.REDIS_URL);

export class BullDeliveryQueue implements DeliveryQueue {
  private queue: Queue<DeliveryJob>;
  private events: QueueEvents;

  constructor(name = 'deliveries') {
    this.queue = new Queue<DeliveryJob>(name, { connection });
    this.events = new QueueEvents(name, { connection });
  }

  async add(job: DeliveryJob): Promise<void> {
    await this.queue.add('deliver', job);
  }

  async addDelayed(job: DeliveryJob, delayMs: number): Promise<void> {
    const opts: JobsOptions = { delay: delayMs, removeOnComplete: true, removeOnFail: true };
    await this.queue.add('deliver', job, opts);
  }

  process(handler: (job: DeliveryJob) => Promise<void>): void {
    const worker = new Worker<DeliveryJob>(this.queue.name, async (job) => handler(job.data), {
      connection
    });
    void worker;
    void this.events;
  }
}

export function createDeliveryQueue(): DeliveryQueue {
  return new BullDeliveryQueue('deliveries');
}


