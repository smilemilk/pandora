import * as os from 'os';
import * as address from 'address';
import { CustomReporter } from './CustomReporter';
import { DefaultLoggerManager } from 'pandora-service-logger';

export class TraceReporter extends CustomReporter {

  host = os.hostname();
  ip = address.ip();
  vernier = {};
  logger;

  constructor(actuatorManager, options?) {
    super(actuatorManager, options);

    this.initFileAppender();
  }

  initFileAppender() {
    this.logger = DefaultLoggerManager.getInstance().createLogger('traces', {
      type: 'size',
      maxFiles: 200 * 1024 * 1024,
      dir: DefaultLoggerManager.getPandoraLogsDir(),
      stdoutLevel: 'NONE',
      level: 'ALL'
    });
  }

  async collectTraces(): Promise<any> {
    const infoEndPoint = this.endPointService.getEndPoint('info');
    const info = await infoEndPoint.invoke();
    const traceEndPoint = this.endPointService.getEndPoint('trace');
    const appNames = info.reduce((result, item) => {
      if (item.key === 'application' && item.scope === 'APP') {
        result.push(item.data.appName);
      }
      return result;
    }, []);

    const traces = await Promise.all(appNames.map(async (appName) => {
      try {
        const data = await traceEndPoint.invoke(appName, {
          value: this.vernier[appName] || 0,
          order: 'DESC',
          by: 'time'
        });

        if (data && data.length > 0) {
          this.vernier[appName] = data[0].date + 1000;
        }

        return data || [];
      } catch(err) {
        console.error(`[TraceReporter] collect [${appName}] traces failed. `, err);

        return [];
      }
    }));

    return traces.reduce((result: object[], trace) => {
      return result.concat(trace);
    }, []);
  }

  async report() {
    const traces = await this.collectTraces();

    try {
      traces.forEach((trace) => {
        trace.ip = this.ip;
        trace.hostname = this.host;
        this.logger.write(JSON.stringify(trace));
      });
    } catch(err) {
      console.error('[TraceReporter] write trace data failed. ', err);
    }
  }
}