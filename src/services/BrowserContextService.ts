import puppeteer, { Browser, BrowserContext as PuppeteerContext, Page } from 'puppeteer';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import BrowserContext from '../models/BrowserContext';
import BrowserContextStatus from '../models/BrowserContextStatus';
import { ApiResponse } from '../types';

export interface BrowserContextWithInstance {
  id: number;
  browser_context_status_id: number;
  browser_system_id: string;
  created_at: Date;
  updated_at: Date;
  system_instance: PuppeteerContext;
  page?: Page;
}

export class BrowserContextService {
  private static instance: BrowserContextService;
  private browser: Browser | null = null;
  private contextList: Map<number, BrowserContextWithInstance> = new Map();
  private configService: ConfigService;
  private logger: typeof Logger;
  private isInitialized: boolean = false;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): BrowserContextService {
    if (!BrowserContextService.instance) {
      BrowserContextService.instance = new BrowserContextService();
    }
    return BrowserContextService.instance;
  }

  /**
   * Inicializa el navegador Puppeteer
   */
  public async initializeBrowser(): Promise<void> {
    if (this.isInitialized && this.browser) {
      this.logger.info('Browser already initialized');
      return;
    }

    try {
      const puppeteerConfig = this.configService.getPuppeteerConfig();

      this.logger.info('Initializing Puppeteer browser', {
        headless: puppeteerConfig.headless,
      });

      this.browser = await puppeteer.launch({
        headless: puppeteerConfig.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        defaultViewport: {
          width: 1366,
          height: 768,
        },
      });

      this.isInitialized = true;
      this.logger.info('Puppeteer browser initialized successfully');

      // Cargar contextos existentes de la base de datos
      await this.loadExistingContexts();
    } catch (error) {
      this.logger.error('Error initializing Puppeteer browser', error);
      throw error;
    }
  }

  /**
   * Carga los contextos existentes de la base de datos al iniciar
   */
  private async loadExistingContexts(): Promise<void> {
    try {
      const existingContexts = await BrowserContext.findAll({
        include: [
          {
            model: BrowserContextStatus,
            as: 'BrowserContextStatus',
          },
        ],
      });

      this.logger.info(`Loading ${existingContexts.length} existing browser contexts`);

      for (const context of existingContexts) {
        if (context.browser_system_id) {
          // Aquí podríamos recrear los contextos si es necesario
          // Por ahora solo los registramos como desconectados
          await this.updateBrowserStatus(context.id, 'disconnected');
        }
      }
    } catch (error) {
      this.logger.error('Error loading existing contexts', error);
    }
  }

  /**
   * Crea un nuevo contexto de navegador en Puppeteer y lo guarda en la BD
   */
  public async createBrowserContext(): Promise<ApiResponse<BrowserContextWithInstance>> {
    try {
      if (!this.browser) {
        throw new Error('Browser not initialized. Call initializeBrowser() first.');
      }

      // Crear contexto en Puppeteer
      const puppeteerContext = await this.browser.createBrowserContext();
      const browserSystemId = puppeteerContext.id;

      if (!browserSystemId) {
        throw new Error('Failed to get browser context ID from Puppeteer');
      }

      this.logger.info('Puppeteer context created', { browserSystemId });

      // Obtener el status_id para 'available'
      const availableStatus = await BrowserContextStatus.findOne({
        where: { slug: 'available' },
      });

      if (!availableStatus) {
        throw new Error('Available status not found in database');
      }

      // Guardar en la base de datos
      const dbContext = await BrowserContext.create({
        browser_context_status_id: availableStatus.id,
        browser_system_id: browserSystemId,
      });

      // Crear página inicial en el contexto
      const page = await puppeteerContext.newPage();
      const puppeteerConfig = this.configService.getPuppeteerConfig();

      // Configurar timeouts
      page.setDefaultTimeout(puppeteerConfig.defaultTimeout);
      page.setDefaultNavigationTimeout(puppeteerConfig.navigationTimeout);

      // Navegar a WhatsApp Web
      await page.goto(puppeteerConfig.whatsappUrl, {
        waitUntil: 'networkidle2',
      });

      // Crear objeto con instancia del sistema
      const contextWithInstance: BrowserContextWithInstance = {
        id: dbContext.id,
        browser_context_status_id: dbContext.browser_context_status_id,
        browser_system_id: dbContext.browser_system_id!,
        created_at: dbContext.created_at!,
        updated_at: dbContext.updated_at!,
        system_instance: puppeteerContext,
        page: page,
      };

      // Agregar a la lista interna
      this.contextList.set(dbContext.id, contextWithInstance);

      this.logger.info('Browser context created successfully', {
        id: dbContext.id,
        browser_system_id: browserSystemId,
      });

      return {
        success: true,
        message: 'Browser context created successfully',
        data: contextWithInstance,
      };
    } catch (error: any) {
      this.logger.error('Error creating browser context', error);
      return {
        success: false,
        message: 'Error creating browser context',
        error: error.message,
      };
    }
  }

  /**
   * Obtiene un contexto por su ID de base de datos
   */
  public async getBrowserContextById(id: number): Promise<BrowserContextWithInstance | null> {
    try {
      // Primero buscar en la lista interna
      if (this.contextList.has(id)) {
        return this.contextList.get(id)!;
      }

      // Si no está en memoria, buscar en BD
      const dbContext = await BrowserContext.findByPk(id);
      if (!dbContext) {
        return null;
      }

      // Si existe en BD pero no en memoria, podría haber sido reiniciado
      this.logger.warn(`Context ${id} found in database but not in memory`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting browser context by id ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtiene un contexto por su browser_system_id de Puppeteer
   */
  public async getBrowserContextBySystemId(
    browserSystemId: string
  ): Promise<BrowserContextWithInstance | null> {
    try {
      // Buscar en la lista interna
      for (const [, context] of this.contextList) {
        if (context.browser_system_id === browserSystemId) {
          return context;
        }
      }

      // Si no está en memoria, buscar en BD
      const dbContext = await BrowserContext.findOne({
        where: { browser_system_id: browserSystemId },
      });

      if (!dbContext) {
        return null;
      }

      this.logger.warn(`Context with system_id ${browserSystemId} found in database but not in memory`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting browser context by system id ${browserSystemId}`, error);
      throw error;
    }
  }

  /**
   * Cambia el estado de un contexto en BD y en la lista interna
   */
  public async updateBrowserStatus(id: number, statusSlug: string): Promise<ApiResponse<void>> {
    try {
      // Obtener el status_id por slug
      const status = await BrowserContextStatus.findOne({
        where: { slug: statusSlug },
      });

      if (!status) {
        return {
          success: false,
          message: `Status '${statusSlug}' not found`,
          error: 'Status not found',
        };
      }

      // Actualizar en base de datos
      const dbContext = await BrowserContext.findByPk(id);
      if (!dbContext) {
        return {
          success: false,
          message: `Browser context ${id} not found`,
          error: 'Context not found',
        };
      }

      dbContext.browser_context_status_id = status.id;
      await dbContext.save();

      // Actualizar en lista interna si existe
      if (this.contextList.has(id)) {
        const contextWithInstance = this.contextList.get(id)!;
        contextWithInstance.browser_context_status_id = status.id;
        this.contextList.set(id, contextWithInstance);
      }

      this.logger.info(`Browser context ${id} status updated to ${statusSlug}`);

      return {
        success: true,
        message: 'Browser status updated successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error updating browser status for context ${id}`, error);
      return {
        success: false,
        message: 'Error updating browser status',
        error: error.message,
      };
    }
  }

  /**
   * Obtiene todos los contextos activos
   */
  public getAllActiveContexts(): BrowserContextWithInstance[] {
    return Array.from(this.contextList.values());
  }

  /**
   * Obtiene el número de contextos activos
   */
  public getActiveContextCount(): number {
    return this.contextList.size;
  }

  /**
   * Cierra un contexto específico
   */
  public async closeBrowserContext(id: number): Promise<ApiResponse<void>> {
    try {
      const context = this.contextList.get(id);
      if (!context) {
        return {
          success: false,
          message: `Browser context ${id} not found in active contexts`,
          error: 'Context not found',
        };
      }

      // Cerrar todas las páginas del contexto
      const pages = await context.system_instance.pages();
      for (const page of pages) {
        await page.close();
      }

      // Cerrar el contexto
      await context.system_instance.close();

      // Remover de la lista interna
      this.contextList.delete(id);

      // Actualizar estado en BD
      await this.updateBrowserStatus(id, 'closed');

      this.logger.info(`Browser context ${id} closed successfully`);

      return {
        success: true,
        message: 'Browser context closed successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error closing browser context ${id}`, error);
      return {
        success: false,
        message: 'Error closing browser context',
        error: error.message,
      };
    }
  }

  /**
   * Cierra todos los contextos y el navegador
   */
  public async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down browser service');

      // Cerrar todos los contextos activos
      const contextIds = Array.from(this.contextList.keys());
      for (const id of contextIds) {
        await this.closeBrowserContext(id);
      }

      // Cerrar el navegador
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isInitialized = false;
      this.logger.info('Browser service shutdown completed');
    } catch (error) {
      this.logger.error('Error during browser service shutdown', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public getStats(): {
    isInitialized: boolean;
    activeContexts: number;
    contexts: Array<{
      id: number;
      browser_system_id: string;
      status_id: number;
      hasPage: boolean;
    }>;
  } {
    const contexts = Array.from(this.contextList.values()).map((ctx) => ({
      id: ctx.id,
      browser_system_id: ctx.browser_system_id,
      status_id: ctx.browser_context_status_id,
      hasPage: !!ctx.page,
    }));

    return {
      isInitialized: this.isInitialized,
      activeContexts: this.contextList.size,
      contexts,
    };
  }

  /**
   * Verifica si el navegador está inicializado
   */
  public isReady(): boolean {
    return this.isInitialized && this.browser !== null;
  }
}

export default BrowserContextService;

