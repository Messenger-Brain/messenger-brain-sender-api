import WhatsAppSession from "../models/WhatsAppSession";
import Logger from "../utils/logger";
import { Request, Response, NextFunction } from "express";

export class WhatsappSessionsTokenMiddleware {

    private static instance: WhatsappSessionsTokenMiddleware;
    private logger: typeof Logger;

    private constructor(loggerInstance: typeof Logger) {
        this.logger = loggerInstance;
    }

    public static getInstance(): WhatsappSessionsTokenMiddleware {
        if (!WhatsappSessionsTokenMiddleware.instance) {
            WhatsappSessionsTokenMiddleware.instance = new WhatsappSessionsTokenMiddleware(Logger);
        }
        return WhatsappSessionsTokenMiddleware.instance;
    }

    public validateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const apiKeyHeader = req.headers['x-whatsapp-api-key'] as string | undefined;
            this.logger.info('API Key Header:', apiKeyHeader);

            if (!apiKeyHeader) {
                res.status(400).json({ message: 'WhatsApp API key is required in header X-WhatsApp-API-Key.' });
                return;
            }

            // Valida si incluye el bearer o no, en caso de que lo incluya lo remueve
            const apiKey = apiKeyHeader.startsWith('Bearer ')
                ? apiKeyHeader.slice(7).trim()
                : apiKeyHeader;

            // Trae la sesión asociada al API key
            const session = await WhatsAppSession.findOne({ where: { api_key: apiKey } });
            if (!session) {
                res.status(401).json({ message: 'Invalid WhatsApp API key.' });
                return;
            }

            // Valida relación del API key con el usuario
            const userId = (req as any).user?.id;
            if (!userId || session.user_id !== userId) {
                res.status(403).json({ message: 'API key does not belong to this user.' });
                return;
            }

            // Guardar la sesión en la request
            (req as any).whatsappSession = session;

            next();
        } catch (error: any) {
            this.logger.error('Error validating WhatsApp API key:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    };

}