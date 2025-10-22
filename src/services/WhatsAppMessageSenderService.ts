import { Job } from 'bull';
import { BrowserContextService, BrowserContextWithInstance } from './BrowserContextService';
import { MessageQueueService, MessageJobData, BulkMessageJobData } from './MessageQueueService';
import SendMessageJob from '../models/SendMessageJob';
import SendMessageJobStatus from '../models/SendMessageJobStatus';
import Message from '../models/Message';
import MessageStatus from '../models/MessageStatus';
import Logger from '../utils/logger';
import { ApiResponse } from '../types';
import BrowserContextStatus from '../models/BrowserContextStatus';

export class WhatsAppMessageSenderService {
  private static instance: WhatsAppMessageSenderService;
  private browserContextService: BrowserContextService;
  private messageQueueService: MessageQueueService;
  private logger: typeof Logger;
  private isProcessing: boolean = false;

  private constructor() {
    this.browserContextService = BrowserContextService.getInstance();
    this.messageQueueService = MessageQueueService.getInstance();
    this.logger = Logger;
    this.setupWorkers();
  }

  public static getInstance(): WhatsAppMessageSenderService {
    if (!WhatsAppMessageSenderService.instance) {
      WhatsAppMessageSenderService.instance = new WhatsAppMessageSenderService();
    }
    return WhatsAppMessageSenderService.instance;
  }

  /**
   * Configura los workers para procesar los jobs de las colas
   */
  private setupWorkers(): void {
    // Worker para mensajes individuales
    this.messageQueueService.getMessageQueue().process(10, async (job: Job<MessageJobData>) => {
      return await this.processMessageJob(job);
    });

    // Worker para mensajes masivos
    this.messageQueueService.getBulkMessageQueue().process(5, async (job: Job<BulkMessageJobData>) => {
      return await this.processBulkMessageJob(job);
    });

    this.logger.info('WhatsApp message workers initialized');
  }

  /**
   * Envía un mensaje individual
   */
  public async sendMessage(
    browser_context_id: number,
    to: string,
    message: string,
    metadata?: any
  ): Promise<ApiResponse<Job<MessageJobData>>> {
    try {
      // Verificar que el contexto exista
      const browserContext = await this.browserContextService.getBrowserContextById(browser_context_id);
      if (!browserContext) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} not found or not active`,
          error: 'Context not found',
        };
      }

      // Verificar que el contexto esté disponible
      const availableStatus = await this.getStatusIdBySlug('available');
      if (browserContext.browser_context_status_id !== availableStatus) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} is not available`,
          error: 'Context not available',
        };
      }

      // Crear registro en send_messages_jobs
      const pendingStatus = await SendMessageJobStatus.findOne({ where: { slug: 'pending' } });
      if (!pendingStatus) {
        throw new Error('Pending status not found');
      }

      const sendMessageJob = await SendMessageJob.create({
        send_messages_jobs_status_id: pendingStatus.id,
        log: {
          type: 'single_message',
          to,
          message,
          browser_context_id,
          created_at: new Date().toISOString(),
        },
      });

      // Agregar job a la cola
      const jobData: MessageJobData = {
        browser_context_id,
        to,
        message,
        send_message_job_id: sendMessageJob.id,
        metadata,
      };

      const job = await this.messageQueueService.addMessageJob(jobData);

      this.logger.info('Message job created', {
        jobId: job.id,
        sendMessageJobId: sendMessageJob.id,
        to,
        browser_context_id,
      });

      return {
        success: true,
        message: 'Message job queued successfully',
        data: job,
      };
    } catch (error: any) {
      this.logger.error('Error sending message', error);
      return {
        success: false,
        message: 'Error sending message',
        error: error.message,
      };
    }
  }

  /**
   * Envía mensajes masivos
   */
  public async sendBulkMessages(
    browser_context_id: number,
    messages: Array<{ to: string; message: string }>,
    delay: number = 2000
  ): Promise<ApiResponse<Job<BulkMessageJobData>>> {
    try {
      // Verificar que el contexto exista
      const browserContext = await this.browserContextService.getBrowserContextById(browser_context_id);
      if (!browserContext) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} not found or not active`,
          error: 'Context not found',
        };
      }

      // Crear registro en send_messages_jobs
      const pendingStatus = await SendMessageJobStatus.findOne({ where: { slug: 'pending' } });
      if (!pendingStatus) {
        throw new Error('Pending status not found');
      }

      const sendMessageJob = await SendMessageJob.create({
        send_messages_jobs_status_id: pendingStatus.id,
        log: {
          type: 'bulk_message',
          messageCount: messages.length,
          browser_context_id,
          delay,
          created_at: new Date().toISOString(),
        },
      });

      // Agregar job a la cola
      const jobData: BulkMessageJobData = {
        browser_context_id,
        messages,
        send_message_job_id: sendMessageJob.id,
        delay,
      };

      const job = await this.messageQueueService.addBulkMessageJob(jobData);

      this.logger.info('Bulk message job created', {
        jobId: job.id,
        sendMessageJobId: sendMessageJob.id,
        messageCount: messages.length,
        browser_context_id,
      });

      return {
        success: true,
        message: 'Bulk message job queued successfully',
        data: job,
      };
    } catch (error: any) {
      this.logger.error('Error sending bulk messages', error);
      return {
        success: false,
        message: 'Error sending bulk messages',
        error: error.message,
      };
    }
  }

  /**
   * Procesa un job de mensaje individual
   * NOTA: La lógica de Puppeteer para enviar el mensaje será implementada por otro desarrollador
   */
  private async processMessageJob(job: Job<MessageJobData>): Promise<any> {
    try {
      this.logger.info('Processing message job', {
        jobId: job.id,
        to: job.data.to,
        browser_context_id: job.data.browser_context_id,
      });

      // Obtener el contexto del navegador con la instancia de Puppeteer
      const browserContext = await this.browserContextService.getBrowserContextById(
        job.data.browser_context_id
      );

      if (!browserContext) {
        throw new Error(`Browser context ${job.data.browser_context_id} not found`);
      }

      // Cambiar estado del contexto a 'busy'
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'busy');

      // Actualizar estado del job en la BD
      if (job.data.send_message_job_id) {
        const runningStatus = await SendMessageJobStatus.findOne({ where: { slug: 'running' } });
        if (runningStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: runningStatus.id,
              log: {
                ...job.data.metadata,
                status: 'processing',
                started_at: new Date().toISOString(),
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      // ========================================
      // AQUÍ VA LA LÓGICA DE PUPPETEER
      // El equipo encargado implementará:
      // 1. Usar browserContext.system_instance para acceder al contexto de Puppeteer
      // 2. Usar browserContext.page para interactuar con la página de WhatsApp
      // 3. Enviar el mensaje usando selectores de WhatsApp Web
      // 4. Retornar el resultado del envío
      // ========================================

      this.logger.warn('Puppeteer logic not implemented yet - job marked as placeholder');

      // Placeholder para el resultado
      const result = {
        success: true,
        message_id: `placeholder_${Date.now()}`,
        sent_at: new Date().toISOString(),
        // Aquí irán los datos reales del envío
      };

      // Guardar mensaje en la BD
      const sentStatus = await MessageStatus.findOne({ where: { slug: 'sent' } });
      if (sentStatus && job.data.send_message_job_id) {
        await Message.create({
          remote_jid: job.data.to,
          whatsapp_session_id: 1, // TODO: Vincular con la sesión correcta
          message_session_status_id: sentStatus.id,
          sent_at: new Date(),
          key: {},
          message: { text: job.data.message },
          result,
        });
      }

      // Actualizar estado del job en la BD a completado
      if (job.data.send_message_job_id) {
        const completedStatus = await SendMessageJobStatus.findOne({ where: { slug: 'completed' } });
        if (completedStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: completedStatus.id,
              log: {
                ...job.data.metadata,
                status: 'completed',
                completed_at: new Date().toISOString(),
                result,
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      // Cambiar estado del contexto de vuelta a 'available'
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'available');

      this.logger.info('Message job processed successfully', {
        jobId: job.id,
        to: job.data.to,
      });

      return result;
    } catch (error: any) {
      this.logger.error('Error processing message job', error);

      // Cambiar estado del contexto a 'available' incluso en error
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'available');

      // Actualizar estado del job a fallido
      if (job.data.send_message_job_id) {
        const failedStatus = await SendMessageJobStatus.findOne({ where: { slug: 'failed' } });
        if (failedStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: failedStatus.id,
              log: {
                ...job.data.metadata,
                status: 'failed',
                error: error.message,
                failed_at: new Date().toISOString(),
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      throw error;
    }
  }

  /**
   * Procesa un job de mensajes masivos
   * NOTA: La lógica de Puppeteer para enviar los mensajes será implementada por otro desarrollador
   */
  private async processBulkMessageJob(job: Job<BulkMessageJobData>): Promise<any> {
    try {
      this.logger.info('Processing bulk message job', {
        jobId: job.id,
        messageCount: job.data.messages.length,
        browser_context_id: job.data.browser_context_id,
      });

      // Obtener el contexto del navegador
      const browserContext = await this.browserContextService.getBrowserContextById(
        job.data.browser_context_id
      );

      if (!browserContext) {
        throw new Error(`Browser context ${job.data.browser_context_id} not found`);
      }

      // Cambiar estado del contexto a 'busy'
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'busy');

      // Actualizar estado del job en la BD
      if (job.data.send_message_job_id) {
        const runningStatus = await SendMessageJobStatus.findOne({ where: { slug: 'running' } });
        if (runningStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: runningStatus.id,
              log: {
                status: 'processing',
                started_at: new Date().toISOString(),
                total: job.data.messages.length,
                processed: 0,
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      const results = [];
      let processed = 0;

      // Procesar cada mensaje
      for (const msg of job.data.messages) {
        try {
          // ========================================
          // AQUÍ VA LA LÓGICA DE PUPPETEER
          // El otro desarrollador implementará el envío de cada mensaje
          // ========================================

          this.logger.info('Processing message in bulk', {
            to: msg.to,
            index: processed + 1,
            total: job.data.messages.length,
          });

          // Placeholder para el resultado
          const result = {
            success: true,
            to: msg.to,
            message_id: `placeholder_${Date.now()}_${processed}`,
            sent_at: new Date().toISOString(),
          };

          results.push(result);
          processed++;

          // Actualizar progreso
          const progress = Math.round((processed / job.data.messages.length) * 100);
          await job.progress(progress);

          // Esperar el delay configurado antes del siguiente mensaje
          if (processed < job.data.messages.length && job.data.delay) {
            await this.sleep(job.data.delay);
          }
        } catch (error: any) {
          this.logger.error('Error processing message in bulk', {
            to: msg.to,
            error: error.message,
          });

          results.push({
            success: false,
            to: msg.to,
            error: error.message,
          });
          processed++;
        }
      }

      // Actualizar estado del job a completado
      if (job.data.send_message_job_id) {
        const completedStatus = await SendMessageJobStatus.findOne({ where: { slug: 'completed' } });
        if (completedStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: completedStatus.id,
              log: {
                status: 'completed',
                completed_at: new Date().toISOString(),
                total: job.data.messages.length,
                processed,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
                results,
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      // Cambiar estado del contexto de vuelta a 'available'
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'available');

      this.logger.info('Bulk message job processed successfully', {
        jobId: job.id,
        processed,
        total: job.data.messages.length,
      });

      return {
        total: job.data.messages.length,
        processed,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error: any) {
      this.logger.error('Error processing bulk message job', error);

      // Cambiar estado del contexto a 'available' incluso en error
      await this.browserContextService.updateBrowserStatus(job.data.browser_context_id, 'available');

      // Actualizar estado del job a fallido
      if (job.data.send_message_job_id) {
        const failedStatus = await SendMessageJobStatus.findOne({ where: { slug: 'failed' } });
        if (failedStatus) {
          await SendMessageJob.update(
            {
              send_messages_jobs_status_id: failedStatus.id,
              log: {
                status: 'failed',
                error: error.message,
                failed_at: new Date().toISOString(),
              },
            },
            { where: { id: job.data.send_message_job_id } }
          );
        }
      }

      throw error;
    }
  }

  /**
   * Obtiene el ID de un status por su slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await BrowserContextStatus.findOne({ where: { slug } });
    if (!status) {
      throw new Error(`Status ${slug} not found`);
    }
    return status.id;
  }

  /**
   * Función auxiliar para esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public async getStats(): Promise<any> {
    const queueStats = await this.messageQueueService.getQueueStats();
    const browserStats = this.browserContextService.getStats();

    return {
      queues: queueStats,
      browser: browserStats,
      isProcessing: this.isProcessing,
    };
  }
}

export default WhatsAppMessageSenderService;

