import { Job, JobOptions } from "bull";
import {
  BrowserContextService,
  BrowserContextWithInstance,
} from "./BrowserContextService";
import { ContactsQueueService } from "./ContactsQueueService";
import { ContactsJobData, CreateFetchContactsJobRequest } from "../types";
import PuppeteerWhatsappContactsService from "./PuppeteerWhatsappContactsService";
import FetchContactsJob from "../models/FetchContactsJob";
import FetchContactsJobStatus from "../models/FetchContactsJobStatus";
import Logger from "../utils/logger";
import { ApiResponse } from "../types";
import BrowserContextStatus from "../models/BrowserContextStatus";
import { number } from "joi";
import FetchContactsJobService from "./FetchContactsJobService";

export class WhatsAppContactsFetcherService {
  private static instance: WhatsAppContactsFetcherService;
  private browserContextService: BrowserContextService;
  private contactsQueueService: ContactsQueueService;
  private fetchContactsJobService: FetchContactsJobService;
  private puppeteerWhatsAppContactsService: PuppeteerWhatsappContactsService;
  private logger: typeof Logger;
  private isProcessing: boolean = false;

  private constructor() {
    this.browserContextService = BrowserContextService.getInstance();
    this.contactsQueueService = ContactsQueueService.getInstance();
    this.fetchContactsJobService = FetchContactsJobService.getInstance();
    this.puppeteerWhatsAppContactsService =
      new PuppeteerWhatsappContactsService();
    this.logger = Logger;
    this.setupWorkers();
    this.browserContextService.createBrowserContext(); // ====== ELIMINAR ESTA LINEA, CUANDO EXISTAN SESIONES DE WHATSAPP ====== //
  }

  public static getInstance(): WhatsAppContactsFetcherService {
    if (!WhatsAppContactsFetcherService.instance) {
      WhatsAppContactsFetcherService.instance =
        new WhatsAppContactsFetcherService();
    }
    return WhatsAppContactsFetcherService.instance;
  }

  /**
   * Configura los workers para procesar los jobs de las colas
   */
  private setupWorkers(): void {
    // Worker para jobs de extracción de contactos
    this.contactsQueueService
      .getFetchContactsQueue()
      .process(10, async (job: Job<ContactsJobData>) => {
        return await this.processFetchContactsJob(job);
      });

    this.logger.info("WhatsApp contact fetcher worker initialized");
  }

  /**
   * Inicia un job de extracción de contactos para una sesión
   */
  public async fetchContacts(
    browser_context_id: number,
    whatsapp_session_id: number,
    delay?: number,
    priority?: number
  ): Promise<ApiResponse<Job<ContactsJobData>>> {
    try {
      // Verificar que el contexto exista
      const browserContext =
        await this.browserContextService.getBrowserContextById(
          browser_context_id
        );
      if (!browserContext) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} not found or not active`,
          error: "Context not found",
        };
      }

      // Verificar que el contexto esté disponible
      const availableStatus = await this.getStatusIdBySlug("available");
      if (browserContext.browser_context_status_id !== availableStatus) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} is not available`,
          error: "Context not available",
        };
      }

      const jobDataCreateJob: CreateFetchContactsJobRequest = {
        whatsapp_session_id,
        browser_context_id,
        log: {
          type: "fetch_contacts",
          browser_context_id,
          created_at: new Date().toISOString(),
        },
      };

      const jobRecordResponse = await this.fetchContactsJobService.createJob(
        jobDataCreateJob
      );

      if (!jobRecordResponse.success || !jobRecordResponse.data) {
        throw new Error("Failed to create fetch contacts job record");
      }

      const fetchContactsJob = jobRecordResponse.data;

      const jobData: ContactsJobData = {
        browser_context_id,
        fetch_contacts_job_id: fetchContactsJob.id,
      };

      const jobOptions: JobOptions = {
        delay: delay,
        priority: priority,
      };

      const job = await this.contactsQueueService.addContactJob(
        jobData,
        jobOptions
      );

      this.logger.info("Fetch contact job created", {
        jobId: job.id,
        fetchContactsJobId: fetchContactsJob.id,
        browser_context_id,
      });

      return {
        success: true,
        message: "Fetch contacts job queued successfully",
        data: job,
      };
    } catch (error: any) {
      this.logger.error("Error fetching contacts", error);
      return {
        success: false,
        message: "Error fetching contacts",
        error: error.message,
      };
    }
  }
  /**
   * Procesa un job de extraccion de contactos
   */
  private async processFetchContactsJob(
    job: Job<ContactsJobData>
  ): Promise<any> {
    try {
      this.logger.info("Processing fetch contacts job", {
        jobId: job.id,
        browser_context_id: job.data.browser_context_id,
      });

      // Obtener el contexto del navegador con la instancia de Puppeteer
      const browserContext =
        await this.browserContextService.getBrowserContextById(
          job.data.browser_context_id
        );

      if (!browserContext) {
        throw new Error(
          `Browser context ${job.data.browser_context_id} not found`
        );
      }

      // Cambiar estado del contexto a 'busy'
      await this.browserContextService.updateBrowserStatus(
        job.data.browser_context_id,
        "busy"
      );

      // Actualizar estado del job en la BD
      if (job.data.fetch_contacts_job_id) {
        const runningStatus = await FetchContactsJobStatus.findOne({
          where: { slug: "running" },
        });
        if (runningStatus) {
          await FetchContactsJob.update(
            {
              fetch_contacts_jobs_status_id: runningStatus.id,
              log: {
                // ...job.data.metadata,
                status: "processing",
                started_at: new Date().toISOString(),
              },
            },
            { where: { id: job.data.fetch_contacts_job_id } }
          );
        }
      }
      const result = await this.puppeteerWhatsAppContactsService.fetchContacts(
        browserContext
      );

      // Actualizar estado del job en la BD a completado
      if (job.data.fetch_contacts_job_id) {
        const completedStatus = await FetchContactsJobStatus.findOne({
          where: { slug: "completed" },
        });
        if (completedStatus) {
          await FetchContactsJob.update(
            {
              fetch_contacts_jobs_status_id: completedStatus.id,
              log: {
                // ...job.data.metadata,
                status: "completed",
                completed_at: new Date().toISOString(),
                result,
              },
            },
            { where: { id: job.data.fetch_contacts_job_id } }
          );
        }
      }

      // Cambiar estado del contexto de vuelta a 'available'
      await this.browserContextService.updateBrowserStatus(
        job.data.browser_context_id,
        "available"
      );

      this.logger.info("Fetch contacts job processed successfully", {
        jobId: job.id,
        total_contacts: result.total_contacts,
      });

      return result;
    } catch (error: any) {
      this.logger.error("Error processing fetch contacts job", error);

      // Cambiar estado del contexto a 'available' incluso en error
      await this.browserContextService.updateBrowserStatus(
        job.data.browser_context_id,
        "available"
      );

      // Actualizar estado del job a fallido
      if (job.data.fetch_contacts_job_id) {
        const failedStatus = await FetchContactsJobStatus.findOne({
          where: { slug: "failed" },
        });
        if (failedStatus) {
          await FetchContactsJob.update(
            {
              fetch_contacts_jobs_status_id: failedStatus.id,
              log: {
                // ...job.data.metadata,
                status: "failed",
                error: error.message,
                failed_at: new Date().toISOString(),
              },
            },
            { where: { id: job.data.fetch_contacts_job_id } }
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
   * Obtiene estadísticas del servicio
   */
  public async getStats(): Promise<any> {
    const queueStats = await this.contactsQueueService.getQueueStats();
    const browserStats = this.browserContextService.getStats();

    return {
      queues: queueStats,
      browser: browserStats,
      isProcessing: this.isProcessing,
    };
  }
}

export default WhatsAppContactsFetcherService;
