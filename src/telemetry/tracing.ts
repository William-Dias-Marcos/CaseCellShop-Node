import { trace, SpanStatusCode } from "@opentelemetry/api";

export const tracer = trace.getTracer("casecellshop-tracer");

export const runWithSpan = async <T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> => {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    } finally {
      span.end();
    }
  });
};

export const runWithSpanSync = <T>(name: string, fn: () => T): T => {
  return tracer.startActiveSpan(name, (span) => {
    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    } finally {
      span.end();
    }
  });
};
