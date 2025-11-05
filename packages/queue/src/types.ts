export interface DeliveryJob {
  deliveryId: string;
}

export interface DeliveryQueue {
  add(job: DeliveryJob): Promise<void>;
  addDelayed(job: DeliveryJob, delayMs: number): Promise<void>;
  process(handler: (job: DeliveryJob) => Promise<void>): void;
}


