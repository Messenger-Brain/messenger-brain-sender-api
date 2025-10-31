import { Response } from "express";
import Logger from "../utils/logger";
import { AuthenticatedRequest } from "../types";
import { ContactsService } from "../services/ContactsService";
import WhatsAppSession from "../models/WhatsAppSession";

export class ContactsController {
  private contactsService: ContactsService;
  private logger: typeof Logger;

  constructor() {
    this.contactsService = ContactsService.getInstance();
    this.logger = Logger;
  }

  /**
   * Get contact by phone number
   */
  public getContactByPhoneNumber = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { phoneNumber } = req.params;
      const whatsapp_session_id = 1 // ===== ID TEMPORAL PARA DESARROLLO Y PRUEBAS ===== //
      const contact_phone_number = Number(phoneNumber);

      const whatsappSession = await WhatsAppSession.findByPk(whatsapp_session_id);
      if (!whatsappSession) {
        res.status(404).json({
          success: false,
          message: `WhatsApp session ${whatsapp_session_id} not found`,
        });
        return;
      }

      const browserContextId = whatsappSession.browser_context_id;
      if (!browserContextId) {
        res.status(400).json({
          success: false,
          message: `Session ${whatsapp_session_id} has no browser context assigned`,
        });
        return;
      }

      const result = await this.contactsService.getContactByPhoneNumber(
        browserContextId,
        contact_phone_number
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error("Error getting message by ID", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
