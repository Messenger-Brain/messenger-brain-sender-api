import Logger from "../utils/logger";
import {
  ApiResponse,
  ContactsData,
} from "../types";
import BrowserContextService from "./BrowserContextService";
import BrowserContextStatus from "../models/BrowserContextStatus";
import PuppeteerWhatsappContactsService from "./PuppeteerWhatsappContactsService";

export interface ContactsServiceInterface {
  getContactByPhoneNumber(
    whatsapp_session_id: number,
    browser_context_id: number,
    contact_phone_number: number
  ): Promise<ApiResponse<ContactsData>>;
}

export class ContactsService implements ContactsServiceInterface {
  private static instance: ContactsService;
  private logger: typeof Logger;
  private browserContextService: BrowserContextService;
  private puppeteerWhatsAppContactsService: PuppeteerWhatsappContactsService;

  constructor() {
    this.logger = Logger;
    this.browserContextService = BrowserContextService.getInstance();
    this.puppeteerWhatsAppContactsService =
      new PuppeteerWhatsappContactsService();
  }

  public static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  public async getContactByPhoneNumber(
    browser_context_id: number,
    contact_phone_number: number
  ): Promise<ApiResponse<ContactsData>> {
    try {
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

      const availableStatus = await this.getStatusIdBySlug("available");
      if (browserContext.browser_context_status_id !== availableStatus) {
        return {
          success: false,
          message: `Browser context ${browser_context_id} is not available`,
          error: "Context not available",
        };
      }

      this.logger.info("Processing get contact by phone number", {
        contact_phone_number: contact_phone_number,
        browser_context_id: browser_context_id,
      });

      await this.browserContextService.updateBrowserStatus(
        browser_context_id,
        "busy"
      );

      const result =
        await this.puppeteerWhatsAppContactsService.fetchContactByPhoneNumber(
          browserContext,
          contact_phone_number
        );

      await this.browserContextService.updateBrowserStatus(
        browser_context_id,
        "available"
      );

      this.logger.info("Get contact by phone number processed successfully", {
        contact_phone_number,
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        "Error processing fetch contact by phone number",
        error
      );

      await this.browserContextService.updateBrowserStatus(
        browser_context_id,
        "available"
      );

      throw error;
    }
  }

  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await BrowserContextStatus.findOne({ where: { slug } });
    if (!status) {
      throw new Error(`Status ${slug} not found`);
    }
    return status.id;
  }
}
