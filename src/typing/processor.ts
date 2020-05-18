import { ProcessorData } from './processor-data';

export type Processor<
  Input extends ProcessorData = ProcessorData,
  Output extends ProcessorData = ProcessorData
> = (data: Input, workerData: any, imporWrapper: Record<string, any>) => Promise<Output>;
