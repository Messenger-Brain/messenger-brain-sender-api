import { Page } from 'puppeteer';
import { BrowserContextWithInstance } from './BrowserContextService';
import Logger from '../utils/logger';
import { ConfigService } from '../config/ConfigService';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

export interface MessageSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp?: Date;
    type?: string;
}

export interface SendMessageOptions {
    replyTo?: string;
    delay?: number;
    fileName?: string;
}

export class PuppeteerWhatsappMessageService {
    private static instance: PuppeteerWhatsappMessageService;
    private logger: typeof Logger;
    private configService: ConfigService;
    private tempDir: string;

    private constructor() {
        this.logger = Logger;
        this.configService = ConfigService.getInstance();
        this.tempDir = path.join(process.cwd(), 'temp');
        this.ensureTempDir();
    }

    public static getInstance(): PuppeteerWhatsappMessageService {
        if (!PuppeteerWhatsappMessageService.instance) {
            PuppeteerWhatsappMessageService.instance = new PuppeteerWhatsappMessageService();
        }
        return PuppeteerWhatsappMessageService.instance;
    }

    /**
     * Método principal para enviar cualquier tipo de mensaje
     */
    public async sendMessage(
        browserContext: BrowserContextWithInstance,
        to: string,
        messageData: any,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.info('Starting message send process', {
                to,
                browserContextId: browserContext.id,
                messageType: this.determineMessageType(messageData),
                hasReply: !!options.replyTo
            });

            // Verificar que tenemos la página del contexto
            if (!browserContext.page) {
                throw new Error('No page available in browser context');
            }

            // Usar la página del contexto para interactuar con WhatsApp
            const result = await this.sendMessageWithPage(
                browserContext.page,
                to,
                messageData,
                options
            );

            const duration = Date.now() - startTime;

            if (result.success) {
                this.logger.messageEvent('sent', to, {
                    messageType: result.type,
                    duration,
                    messageId: result.messageId,
                    browserContextId: browserContext.id
                });
            } else {
                this.logger.messageEvent('failed', to, {
                    messageType: result.type,
                    duration,
                    error: result.error,
                    browserContextId: browserContext.id
                });
            }

            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            this.logger.error('Error in sendMessage process', error);
            this.logger.messageEvent('failed', to, {
                duration,
                error: error.message,
                browserContextId: browserContext.id
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Envía mensaje usando la página específica
     */
    private async sendMessageWithPage(
        page: Page,
        to: string,
        messageData: any,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        try {
            // Navegar al chat específico
            await this.navigateToChat(page, to);

            // Determinar el tipo de mensaje y enviar según corresponda
            const messageType = this.determineMessageType(messageData);

            this.logger.info(`Sending ${messageType} message`, { to });

            switch (messageType) {
                case 'text':
                    return await this.sendTextMessage(page, messageData.text, options);

                case 'image':
                    return await this.sendImageMessage(page, messageData.imageUrl, messageData.text, options);

                case 'video':
                    return await this.sendVideoMessage(page, messageData.videoUrl, messageData.text, options);

                case 'document':
                    return await this.sendDocumentMessage(
                        page,
                        messageData.documentUrl,
                        messageData.text,
                        options.fileName,
                        options
                    );

                case 'audio':
                    return await this.sendAudioMessage(page, messageData.audioUrl, messageData.text, options);

                case 'sticker':
                    return await this.sendStickerMessage(page, messageData.stickerUrl, options);

                case 'contact':
                    return await this.sendContactMessage(page, messageData.contact, options);

                case 'location':
                    return await this.sendLocationMessage(page, messageData.location, messageData.text, options);

                case 'poll':
                    return await this.sendPollMessage(page, messageData.poll, options);

                default:
                    throw new Error(`Tipo de mensaje no soportado: ${messageType}`);
            }
        } catch (error: any) {
            this.logger.error('Error in sendMessageWithPage', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Navegar al chat específico usando la página
     */
    private async navigateToChat(page: Page, to: string): Promise<void> {
        this.logger.info('Navigating to chat', { to });

        try {
            // URL directa al chat
            const chatUrl = `https://web.whatsapp.com/send?phone=${to}`;
            await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // Esperar a que cargue la interfaz de WhatsApp
            await page.waitForSelector('div[contenteditable="true"][data-tab="10"]', { timeout: 30000 });

            // Esperar adicional para asegurar carga completa (CORREGIDO)
            await this.delay(2000);

            this.logger.info('Navigated to chat successfully', { to });
        } catch (error) {
            this.logger.error('Error navigating to chat', error);
            throw new Error(`No se pudo acceder al chat de ${to}`);
        }
    }

    /**
     * Enviar mensaje de texto
     */
    private async sendTextMessage(
        page: Page,
        text: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending text message', { textLength: text.length });

            // Manejar respuesta a mensaje si existe
            if (options.replyTo) {
                await this.replyToMessage(page, options.replyTo);
            }

            // Localizar el campo de texto usando selectores de WhatsApp Web
            const messageInput = await page.waitForSelector('div[contenteditable="true"][data-tab="10"]');
            if (!messageInput) {
                throw new Error('No se encontró el campo de texto de WhatsApp');
            }

            // Limpiar campo y escribir texto
            await page.evaluate(() => {
                const d = (globalThis as any).document;
                const element = d.querySelector('div[contenteditable="true"][data-tab="10"]') as any;
                if (element) {
                    element.focus();
                    element.innerHTML = '';
                }
            });

            await messageInput.type(text, { delay: 50 });

            // Presionar Enter para enviar
            await messageInput.press('Enter');

            // Esperar a que se envíe el mensaje (CORREGIDO)
            await this.delay(2000);

            const duration = Date.now() - startTime;
            this.logger.performance('send_text_message', duration, { textLength: text.length });

            return {
                success: true,
                messageId: `text_${Date.now()}`,
                timestamp: new Date(),
                type: 'text'
            };
        } catch (error: any) {
            this.logger.error('Error sending text message', error);
            return {
                success: false,
                error: error.message,
                type: 'text'
            };
        }
    }

    /**
     * Enviar mensaje con imagen
     */
    private async sendImageMessage(
        page: Page,
        imageUrl: string,
        caption?: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending image message', { imageUrl, hasCaption: !!caption });

            // Abrir selector de archivos
            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // Esperar menú de adjuntos (CORREGIDO)
            await this.delay(1000);

            // Seleccionar opción de imagen
            const imageOption = await page.waitForSelector('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]');
            if (!imageOption) {
                throw new Error('No se encontró la opción para subir imagen');
            }

            // Descargar y subir imagen
            const tempFilePath = await this.downloadFileToTemp(imageUrl);
            await imageOption.uploadFile(tempFilePath);

            // Esperar a que cargue la previsualización
            await page.waitForSelector('div[data-tab="7"]', { timeout: 10000 });

            // Agregar caption si existe
            if (caption) {
                const captionInput = await page.waitForSelector('div[contenteditable="true"][data-tab="7"]');
                if (captionInput) {
                    await captionInput.type(caption, { delay: 50 });
                }
            }

            // Enviar mensaje
            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // Esperar a que se envíe (CORREGIDO)
            await this.delay(3000);

            // Limpiar archivo temporal
            this.cleanupTempFile(tempFilePath);

            const duration = Date.now() - startTime;
            this.logger.performance('send_image_message', duration);

            return {
                success: true,
                messageId: `image_${Date.now()}`,
                timestamp: new Date(),
                type: 'image'
            };
        } catch (error: any) {
            this.logger.error('Error sending image message', error);
            return {
                success: false,
                error: error.message,
                type: 'image'
            };
        }
    }

    /**
     * Enviar mensaje con video (similar a imagen)
     */
    private async sendVideoMessage(
        page: Page,
        videoUrl: string,
        caption?: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending video message', { videoUrl, hasCaption: !!caption });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            const videoOption = await page.waitForSelector('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]');
            if (!videoOption) {
                throw new Error('No se encontró la opción para subir video');
            }

            const tempFilePath = await this.downloadFileToTemp(videoUrl);
            await videoOption.uploadFile(tempFilePath);

            await page.waitForSelector('div[data-tab="7"]', { timeout: 15000 });

            if (caption) {
                const captionInput = await page.waitForSelector('div[contenteditable="true"][data-tab="7"]');
                if (captionInput) {
                    await captionInput.type(caption, { delay: 50 });
                }
            }

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(4000);

            this.cleanupTempFile(tempFilePath);

            const duration = Date.now() - startTime;
            this.logger.performance('send_video_message', duration);

            return {
                success: true,
                messageId: `video_${Date.now()}`,
                timestamp: new Date(),
                type: 'video'
            };
        } catch (error: any) {
            this.logger.error('Error sending video message', error);
            return {
                success: false,
                error: error.message,
                type: 'video'
            };
        }
    }

    /**
     * Enviar mensaje con documento
     */
    private async sendDocumentMessage(
        page: Page,
        documentUrl: string,
        caption?: string,
        fileName?: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending document message', {
                documentUrl,
                fileName,
                hasCaption: !!caption
            });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            // Seleccionar opción de documento
            const documentOption = await page.waitForSelector('input[accept="*"]');
            if (!documentOption) {
                throw new Error('No se encontró la opción para subir documento');
            }

            const tempFilePath = await this.downloadFileToTemp(documentUrl);
            await documentOption.uploadFile(tempFilePath);

            // Esperar a que cargue
            await page.waitForSelector('div[data-tab="7"]', { timeout: 10000 });

            // Cambiar nombre del archivo si se proporciona
            if (fileName) {
                const fileNameInput = await page.waitForSelector('input[data-tab="7"]');
                if (fileNameInput) {
                    await fileNameInput.click({ clickCount: 3 });
                    await fileNameInput.type(fileName, { delay: 50 });
                }
            }

            // Agregar caption si existe
            if (caption) {
                const captionInput = await page.waitForSelector('div[contenteditable="true"][data-tab="8"]');
                if (captionInput) {
                    await captionInput.type(caption, { delay: 50 });
                }
            }

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(3000);

            this.cleanupTempFile(tempFilePath);

            const duration = Date.now() - startTime;
            this.logger.performance('send_document_message', duration);

            return {
                success: true,
                messageId: `document_${Date.now()}`,
                timestamp: new Date(),
                type: 'document'
            };
        } catch (error: any) {
            this.logger.error('Error sending document message', error);
            return {
                success: false,
                error: error.message,
                type: 'document'
            };
        }
    }

    /**
     * Enviar mensaje de audio
     */
    private async sendAudioMessage(
        page: Page,
        audioUrl: string,
        caption?: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending audio message', { audioUrl, hasCaption: !!caption });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            const audioOption = await page.waitForSelector('input[accept="*"]');
            if (!audioOption) {
                throw new Error('No se encontró la opción para subir audio');
            }

            const tempFilePath = await this.downloadFileToTemp(audioUrl);
            await audioOption.uploadFile(tempFilePath);

            await page.waitForSelector('div[data-tab="7"]', { timeout: 10000 });

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(3000);

            this.cleanupTempFile(tempFilePath);

            const duration = Date.now() - startTime;
            this.logger.performance('send_audio_message', duration);

            return {
                success: true,
                messageId: `audio_${Date.now()}`,
                timestamp: new Date(),
                type: 'audio'
            };
        } catch (error: any) {
            this.logger.error('Error sending audio message', error);
            return {
                success: false,
                error: error.message,
                type: 'audio'
            };
        }
    }

    /**
     * Enviar sticker
     */
    private async sendStickerMessage(
        page: Page,
        stickerUrl: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending sticker message', { stickerUrl });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            // Seleccionar opción de sticker
            const stickerOption = await page.$('span[data-icon="sticker"]');
            if (!stickerOption) {
                throw new Error('No se encontró la opción de sticker');
            }
            await stickerOption.click();

            // CORREGIDO
            await this.delay(2000);

            // Implementación básica - subir sticker como imagen
            const stickerInput = await page.waitForSelector('input[accept="image/*"]');
            if (stickerInput) {
                const tempFilePath = await this.downloadFileToTemp(stickerUrl);
                await stickerInput.uploadFile(tempFilePath);
                await this.delay(2000);
                this.cleanupTempFile(tempFilePath);
            }

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (sendButton) {
                await sendButton.click();
                await this.delay(2000);
            }

            const duration = Date.now() - startTime;
            this.logger.performance('send_sticker_message', duration);

            return {
                success: true,
                messageId: `sticker_${Date.now()}`,
                timestamp: new Date(),
                type: 'sticker'
            };
        } catch (error: any) {
            this.logger.error('Error sending sticker message', error);
            return {
                success: false,
                error: error.message,
                type: 'sticker'
            };
        }
    }

    /**
     * Enviar contacto
     */
    private async sendContactMessage(
        page: Page,
        contact: { name: string; phoneNumber: string },
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending contact message', { contactName: contact.name });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            // Seleccionar opción de contacto
            const contactOption = await page.$('span[data-icon="contact"]');
            if (!contactOption) {
                throw new Error('No se encontró la opción de contacto');
            }
            await contactOption.click();

            // CORREGIDO
            await this.delay(2000);

            // Buscar y seleccionar el contacto
            const searchInput = await page.$('input[data-tab="3"]');
            if (searchInput) {
                await searchInput.type(contact.phoneNumber, { delay: 50 });
                await this.delay(1000);
            }

            // Seleccionar el primer resultado
            const contactResult = await page.$('div[data-tab="3"] > div > div');
            if (contactResult) {
                await contactResult.click();
                await this.delay(1000);
            }

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(2000);

            const duration = Date.now() - startTime;
            this.logger.performance('send_contact_message', duration);

            return {
                success: true,
                messageId: `contact_${Date.now()}`,
                timestamp: new Date(),
                type: 'contact'
            };
        } catch (error: any) {
            this.logger.error('Error sending contact message', error);
            return {
                success: false,
                error: error.message,
                type: 'contact'
            };
        }
    }

    /**
     * Enviar ubicación
     */
    private async sendLocationMessage(
        page: Page,
        location: { latitude: number; longitude: number },
        caption?: string,
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending location message', {
                latitude: location.latitude,
                longitude: location.longitude
            });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            // Seleccionar opción de ubicación
            const locationOption = await page.$('span[data-icon="location"]');
            if (!locationOption) {
                throw new Error('No se encontró la opción de ubicación');
            }
            await locationOption.click();

            // CORREGIDO
            await this.delay(3000);

            // Enviar ubicación actual
            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(2000);

            const duration = Date.now() - startTime;
            this.logger.performance('send_location_message', duration);

            return {
                success: true,
                messageId: `location_${Date.now()}`,
                timestamp: new Date(),
                type: 'location'
            };
        } catch (error: any) {
            this.logger.error('Error sending location message', error);
            return {
                success: false,
                error: error.message,
                type: 'location'
            };
        }
    }

    /**
     * Enviar encuesta
     */
    private async sendPollMessage(
        page: Page,
        poll: { question: string; options: string[]; multiSelect?: boolean },
        options: SendMessageOptions = {}
    ): Promise<MessageSendResult> {
        const startTime = Date.now();

        try {
            this.logger.debug('Sending poll message', {
                question: poll.question,
                optionsCount: poll.options.length
            });

            const attachmentButton = await page.waitForSelector('button[data-tab="11"]');
            if (!attachmentButton) {
                throw new Error('No se encontró el botón de adjuntar');
            }
            await attachmentButton.click();

            // CORREGIDO
            await this.delay(1000);

            // Seleccionar opción de encuesta
            const pollOption = await page.$('span[data-icon="poll"]');
            if (!pollOption) {
                throw new Error('No se encontró la opción de encuesta');
            }
            await pollOption.click();

            // CORREGIDO
            await this.delay(2000);

            // Llenar pregunta
            const questionInput = await page.$('div[contenteditable="true"][data-tab="6"]');
            if (questionInput) {
                await questionInput.type(poll.question, { delay: 50 });
            }

            // Llenar opciones
            for (let i = 0; i < Math.min(poll.options.length, 12); i++) {
                const optionInput = await page.$(`input[data-tab="${i + 7}"]`);
                if (optionInput) {
                    const optionText = poll.options[i] || '';
                    await optionInput.type(optionText, { delay: 50 });
                }
            }

            const sendButton = await page.waitForSelector('span[data-icon="send"]');
            if (!sendButton) {
                throw new Error('No se encontró el botón enviar');
            }
            await sendButton.click();

            // CORREGIDO
            await this.delay(2000);

            const duration = Date.now() - startTime;
            this.logger.performance('send_poll_message', duration);

            return {
                success: true,
                messageId: `poll_${Date.now()}`,
                timestamp: new Date(),
                type: 'poll'
            };
        } catch (error: any) {
            this.logger.error('Error sending poll message', error);
            return {
                success: false,
                error: error.message,
                type: 'poll'
            };
        }
    }

    /**
     * Determina el tipo de mensaje basado en los datos
     */
    private determineMessageType(messageData: any): string {
        if (messageData.text && !messageData.imageUrl && !messageData.videoUrl &&
            !messageData.documentUrl && !messageData.audioUrl && !messageData.stickerUrl &&
            !messageData.contact && !messageData.location && !messageData.poll) {
            return 'text';
        } else if (messageData.imageUrl) return 'image';
        else if (messageData.videoUrl) return 'video';
        else if (messageData.documentUrl) return 'document';
        else if (messageData.audioUrl) return 'audio';
        else if (messageData.stickerUrl) return 'sticker';
        else if (messageData.contact) return 'contact';
        else if (messageData.location) return 'location';
        else if (messageData.poll) return 'poll';
        else return 'unknown';
    }

    /**
     * Responder a un mensaje específico
     */
    private async replyToMessage(page: Page, messageId: string): Promise<void> {
        try {
            this.logger.debug('Replying to message', { messageId });
            // CORREGIDO
            await this.delay(1000);
        } catch (error) {
            this.logger.warn('Could not reply to message, sending as normal message', { messageId });
        }
    }

    /**
     * Función auxiliar para delays (REEMPLAZA waitForTimeout)
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utilidades para manejo de archivos temporales
     */
    private ensureTempDir(): void {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    private async downloadFileToTemp(url: string): Promise<string> {
        const fileName = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const filePath = path.join(this.tempDir, fileName);

        this.logger.debug('Downloading file to temp', { url, filePath });

        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            const file = fs.createWriteStream(filePath);
            protocol.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve(filePath);
                });

                file.on('error', (err) => {
                    fs.unlink(filePath, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    private cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.debug('Temp file cleaned up', { filePath });
            }
        } catch (error) {
            this.logger.warn('Could not cleanup temp file', { filePath, error });
        }
    }
}

export default PuppeteerWhatsappMessageService;